from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Transaction, VerificationCode

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_verified', 'theme', 'language']
    fieldsets = UserAdmin.fieldsets + (
        ('S&F Personal Settings', {'fields': ('theme', 'language', 'profile_photo', 'is_verified')}),
    )

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'type', 'category', 'reason', 'date']
    list_filter = ['type', 'category', 'date'] 
    search_fields = ['category', 'reason', 'user__email']

@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'created_at']

admin.site.register(User, CustomUserAdmin)