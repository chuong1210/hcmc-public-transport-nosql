from app import create_app
from app.config import Config
# venv\Scripts\activate  # Windows

app = create_app('development')

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )