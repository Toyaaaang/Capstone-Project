"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
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
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/authentication/', include('authentication.urls')),
    path('api/budget/', include('budget.urls')),
    # path('api/employees/', include('employees.urls')),
    path('api/engineering/', include('engineering.urls')),
    # path('api/manager/', include('manager.urls')),
    path('api/notification/', include('notification.urls')),
    # path('api/OpMaintainance/', include('OpMaintainance.urls')),
    path('api/warehouse-admin/', include('warehouse_admin.urls')),
    path('api/warehouse/', include('warehouse.urls')),
    path('api/po_rv/', include('po_rv.urls')),
    path('api/requisition-voucher/', include('requisition_voucher.urls')),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
