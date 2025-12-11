from django.apps import AppConfig


class HorsesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'horses'
    verbose_name = 'Бронирование лошадей'

    def ready(self):
        # Импортируем сигналы
        try:
            import horses.signals
        except ImportError:
            pass