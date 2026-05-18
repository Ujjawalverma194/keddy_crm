from django.urls import path
from . import views 

app_name = 'jd_mapping'

urlpatterns = [
    # API 1: CREATE REQUIREMENT
    path('api/requirements/', views.RequirementCreateAPIView.as_view(), name='requirement-create'),
    
    # Baaki APIs (abhi implement nahi, but paths ready)
    path('api/requirements/list/', views.RequirementListAPIView.as_view(), name='requirement-list'),
    # path('api/requirements/<int:pk>/', views.RequirementDetailAPIView.as_view(), name='requirement-detail'),
    path('api/requirements/<int:pk>/update/', views.RequirementUpdateAPIView.as_view(), name='requirement-update'),
    path('api/requirements/<int:pk>/delete/', views.RequirementDeleteAPIView.as_view(), name='requirement-delete'),
    # New API for full requirement details
    # path('api/requirements/<int:pk>/full-detail/', views.RequirementFullDetailAPIView.as_view(), name='requirement-full-detail'),
     path('api/requirements/<int:pk>/', views.RequirementDetailAPIView.as_view(), name='requirement-detail'),
    
    # Assignment APIs
    path('api/assignments/', views.AssignmentListAPIView.as_view(), name='assignment-list'),
    path('api/assignments/create/', views.AssignmentCreateAPIView.as_view(), name='assignment-create'),
    path('api/assignments/<int:pk>/', views.AssignmentDetailAPIView.as_view(), name='assignment-detail'),
    path('api/assignments/<int:pk>/delete/', views.AssignmentDeleteAPIView.as_view(), name='assignment-delete'),
    
    # Submission API's
    # path('submissions/', views.CandidateSubmissionListAPIView.as_view(), name='submission-list'),
    path('api/submissions/create/', views.CandidateSubmissionCreateAPIView.as_view(), name='submission-create'),
    path('api/submissions/<int:pk>/delete/', views.CandidateSubmissionDeleteAPIView.as_view(), name='submission-delete'),
    path('my-jds/', views.MyJDsAPIView.as_view(), name='my-jds'),
    #sub-admin
    path('company-jds/', views.CompanyJDsAPIView.as_view(), name='company-jds'),
    
    #=====Status - update =====
    path('requirements/<int:pk>/update-status/', views.RequirementStatusUpdateView.as_view(), name='update-status'),
    path('company-available-requirements/', views.CompanyAvailableRequirementsAPIView.as_view(), name='company-available-requirements'),
    #=================================================================================================================
    
]