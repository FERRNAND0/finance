from django.contrib.auth.models import AbstractUser
from django.db import models
import random
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    # Настройки из твоего UI
    THEME_CHOICES = [('dark', 'Dark'), ('light', 'Light')]
    LANG_CHOICES = [('en', 'English'), ('ru', 'Russian'), ('uzb', 'Uzbek')]

    email = models.EmailField(unique=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='dark')
    language = models.CharField(max_length=5, choices=LANG_CHOICES, default='ru')
    is_verified = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

class Transaction(models.Model):
    TYPE_CHOICES = [('income', 'Income'), ('spending', 'Spending')]
    category = models.CharField(max_length=50, default='Другое')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reason = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

class VerificationCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(minutes=10)

    @staticmethod
    def generate_code():
        return str(random.randint(100000, 999999))


