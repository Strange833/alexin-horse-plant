# signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import HorseBooking

@receiver(pre_save, sender=HorseBooking)
def update_booking_status(sender, instance, **kwargs):
    """
    Автоматическое обновление статуса при оплате
    """
    if instance.is_paid and instance.status == 'confirmed':
        instance.status = 'completed'

@receiver(post_save, sender=HorseBooking)
def send_booking_notification(sender, instance, created, **kwargs):
    """
    Отправка уведомлений при создании бронирования
    """
    if created and instance.user and instance.user.email:
        try:
            subject = f'Подтверждение бронирования лошади {instance.horse.name}'
            message = f"""
            Здравствуйте, {instance.client_name}!
            
            Ваше бронирование подтверждено:
            Лошадь: {instance.horse.name}
            Дата: {instance.booking_date.strftime('%d.%m.%Y')}
            Время: {instance.booking_time.strftime('%H:%M')}
            Длительность: {instance.duration_hours} час.
            Стоимость: {instance.total_price} руб.
            
            Номер брони: BK{instance.created_at.strftime('%Y%m%d')}{str(instance.id).hex[:8].upper()}
            
            С уважением,
            Алексинский конный завод
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Ошибка отправки email: {e}")