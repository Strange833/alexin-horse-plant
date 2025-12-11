import os
from django.core.wsgi import get_wsgi_application

# Добавьте эти строки ПЕРЕД get_wsgi_application()


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'horse_plant.settings')
from whitenoise import WhiteNoise
application = get_wsgi_application()
application = WhiteNoise(application)  # Добавьте эту строку