// Функция для загрузки бронирований в профиль
function loadHorseBookings() {
    fetch('/profile/horse-bookings/')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.bookings.length > 0) {
                renderHorseBookings(data.bookings);
                updateBookingStats(data.bookings);
            } else {
                showNoHorseBookings();
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки бронирований:', error);
        });
}

function renderHorseBookings(bookings) {
    const container = document.getElementById('horseBookingsContainer');
    container.innerHTML = '';
    
    bookings.forEach(booking => {
        const bookingCard = document.createElement('div');
        bookingCard.className = 'booking-card';
        
        let statusBadge = '';
        if (booking.status === 'confirmed') {
            statusBadge = `<span class="status-badge status-confirmed">${booking.status_display}</span>`;
        } else if (booking.status === 'pending') {
            statusBadge = `<span class="status-badge status-pending">${booking.status_display}</span>`;
        } else if (booking.status === 'cancelled') {
            statusBadge = `<span class="status-badge status-cancelled">${booking.status_display}</span>`;
        }
        
        let discountBadge = '';
        if (booking.discount_percent > 0) {
            discountBadge = `<span class="discount-badge">-${booking.discount_percent}%</span>`;
        }
        
        bookingCard.innerHTML = `
            <div class="booking-header">
                <h4>${booking.horse_name}</h4>
                ${statusBadge}
            </div>
            <div class="booking-body">
                <div class="booking-info">
                    <p><strong>Порода:</strong> ${booking.horse_breed}</p>
                    <p><strong>Дата и время:</strong> ${booking.booking_date} в ${booking.booking_time}</p>
                    <p><strong>Стоимость:</strong> <span class="price">${booking.total_price.toLocaleString('ru-RU')} ₽</span></p>
                    ${booking.discount_percent > 0 ? `<p><strong>Ваша скидка:</strong> <span class="discount">${booking.discount_percent}%</span></p>` : ''}
                    <p><strong>Номер брони:</strong> ${booking.booking_number}</p>
                </div>
            </div>
            <div class="booking-actions">
                ${booking.status === 'pending' || booking.status === 'confirmed' ? 
                    `<button class="btn-cancel" onclick="cancelBooking('${booking.id}')">Отменить бронь</button>` : 
                    ''}
            </div>
        `;
        
        container.appendChild(bookingCard);
    });
}

function showNoHorseBookings() {
    const container = document.getElementById('horseBookingsContainer');
    container.innerHTML = `
        <div class="no-orders">
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">📅 У вас пока нет бронирований</p>
            <p style="color: var(--light-text); margin-bottom: 2rem;">Забронируйте свою первую лошадь для верховой езды</p>
            <button class="btn-upgrade premium" onclick="window.location.href='/horses/'">
                🐎 Забронировать лошадь
            </button>
        </div>
    `;
}

function updateBookingStats(bookings) {
    // Обновляем статистику на странице профиля
    const statsElement = document.getElementById('statsContainer');
    if (statsElement) {
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const totalSpent = bookings.filter(b => b.status !== 'cancelled')
                                   .reduce((sum, b) => sum + b.total_price, 0);
        
        // Обновляем значения статистики
        document.getElementById('bookingsCount')?.textContent = bookings.length;
        document.getElementById('confirmedBookingsCount')?.textContent = confirmedBookings;
        document.getElementById('horseBookingTotal')?.textContent = totalSpent.toLocaleString('ru-RU') + ' ₽';
    }
}

function cancelBooking(bookingId) {
    if (confirm('Вы уверены, что хотите отменить бронирование?')) {
        fetch(`/horses/cancel-booking/${bookingId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Бронирование успешно отменено', 'success');
                loadHorseBookings(); // Перезагружаем список
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка отмены брони:', error);
            showNotification('Ошибка отмены брони', 'error');
        });
    }
}

// Функция для получения CSRF токена
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Загружаем бронирования при загрузке страницы профиля
if (window.location.pathname.includes('/profile/')) {
    document.addEventListener('DOMContentLoaded', function() {
        loadHorseBookings();
    });
}