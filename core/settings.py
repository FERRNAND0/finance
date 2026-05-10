import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
# Корень проекта
load_dotenv() # <-- ДОБАВИТЬ ЭТО
BASE_DIR = Path(__file__).resolve().parent.parent

# Секретный ключ для разработки (сгенерирован случайно)
# Было: SECRET_KEY = 'django-insecure-s&f...'
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
ROOT_URLCONF = 'core.urls'  

# Режим отладки (выключи в продакшене!)
DEBUG = False

# Укажи здесь свой домен и IP сервера Contabo
ALLOWED_HOSTS = ['finance.lxv.uz', '75.119.144.200']

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

INSTALLED_APPS = [
    # Стандартные приложения Django (обязательно!)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Сторонние библиотеки
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Твое приложение
    'core', 
]
WSGI_APPLICATION = 'core.wsgi.application'
# ОЧЕНЬ ВАЖНО: Укажи Django использовать твою кастомную модель пользователя
AUTH_USER_MODEL = 'core.User'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
# Разрешаем твоему фронтенду слать запросы
CORS_ALLOWED_ORIGINS = [
"https://finance.lxv.uz",
    "http://finance.lxv.uz",    # <-- И это (если будешь запускать без порта 5173)
]
CSRF_TRUSTED_ORIGINS = ["https://finance.lxv.uz"]
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# Конфиг JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),
}
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sf_db',
        'USER': 'sf_user',
        'PASSWORD': os.getenv('DB_PASSWORD'), # <-- БЕРЕМ ПАРОЛЬ ИЗ .ENV
        'HOST': 'localhost', 
        'PORT': '5432',
    }
}
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# URL для обращения к статическим файлам
STATIC_URL = 'static/'

# Папка, куда будут собираться все файлы при деплое (создастся сама)
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
# URL для загруженных пользователем файлов (например, фото профиля)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# core/settings.py
import os

# Сюда вставь свой реальный ключ (начинается на sk-...)
# Было: OPENAI_API_KEY = "sk-proj-..."
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
# Настройки SMTP для отправки писем (Gmail)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

