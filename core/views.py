from rest_framework import status, views, generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, VerificationCode, Transaction
from .serializers import RegisterSerializer, UserSerializer, TransactionSerializer, CustomTokenObtainPairSerializer
from django.core.mail import send_mail
from django.conf import settings
# --- НОВАЯ ВЬЮХА ДЛЯ ЛОГИНА ---
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            code = VerificationCode.generate_code()
            VerificationCode.objects.update_or_create(user=user, defaults={'code': code})
            
            # --- ОТПРАВЛЯЕМ РЕАЛЬНОЕ ПИСЬМО ---
            subject = 'Код подтверждения S&F'
            message = f'Здравствуйте, {user.first_name}!\n\nВаш код подтверждения: {code}\n\nНикому не сообщайте этот код. Если это были не вы, просто проигнорируйте письмо.'
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Ошибка отправки письма: {e}")
                return Response({"error": "Не удалось отправить письмо"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            # ----------------------------------
            
            return Response({"message": "Код отправлен на почту"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class VerifyCodeView(views.APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        try:
            user = User.objects.get(email=email)
            verify_record = VerificationCode.objects.get(user=user, code=code)
            if verify_record.is_valid():
                user.is_active = True
                user.is_verified = True
                user.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            return Response({"error": "Код просрочен или неверен"}, status=status.HTTP_400_BAD_REQUEST)
        except:
            return Response({"error": "Ошибка валидации"}, status=status.HTTP_400_BAD_REQUEST)

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

class TransactionDeleteView(generics.DestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import json
from openai import OpenAI

from .models import Transaction
class AITipsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Если ключ не настроен, возвращаем ошибку
        if not getattr(settings, 'OPENAI_API_KEY', None):
            return Response({"error": "OpenAI API Key is not configured on the server"}, status=500)

        # --- ИЗВЛЕКАЕМ ЯЗЫК ИЗ ЗАПРОСА ---
        user_lang_code = request.GET.get('lang', 'ru') # Получаем язык с фронтенда (по умолчанию ru)
        
        # Маппинг кодов в полные названия (чтобы ChatGPT точно понял, какой язык нужен)
        lang_map = {
            'en': 'English',
            'ru': 'Russian',
            'uzb': 'Uzbek',
            'kk': 'Kazakh',
            'ky': 'Kyrgyz',
            'de': 'German',
            'lb': 'Luxembourgish'
        }
        target_language = lang_map.get(user_lang_code, 'English')

        # 2. Собираем транзакции пользователя за последние 7 дней
        one_week_ago = timezone.now().date() - timedelta(days=7)
        recent_txs = Transaction.objects.filter(user=request.user, date__gte=one_week_ago)

        if not recent_txs.exists():
            return Response({"tip": "Add transactions this week to get an AI tip."})

        # 3. Подготавливаем данные для AI (группируем траты)
        spending_total = 0
        income_total = 0
        categories = {}

        for tx in recent_txs:
            amount = float(tx.amount)
            if tx.type == 'spending':
                spending_total += amount
                categories[tx.category] = categories.get(tx.category, 0) + amount
            else:
                income_total += amount
                
        # 4. Формируем промпт на английском (GPT лучше понимает команды на англ) 
        # и жестко требуем ответ на выбранном языке
        prompt = (
            f"I am analyzing my finances. Last week my income was ${income_total:.2f}, "
            f"and my expenses were ${spending_total:.2f}. "
            f"My spending by category: {json.dumps(categories, ensure_ascii=False)}. "
            f"Give me ONE brief financial insight and recommend a daily spending limit for next week. "
            f"Keep it under 4 sentences. YOU MUST REPLY ENTIRELY IN {target_language.upper()} LANGUAGE."
        )

        # 5. Делаем запрос к OpenAI
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": f"You are a financial advisor integrated into an app. You must respond in {target_language}."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=200, # Увеличил лимит, так как немецкий и казахский могут быть длиннее
                temperature=0.7
            )
            ai_tip = response.choices[0].message.content
            return Response({"tip": ai_tip})
            
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return Response({"error": "Ошибка при обращении к AI-сервису."}, status=500)
class TransactionDeleteAllView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    # Используем POST вместо DELETE, так как мы передаем данные (пароль) в теле запроса
    def post(self, request):
        password = request.data.get('password')
        
        if not password:
            return Response({"error": "Пароль обязателен для этого действия"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Django сам проверяет, совпадает ли пароль
        if not request.user.check_password(password):
            return Response({"error": "Неверный пароль"}, status=status.HTTP_403_FORBIDDEN)

        # Если пароль верный — удаляем
        Transaction.objects.filter(user=request.user).delete()
        return Response({"message": "Все транзакции удалены"}, status=status.HTTP_200_OK)

class UserProfileUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        
        # Обновляем почту (с проверкой на уникальность)
        if 'email' in data and data['email'] != user.email:
            if User.objects.filter(email=data['email']).exists():
                return Response({"error": "Этот Email уже используется кем-то другим"}, status=status.HTTP_400_BAD_REQUEST)
            user.email = data['email']
            user.username = data['email'] # В Django username и email у нас совпадают
            
        # Обновляем имя и фамилию
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
            
        # Обновляем пароль, если он передан
        if 'password' in data and data['password'].strip():
            user.set_password(data['password'])
            
        user.save()
        return Response(UserSerializer(user).data)