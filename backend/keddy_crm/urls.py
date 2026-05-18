from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include



urlpatterns = [
    path('', include('landing.urls')),
    path('central-admin/', include('central_admin.urls', namespace='central_admin')),
    path('sub-admin/', include('sub_admin.urls', namespace='sub_admin')), 
    path('employee-portal/', include('employee_portal.urls', namespace='employee_portal')),
    
    path('calendar/', include('calendar_service.urls')),
    path("invoice/", include("invoicing.urls")),
    path('jd-mapping/', include('jd_mapping.urls')),
     path('attendance/', include('attendance_tracker.urls')),

]
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
    
