"""
URL configuration for lexai_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
import os

def serve_frontend(request, path_name=""):
    frontend_dir = os.path.join(settings.BASE_DIR, 'frontend')
    if not path_name:
        path_name = "index.html"
        
    file_path = os.path.join(frontend_dir, path_name)
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            content = f.read()
        content_type = "text/html"
        if file_path.endswith(".css"): content_type = "text/css"
        elif file_path.endswith(".js"): content_type = "text/javascript"
        return HttpResponse(content, content_type=content_type)
    return HttpResponse("Not Found", status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('legal.urls')),
    path('', serve_frontend),
    path('<path:path_name>', serve_frontend),
]
