from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    path('queries/', views.legal_query_list, name='query-list'),
    path('queries/<int:pk>/', views.legal_query_detail, name='query-detail'),
    path('upload-document/', views.upload_document, name='upload-document'),
]