from django.contrib import admin
from django.urls import path
from .views import (
    RegisterView, VerifyCodeView, TransactionListCreateView, 
    TransactionDeleteView, CustomLoginView, AITipsView, TransactionDeleteAllView,
    UserProfileUpdateView, PiggyBankView, AIChatView
)

urlpatterns = [
    path('admin/', admin.site.urls), 
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/verify/', VerifyCodeView.as_view(), name='verify'),
    path('api/auth/login/', CustomLoginView.as_view(), name='login'),
    path('api/auth/update/', UserProfileUpdateView.as_view(), name='update-profile'),
    
    # ИСПРАВЛЕНИЕ: Добавили 'api/' в начало путей
    path('api/piggybank/', PiggyBankView.as_view(), name='piggybank'), 
    path('api/chat/', AIChatView.as_view(), name='ai-chat'), 
    
    path('api/transactions/', TransactionListCreateView.as_view(), name='transactions'),
    path('api/transactions/<int:pk>/', TransactionDeleteView.as_view(), name='transaction-delete'),
    path('api/transactions/delete-all/', TransactionDeleteAllView.as_view(), name='transaction-delete-all'),
    path('api/ai-tips/', AITipsView.as_view(), name='ai-tips'),
]