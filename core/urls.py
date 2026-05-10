from django.contrib import admin
from django.urls import path
from .views import (
    RegisterView, VerifyCodeView, TransactionListCreateView, 
    TransactionDeleteView, CustomLoginView, AITipsView, TransactionDeleteAllView,
    UserProfileUpdateView # <-- ИМПОРТИРУЕМ НОВУЮ ВЬЮХУ
)

urlpatterns = [
    path('admin/', admin.site.urls), 
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/verify/', VerifyCodeView.as_view(), name='verify'),
    path('api/auth/login/', CustomLoginView.as_view(), name='login'),
    
    # --- НОВЫЙ ПУТЬ ДЛЯ ОБНОВЛЕНИЯ ПРОФИЛЯ ---
    path('api/auth/update/', UserProfileUpdateView.as_view(), name='update-profile'),
    
    path('api/transactions/delete-all/', TransactionDeleteAllView.as_view(), name='transaction-delete-all'),
    path('api/transactions/', TransactionListCreateView.as_view(), name='transactions'),
    path('api/transactions/<int:pk>/', TransactionDeleteView.as_view(), name='transaction-delete'),
    path('api/ai-tips/', AITipsView.as_view(), name='ai-tips'),
]