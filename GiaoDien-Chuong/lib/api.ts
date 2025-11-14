import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                headers: { Authorization: `Bearer ${refreshToken}` }
              });
              const { access_token } = response.data;
              localStorage.setItem('access_token', access_token);
              
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Stations
  async getStations(params?: { status?: string; type?: string }) {
    const response = await this.client.get('/stations', { params });
    return response.data;
  }

  async getStation(id: string) {
    const response = await this.client.get(`/stations/${id}`);
    return response.data;
  }

  async createStation(data: any) {
    const response = await this.client.post('/stations', data);
    return response.data;
  }

  async updateStation(id: string, data: any) {
    const response = await this.client.put(`/stations/${id}`, data);
    return response.data;
  }

  async deleteStation(id: string) {
    const response = await this.client.delete(`/stations/${id}`);
    return response.data;
  }

  // Routes
  async getRoutes(params?: { status?: string; type?: string }) {
    const response = await this.client.get('/routes', { params });
    return response.data;
  }

  async getRoute(id: string) {
    const response = await this.client.get(`/routes/${id}`);
    return response.data;
  }

  async createRoute(data: any) {
    const response = await this.client.post('/routes', data);
    return response.data;
  }

  async updateRoute(id: string, data: any) {
    const response = await this.client.put(`/routes/${id}`, data);
    return response.data;
  }

  async deleteRoute(id: string) {
    const response = await this.client.delete(`/routes/${id}`);
    return response.data;
  }

  // Vehicles
  async getVehicles(params?: { status?: string; type?: string; route_id?: string }) {
    const response = await this.client.get('/vehicles', { params });
    return response.data;
  }

  async getVehicle(id: string) {
    const response = await this.client.get(`/vehicles/${id}`);
    return response.data;
  }

  async createVehicle(data: any) {
    const response = await this.client.post('/vehicles', data);
    return response.data;
  }

  async updateVehicle(id: string, data: any) {
    const response = await this.client.put(`/vehicles/${id}`, data);
    return response.data;
  }

  async deleteVehicle(id: string) {
    const response = await this.client.delete(`/vehicles/${id}`);
    return response.data;
  }

  async assignVehicleToRoute(vehicleId: string, data: { route_id: string; shift?: string }) {
    const response = await this.client.post(`/vehicles/${vehicleId}/assign`, data);
    return response.data;
  }

  // Schedules
  async getSchedules(params?: { route_id?: string; vehicle_id?: string; day_of_week?: string }) {
    const response = await this.client.get('/schedules', { params });
    return response.data;
  }

  async createSchedule(data: any) {
    const response = await this.client.post('/schedules', data);
    return response.data;
  }

  async deleteSchedule(id: string) {
    const response = await this.client.delete(`/schedules/${id}`);
    return response.data;
  }

  // Journey
  async findShortestPath(data: { from_station_id: string; to_station_id: string }) {
    const response = await this.client.post('/journey/shortest-path', data);
    return response.data;
  }

  async findRoutesBetween(data: { from_station_id: string; to_station_id: string }) {
    const response = await this.client.post('/journey/routes-between', data);
    return response.data;
  }

  async findNearbyStations(params: { latitude: number; longitude: number; radius?: number }) {
    const response = await this.client.get('/journey/nearby-stations', { params });
    return response.data;
  }

  // Analytics
  async getAnalyticsOverview() {
    const response = await this.client.get('/analytics/overview');
    return response.data;
  }

  async getStationsByType() {
    const response = await this.client.get('/analytics/stations-by-type');
    return response.data;
  }

  async getStationsByDistrict() {
    const response = await this.client.get('/analytics/stations-by-district');
    return response.data;
  }

  async getRoutesByType() {
    const response = await this.client.get('/analytics/routes-by-type');
    return response.data;
  }

  async getBusiestStations(limit: number = 10) {
    const response = await this.client.get('/analytics/busiest-stations', {
      params: { limit }
    });
    return response.data;
  }

  async getRouteCoverage() {
    const response = await this.client.get('/analytics/route-coverage');
    return response.data;
  }

  async getVehiclesUtilization() {
    const response = await this.client.get('/analytics/vehicles-utilization');
    return response.data;
  }

  // Auth
  async login(credentials: { username: string; password: string }) {
    const response = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  // Users
  async getUsers(params?: { role?: string; status?: string }) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async getUser(username: string) {
    const response = await this.client.get(`/users/${username}`);
    return response.data;
  }

  async updateUser(username: string, data: any) {
    const response = await this.client.put(`/users/${username}`, data);
    return response.data;
  }

  async deleteUser(username: string) {
    const response = await this.client.delete(`/users/${username}`);
    return response.data;
  }
}

export const api = new ApiClient();