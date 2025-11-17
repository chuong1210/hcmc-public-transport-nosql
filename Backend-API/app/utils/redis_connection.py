import redis
import json
import os
from functools import wraps
from flask import request
import hashlib

class RedisConnection:
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisConnection, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self.connect()
    
    def connect(self):
        """Connect to Redis"""
        try:
            self._client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                password=os.getenv('REDIS_PASSWORD', None),
                db=int(os.getenv('REDIS_DB', 0)),
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True
            )
            # Test connection
            self._client.ping()
            print("✅ Redis connected successfully")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            self._client = None
    
    def get_client(self):
        """Get Redis client"""
        if self._client is None:
            self.connect()
        return self._client
    
    def is_connected(self):
        """Check if Redis is connected"""
        try:
            if self._client:
                self._client.ping()
                return True
        except:
            pass
        return False

# Global instance
redis_connection = RedisConnection()

def generate_cache_key(prefix, **kwargs):
    """Generate cache key from parameters"""
    # Sort kwargs to ensure consistent key generation
    sorted_params = sorted(kwargs.items())
    params_str = json.dumps(sorted_params, sort_keys=True)
    params_hash = hashlib.md5(params_str.encode()).hexdigest()
    return f"{prefix}:{params_hash}"

def cache_response(ttl=None, key_prefix=None):
    """
    Decorator to cache Flask route responses in Redis
    
    Usage:
        @cache_response(ttl=300, key_prefix='stations')
        def get_stations():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get Redis client
            redis_client = redis_connection.get_client()
            
            # If Redis is not available, skip caching
            if not redis_client or not redis_connection.is_connected():
                return f(*args, **kwargs)
            
            # Generate cache key
            prefix = key_prefix or f.__name__
            cache_params = {
                'args': str(args),
                'kwargs': str(kwargs),
                'query': str(request.args.to_dict()) if request else '',
                'path': request.path if request else ''
            }
            cache_key = generate_cache_key(prefix, **cache_params)
            
            # Try to get from cache
            try:
                cached = redis_client.get(cache_key)
                if cached:
                    print(f"🎯 Cache HIT: {cache_key}")
                    return json.loads(cached)
            except Exception as e:
                print(f"⚠️  Cache read error: {e}")
            
            # Execute function
            result = f(*args, **kwargs)
            
            # Cache the result
            try:
                cache_ttl = ttl or int(os.getenv('REDIS_TTL', 300))
                redis_client.setex(
                    cache_key,
                    cache_ttl,
                    json.dumps(result)
                )
                print(f"💾 Cache SET: {cache_key} (TTL: {cache_ttl}s)")
            except Exception as e:
                print(f"⚠️  Cache write error: {e}")
            
            return result
        
        return decorated_function
    return decorator

def invalidate_cache(pattern):
    """
    Invalidate cache by pattern
    
    Usage:
        invalidate_cache('stations:*')
    """
    redis_client = redis_connection.get_client()
    if not redis_client:
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            print(f"🗑️  Invalidated {len(keys)} cache keys matching: {pattern}")
    except Exception as e:
        print(f"⚠️  Cache invalidation error: {e}")

def cache_query_result(key, data, ttl=None):
    """Manually cache query result"""
    redis_client = redis_connection.get_client()
    if not redis_client:
        return False
    
    try:
        cache_ttl = ttl or int(os.getenv('REDIS_TTL', 300))
        redis_client.setex(key, cache_ttl, json.dumps(data))
        return True
    except Exception as e:
        print(f"⚠️  Cache write error: {e}")
        return False

def get_cached_query_result(key):
    """Get cached query result"""
    redis_client = redis_connection.get_client()
    if not redis_client:
        return None
    
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"⚠️  Cache read error: {e}")
    
    return None