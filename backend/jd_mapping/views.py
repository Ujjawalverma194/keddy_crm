from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.db.models import Q
from .models import Requirement
from .serializers import RequirementCreateSerializer, RequirementStatusUpdateSerializer,RequirementListSerializer, RequirementDetailSerializer
from landing.models import User

class IsAuthenticatedAndActive(permissions.BasePermission):
    """Check if user is authenticated and active"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class CanCreateRequirement(permissions.BasePermission):
    """Check if user can create requirement"""
    def has_permission(self, request, view):
        user = request.user
        # Central Admin, Sub-Admin, Employee sab create kar sakte hain
        return user.role in ['CENTRAL_ADMIN', 'SUB_ADMIN', 'EMPLOYEE']


class RequirementCreateAPIView(generics.CreateAPIView):
    """
    API 1: CREATE REQUIREMENT
    POST /api/jd/requirements/
    
    Access: All (Central Admin, Sub-Admin, Employee)
    Auto Fields: requirement_id, created_by, created_at, company
    Skills: Auto-extracted from JD if not provided
    """
    queryset = Requirement.objects.all()
    serializer_class = RequirementCreateSerializer
    permission_classes = [IsAuthenticatedAndActive, CanCreateRequirement]
    
    def perform_create(self, serializer):
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Response mein auto-generated fields bhi dikhao
        response_data = {
            "message": "Requirement created successfully",
            "requirement": {
                "id": serializer.instance.id,
                "requirement_id": serializer.instance.requirement_id,
                "title": serializer.instance.title,
                "client": serializer.instance.client.company_name,
                "experience_required": serializer.instance.experience_required,
                "rate": serializer.instance.rate,
                "vendor_budget_range" : serializer.instance.vendor_budget_range,
                "time_zone": serializer.instance.time_zone,
                "skills": serializer.instance.skills,
                "created_by": serializer.instance.created_by.email,
                "created_at": serializer.instance.created_at,
                "company": serializer.instance.company.email if serializer.instance.company else None
            }
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
import django_filters

# ================= PAGINATION =================
class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination class"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'message': 'Requirements fetched successfully',
            'pagination': {
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'total_items': self.page.paginator.count,
                'page_size': self.get_page_size(self.request),
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
            },
            'results': data
        })


# ================= FILTERS =================
class RequirementFilter(django_filters.FilterSet):
    """Advanced filters for Requirement"""
    
    # Client name filter (icontains)
    client_name = django_filters.CharFilter(
        field_name='client__company_name',
        lookup_expr='icontains',
        label='Client Name'
    )
    
    # Experience filter (exact, range, min, max)
    experience = django_filters.CharFilter(
        field_name='experience_required',
        lookup_expr='icontains',
        label='Experience'
    )
    
    # Rate filter (icontains because it's CharField)
    rate = django_filters.CharFilter(
        field_name='rate',
        lookup_expr='icontains',
        label='Rate'
    )
    
    # Skills filter (icontains)
    skills = django_filters.CharFilter(
        field_name='skills',
        lookup_expr='icontains',
        label='Skills'
    )
    
    # Title filter
    title = django_filters.CharFilter(
        field_name='title',
        lookup_expr='icontains',
        label='Title'
    )
    
    # Requirement ID filter (exact)
    requirement_id = django_filters.CharFilter(
        field_name='requirement_id',
        lookup_expr='exact',
        label='Requirement ID'
    )
    
    # Created date range filters
    created_after = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='Created After (YYYY-MM-DD)'
    )
    created_before = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='Created Before (YYYY-MM-DD)'
    )
    
    # Company filter (for Central Admin only)
    company_id = django_filters.NumberFilter(
        field_name='company__id',
        lookup_expr='exact',
        label='Company ID'
    )
    
    # Created by filter
    created_by_id = django_filters.NumberFilter(
        field_name='created_by__id',
        lookup_expr='exact',
        label='Created By User ID'
    )
    
    class Meta:
        model = Requirement
        fields = [
            'client_name', 'experience', 'rate', 'skills', 
            'title', 'requirement_id', 'created_after', 
            'created_before', 'company_id', 'created_by_id'
        ]


class RequirementListAPIView(generics.ListAPIView):
    """
    API 2: LIST REQUIREMENTS with Search, Filters & Pagination
    GET /api/jd/requirements/list/
    
    Features:
    - Search by: title, skills, jd_description, requirement_id
    - Filters: client_name, experience, rate, skills, title, requirement_id
    - Pagination: 20 items per page
    - Company-wise isolation
    """
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = RequirementListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [
        DjangoFilterBackend, 
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    
    # Filters
    filterset_class = RequirementFilter
    
    # Search fields
    search_fields = [
        'title',
        'skills',
        'jd_description',
        'requirement_id',
        'client__company_name',
        'rate',
        'experience_required',
        # 'created_by_name',
    ]
    
    # Ordering fields
    ordering_fields = [
        'created_at',
        'title',
        'requirement_id',
        'client__company_name'
    ]
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        """
        Get requirements based on user role (company isolation)
        """
        user = self.request.user
        
        # Base queryset - only active requirements
        queryset = Requirement.objects.filter(is_deleted=False)
        
        # Company isolation
        if user.role == 'CENTRAL_ADMIN':
            # Central Admin can see all companies
            return queryset.select_related('client', 'created_by', 'company')
        
        elif user.role == 'SUB_ADMIN':
            # Sub-admin sees only their company's requirements
            return queryset.filter(
                company=user
            ).select_related('client', 'created_by', 'company')
        
        elif user.role == 'EMPLOYEE':
            # Employee sees their company's requirements
            if user.parent_user:
                return queryset.filter(
                    company=user.parent_user
                ).select_related('client', 'created_by', 'company')
            return queryset.none()
        
        elif user.role == 'ACCOUNTANT':
            # Accountant sees their company's requirements
            if user.parent_user:
                return queryset.filter(
                    company=user.parent_user
                ).select_related('client', 'created_by', 'company')
            return queryset.none()
        
        return queryset.none()




#--------------requirment detail api- view single api-------

class RequirementDetailAPIView(generics.RetrieveAPIView):
    """
    API 3: GET REQUIREMENT DETAILS (Complete)
    GET /api/jd/requirements/{id}/
    
    Returns:
    - Basic requirement details
    - Client details
    - Created by details
    - Company details
    - Assignments (employees assigned)
    - Submissions (candidates with full details)
    - Stats (total submissions, unique candidates)
    """
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = RequirementDetailSerializer
    queryset = Requirement.objects.filter(is_deleted=False)
    
    def get_queryset(self):
        user = self.request.user
        queryset = Requirement.objects.filter(is_deleted=False)
        
        # Company isolation
        if user.role == 'CENTRAL_ADMIN':
            return queryset
        elif user.role == 'SUB_ADMIN':
            return queryset.filter(company=user)
        elif user.role in ['EMPLOYEE', 'ACCOUNTANT']:
            if user.parent_user:
                return queryset.filter(company=user.parent_user)
            return queryset.none()
        
        return queryset.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            return Response({
                "success": True,
                "message": "Requirement details fetched successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Requirement.DoesNotExist:
            return Response({
                "success": False,
                "message": "Requirement not found"
            }, status=status.HTTP_404_NOT_FOUND)

#=============================EDIT-DELETE=============================================
from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Q

class CanEditRequirement(permissions.BasePermission):
    """
    Custom permission to check if user can edit requirement
    - Sub-admin can edit all requirements of their company
    - Employee can edit only their own created requirements
    - Central Admin can edit all
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Central Admin can edit anything
        if user.role == 'CENTRAL_ADMIN':
            return True
        
        # Sub-admin can edit their company's requirements
        if user.role == 'SUB_ADMIN':
            return obj.company == user
        
        # Employee can edit only their own created requirements
        if user.role == 'EMPLOYEE':
            return obj.created_by == user
        
        return False


class CanDeleteRequirement(permissions.BasePermission):
    """
    Custom permission to check if user can delete requirement
    - Only Sub-admin and Central Admin can delete
    - Employees cannot delete (even their own)
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Central Admin can delete anything
        if user.role == 'CENTRAL_ADMIN':
            return True
        
        # Sub-admin can delete their company's requirements
        if user.role == 'SUB_ADMIN':
            return obj.company == user
        
        # Employees cannot delete
        return False


class RequirementUpdateAPIView(generics.UpdateAPIView):
    """
    API 4: UPDATE REQUIREMENT
    PUT/PATCH /api/jd/requirements/{id}/update/
    
    Access:
    - Sub-admin: Can update all requirements of their company
    - Employee: Can update only their own created requirements
    - Central Admin: Can update all
    
    Success Response: 200 OK with updated data
    Fail Response: 403/404 with error message
    """
    permission_classes = [IsAuthenticatedAndActive, CanEditRequirement]
    serializer_class = RequirementCreateSerializer
    queryset = Requirement.objects.filter(is_deleted=False)
    
    def get_object(self):
        """Override to handle not found case"""
        try:
            obj = super().get_object()
            return obj
        except Requirement.DoesNotExist:
            raise NotFound({"message": "Requirement not found or has been deleted"})
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Permission check
        self.check_object_permissions(self.request, instance)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            
            # Success response
            return Response({
                "success": True,
                "message": "Requirement updated successfully",
                "data": {
                    "id": instance.id,
                    "requirement_id": instance.requirement_id,
                    "title": instance.title,
                    "client": instance.client.company_name if instance.client else None,
                    "experience_required": instance.experience_required,
                    "rate": instance.rate,
                    "vendor_budget_range": instance.vendor_budget_range,
                    "time_zone": instance.time_zone,
                    "skills": instance.skills,
                    "updated_at": instance.updated_at
                }
            }, status=status.HTTP_200_OK)
        else:
            # Validation error response
            return Response({
                "success": False,
                "message": "Validation failed",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, *args, **kwargs):
        """Full update"""
        kwargs['partial'] = False
        return self.update(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        """Partial update"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class RequirementDeleteAPIView(generics.DestroyAPIView):
    """
    API 5: DELETE REQUIREMENT (Soft Delete)
    DELETE /api/jd/requirements/{id}/delete/
    
    Access:
    - Sub-admin: Can delete their company's requirements
    - Central Admin: Can delete all
    - Employees: Cannot delete
    
    Success Response: 200 OK with success message
    Fail Response: 403/404 with error message
    """
    permission_classes = [IsAuthenticatedAndActive, CanDeleteRequirement]
    queryset = Requirement.objects.filter(is_deleted=False)
    
    def get_object(self):
        """Override to handle not found case"""
        try:
            obj = super().get_object()
            return obj
        except Requirement.DoesNotExist:
            raise NotFound({"message": "Requirement not found or already deleted"})
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Permission check
        self.check_object_permissions(self.request, instance)
        
        # Store data for response before deletion
        req_id = instance.requirement_id
        req_title = instance.title
        
        # Soft delete
        instance.is_deleted = True
        instance.save()
        
        # Success response
        return Response({
            "success": True,
            "message": f"Requirement '{req_id} - {req_title}' deleted successfully",
            "data": {
                "id": instance.id,
                "requirement_id": req_id,
                "title": req_title,
                "deleted_at": instance.updated_at  # Using updated_at as deletion time
            }
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, *args, **kwargs):
        """Override to handle exceptions gracefully"""
        try:
            return self.destroy(request, *args, **kwargs)
        except PermissionDenied as e:
            return Response({
                "success": False,
                "message": "You don't have permission to delete this requirement",
                "detail": str(e)
            }, status=status.HTTP_403_FORBIDDEN)
        except NotFound as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "success": False,
                "message": "An error occurred while deleting",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
#=============================================================================


#=============================Assignment======================================
from .models import RequirementAssignment
from .serializers import (
    AssignmentCreateSerializer, 
    AssignmentListSerializer, 
    AssignmentDetailSerializer
)

# ================= PERMISSIONS FOR ASSIGNMENT =================

class CanCreateAssignment(permissions.BasePermission):
    """
    Only Sub-admin and Central Admin can create assignments
    """
    def has_permission(self, request, view):
        user = request.user
        return user.role in ['SUB_ADMIN', 'CENTRAL_ADMIN']


class CanDeleteAssignment(permissions.BasePermission):
    """
    Only Sub-admin and Central Admin can delete assignments
    Sub-admin can only delete their company's assignments
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == 'CENTRAL_ADMIN':
            return True
        
        if user.role == 'SUB_ADMIN':
            return obj.company == user
        
        return False


# ================= ASSIGNMENT API VIEWS =================

class AssignmentCreateAPIView(generics.CreateAPIView):
    """
    API 6: CREATE ASSIGNMENT
    POST /api/jd/assignments/
    
    Access: Only Sub-admin and Central Admin
    Body: {
        "requirement_id": 1,
        "assigned_to_ids": [2, 3, 4]  // List of employee IDs
    }
    """
    permission_classes = [IsAuthenticatedAndActive, CanCreateAssignment]
    serializer_class = AssignmentCreateSerializer
    queryset = RequirementAssignment.objects.all()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            self.perform_create(serializer)
            
            return Response({
                "success": True,
                "message": "Assignment created successfully",
                "data": {
                    "requirement_id": request.data.get('requirement_id'),
                    "assigned_to_ids": request.data.get('assigned_to_ids'),
                    "assigned_by": request.user.email,
                    "assigned_date": serializer.instance.assigned_date if serializer.instance else None
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "success": False,
                "message": "Failed to create assignment",
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AssignmentListAPIView(generics.ListAPIView):
    """
    API 7: LIST ASSIGNMENTS
    GET /api/jd/assignments/
    
    Access: All (within company isolation)
    Filters: ?requirement=1
            ?assigned_to=5
            ?assigned_by=10
            ?date_from=2026-03-01
    """
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = AssignmentListSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['requirement', 'assigned_to', 'assigned_by']
    ordering_fields = ['assigned_date']
    ordering = ['-assigned_date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = RequirementAssignment.objects.all()
        
        # Company isolation
        if user.role == 'CENTRAL_ADMIN':
            return queryset.select_related(
                'requirement', 'assigned_to', 'assigned_by', 'company'
            )
        
        elif user.role == 'SUB_ADMIN':
            return queryset.filter(
                company=user
            ).select_related('requirement', 'assigned_to', 'assigned_by')
        
        elif user.role == 'EMPLOYEE':
            # Employee sees assignments where they are assigned_to
            # and also other assignments of their company (view only)
            if user.parent_user:
                return queryset.filter(
                    company=user.parent_user
                ).select_related('requirement', 'assigned_to', 'assigned_by')
            return queryset.none()
        
        elif user.role == 'ACCOUNTANT':
            if user.parent_user:
                return queryset.filter(
                    company=user.parent_user
                ).select_related('requirement', 'assigned_to', 'assigned_by')
            return queryset.none()
        
        return queryset.none()


class AssignmentDetailAPIView(generics.RetrieveAPIView):
    """
    API 8: GET ASSIGNMENT DETAILS
    GET /api/jd/assignments/{id}/
    
    Access: All (within company isolation)
    """
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = AssignmentDetailSerializer
    queryset = RequirementAssignment.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        queryset = RequirementAssignment.objects.all()
        
        # Company isolation
        if user.role == 'CENTRAL_ADMIN':
            return queryset
        
        elif user.role == 'SUB_ADMIN':
            return queryset.filter(company=user)
        
        elif user.role in ['EMPLOYEE', 'ACCOUNTANT']:
            if user.parent_user:
                return queryset.filter(company=user.parent_user)
            return queryset.none()
        
        return queryset.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            return Response({
                "success": True,
                "message": "Assignment details fetched successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        except RequirementAssignment.DoesNotExist:
            return Response({
                "success": False,
                "message": "Assignment not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            return Response({
                "success": False,
                "message": "You don't have permission to view this assignment"
            }, status=status.HTTP_403_FORBIDDEN)


class AssignmentDeleteAPIView(generics.DestroyAPIView):
    """
    API 9: DELETE ASSIGNMENT
    DELETE /api/jd/assignments/{id}/
    
    Access: Only Sub-admin and Central Admin
    Sub-admin can only delete their company's assignments
    """
    permission_classes = [IsAuthenticatedAndActive, CanDeleteAssignment]
    queryset = RequirementAssignment.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        queryset = RequirementAssignment.objects.all()
        
        # Company isolation for delete
        if user.role == 'CENTRAL_ADMIN':
            return queryset
        elif user.role == 'SUB_ADMIN':
            return queryset.filter(company=user)
        return queryset.none()
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # Store data for response
            req_id = instance.requirement.requirement_id
            assigned_to_email = instance.assigned_to.email if instance.assigned_to else None
            
            self.perform_destroy(instance)
            
            return Response({
                "success": True,
                "message": f"Assignment removed successfully",
                "data": {
                    "requirement": req_id,
                    "assigned_to": assigned_to_email,
                    "assigned_date": instance.assigned_date
                }
            }, status=status.HTTP_200_OK)
            
        except RequirementAssignment.DoesNotExist:
            return Response({
                "success": False,
                "message": "Assignment not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            return Response({
                "success": False,
                "message": "You don't have permission to delete this assignment"
            }, status=status.HTTP_403_FORBIDDEN)
    
    def perform_destroy(self, instance):
        instance.delete()  # Hard delete - assignment remove karna hai to completely delete
        
        
#-----submission api views-------

from .models import CandidateJDSubmission
from .serializers import (
    CandidateSubmissionCreateSerializer,
    #CandidateSubmissionListSerializer
)

class CandidateSubmissionCreateAPIView(generics.CreateAPIView):
    """
    API 10: SUBMIT CANDIDATE (JD Mapping)
    POST /api/jd/submissions/
    
    Access: All Employees (within company)
    """
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = CandidateSubmissionCreateSerializer
    queryset = CandidateJDSubmission.objects.all()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            submission = serializer.save()
            
            return Response({
                "success": True,
                "message": "Candidate submitted successfully for this requirement",
                "data": {
                    "submission_id": submission.id,
                    "candidate_id": submission.candidate.id,
                    "candidate_name": submission.candidate.candidate_name,
                    "requirement_id": submission.requirement.requirement_id,
                    "requirement_title": submission.requirement.title,
                    "submitted_by": request.user.email,
                    "submission_date": submission.submission_date,
                    "notes": submission.notes
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "success": False,
                "message": "Failed to submit candidate",
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# class CandidateSubmissionListAPIView(generics.ListAPIView):
#     """
#     API 11: LIST SUBMISSIONS
#     GET /api/jd/submissions/
    
#     Access: All (within company)
#     Filters: ?requirement=1, ?candidate=10, ?submitted_by=5
#     """
#     permission_classes = [IsAuthenticatedAndActive]
#     serializer_class = CandidateSubmissionListSerializer
#     filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
#     filterset_fields = ['requirement', 'candidate', 'submitted_by']
#     ordering_fields = ['submission_date']
#     ordering = ['-submission_date']
    
#     def get_queryset(self):
#         user = self.request.user
#         queryset = CandidateJDSubmission.objects.filter(is_active=True)
        
#         if user.role == 'CENTRAL_ADMIN':
#             return queryset.select_related('candidate', 'requirement', 'submitted_by')
        
#         elif user.role == 'SUB_ADMIN':
#             return queryset.filter(
#                 company=user
#             ).select_related('candidate', 'requirement', 'submitted_by')
        
#         elif user.role == 'EMPLOYEE':
#             if user.parent_user:
#                 return queryset.filter(
#                     company=user.parent_user
#                 ).select_related('candidate', 'requirement', 'submitted_by')
#             return queryset.none()
        
#         return queryset.none()


class CandidateSubmissionDeleteAPIView(generics.DestroyAPIView):
    """
    API 14: DELETE SUBMISSION (Soft Delete)
    DELETE /api/jd/submissions/{id}/delete/
    
    Access: Creator, Sub-admin, Central Admin
    """
    permission_classes = [IsAuthenticatedAndActive]
    queryset = CandidateJDSubmission.objects.filter(is_active=True)
    
    def get_queryset(self):
        user = self.request.user
        queryset = CandidateJDSubmission.objects.filter(is_active=True)
        
        if user.role == 'CENTRAL_ADMIN':
            return queryset
        elif user.role == 'SUB_ADMIN':
            return queryset.filter(company=user)
        elif user.role == 'EMPLOYEE':
            if user.parent_user:
                return queryset.filter(company=user.parent_user)
            return queryset.none()
        return queryset.none()
    
    def has_object_permission(self, request, obj):
        user = request.user
        
        if user.role == 'CENTRAL_ADMIN':
            return True
        if user.role == 'SUB_ADMIN':
            return obj.company == user
        if user.role == 'EMPLOYEE':
            return obj.submitted_by == user
        
        return False
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            if not self.has_object_permission(request, instance):
                return Response({
                    "success": False,
                    "message": "You don't have permission to delete this submission"
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Soft delete
            instance.is_active = False
            instance.save()
            
            return Response({
                "success": True,
                "message": f"Submission for candidate '{instance.candidate.candidate_name}' removed successfully",
                "data": {
                    "submission_id": instance.id,
                    "candidate": instance.candidate.candidate_name,
                    "requirement": instance.requirement.requirement_id
                }
            }, status=status.HTTP_200_OK)
            
        except CandidateJDSubmission.DoesNotExist:
            return Response({
                "success": False,
                "message": "Submission not found"
            }, status=status.HTTP_404_NOT_FOUND)


#=========MY- JD- VIEW---------------

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from .serializers import MyJDDetailSerializer
from rest_framework.views import APIView
# class MyJDsAPIView(APIView):
#     """
#     API: Get My JDs (Today & Yesterday)
#     GET /api/jd/my-jds/
    
#     Filters:
#     - today: JDs from today
#     - yesterday: JDs from yesterday
#     - search: search in title, requirement_id, skills, client_name
    
#     Query Params:
#     ?type=today          # Today's JDs
#     ?type=yesterday      # Yesterday's JDs
#     ?type=both           # Both today and yesterday (default)
#     ?search=python       # Search by title, req_id, skills, client
#     """
#     permission_classes = [IsAuthenticatedAndActive]
    
#     def get(self, request):
#         user = request.user
#         query_type = request.query_params.get('type', 'both')
#         search_query = request.query_params.get('search', '').strip()
        
#         # Get today's date range
#         today = timezone.now().date()
#         yesterday = today - timedelta(days=1)
        
#         # Date range filter
#         if query_type == 'today':
#             start_date = datetime.combine(today, datetime.min.time())
#             end_date = datetime.combine(today, datetime.max.time())
#         elif query_type == 'yesterday':
#             start_date = datetime.combine(yesterday, datetime.min.time())
#             end_date = datetime.combine(yesterday, datetime.max.time())
#         else:  # both
#             start_date = datetime.combine(yesterday, datetime.min.time())
#             end_date = datetime.combine(today, datetime.max.time())
        
#         # Get JDs where user is either creator or assigned
#         # JDs created by user
#         created_jds = Requirement.objects.filter(
#             created_by=user,
#             created_at__date__range=[start_date.date(), end_date.date()],
#             is_deleted=False
#         )
        
#         # JDs assigned to user
#         assigned_jds = Requirement.objects.filter(
#             assignments__assigned_to=user,
#             created_at__date__range=[start_date.date(), end_date.date()],
#             is_deleted=False
#         )
        
#         # Combine both querysets
#         all_jds = (created_jds | assigned_jds).distinct().order_by('-created_at')
        
#         # Apply search filter
#         if search_query:
#             all_jds = all_jds.filter(
#                 Q(title__icontains=search_query) |
#                 Q(requirement_id__icontains=search_query) |
#                 Q(skills__icontains=search_query) |
#                 Q(client__company_name__icontains=search_query)
#             )
        
#         # Serialize
#         serializer = MyJDDetailSerializer(all_jds, many=True)
        
#         # Prepare response with stats
#         response_data = {
#             "success": True,
#             "type": query_type,
#             "count": all_jds.count(),
#             "stats": {
#                 "total": all_jds.count(),
#                 "created_by_me": created_jds.count(),
#                 "assigned_to_me": assigned_jds.count()
#             },
#             "results": serializer.data
#         }
        
#         return Response(response_data, status=status.HTTP_200_OK)


from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Case, When, Value, CharField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import MyJDDetailSerializer

class MyJDsAPIView(APIView):
    
    permission_classes = [IsAuthenticatedAndActive]
    
    def get_status_ordering(self):
        """Custom ordering: HOT first, then WARM, then COLD"""
        return [
            Case(
                When(status='HOT', then=Value('1')),
                When(status='WARM', then=Value('2')),
                When(status='COLD', then=Value('3')),
                output_field=CharField(),
            )
        ]
    
    def filter_by_status(self, queryset, status_filter):
        """Filter queryset by status"""
        if not status_filter:
            return queryset
        
        # Filter manually using status property
        # Note: status is a property, not a database field
        filtered_ids = []
        for req in queryset:
            if req.status == status_filter:
                filtered_ids.append(req.id)
        
        return queryset.filter(id__in=filtered_ids)
    
    def get(self, request):
        user = request.user
        query_type = request.query_params.get('type', 'both')
        search_query = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip().upper()
        
        # Get today's date range
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Date range filter
        if query_type == 'today':
            start_date = datetime.combine(today, datetime.min.time())
            end_date = datetime.combine(today, datetime.max.time())
        elif query_type == 'yesterday':
            start_date = datetime.combine(yesterday, datetime.min.time())
            end_date = datetime.combine(yesterday, datetime.max.time())
        else:  # both
            start_date = datetime.combine(yesterday, datetime.min.time())
            end_date = datetime.combine(today, datetime.max.time())
        
        # Get JDs where user is either creator or assigned
        created_jds = Requirement.objects.filter(
            created_by=user,
            created_at__date__range=[start_date.date(), end_date.date()],
            is_deleted=False
        )
        
        assigned_jds = Requirement.objects.filter(
            assignments__assigned_to=user,
            created_at__date__range=[start_date.date(), end_date.date()],
            is_deleted=False
        )
        
        # Combine both querysets
        all_jds = (created_jds | assigned_jds).distinct()
        
        # Apply search filter
        if search_query:
            all_jds = all_jds.filter(
                Q(title__icontains=search_query) |
                Q(requirement_id__icontains=search_query) |
                Q(skills__icontains=search_query) |
                Q(client__company_name__icontains=search_query) |
                Q(status__icontains=search_query)
            )
        
        # Apply status filter (HOT/WARM/COLD)
        if status_filter and status_filter in ['HOT', 'WARM', 'COLD']:
            all_jds = self.filter_by_status(all_jds, status_filter)
        
        # Order by: HOT first, then WARM, then COLD, then by created_at desc
        # Since status is a property, we need to order in Python
        all_jds_list = list(all_jds)
        
        # Sort: HOT (status='HOT' first), then WARM, then COLD
        status_order = {'HOT': 1, 'WARM': 2, 'COLD': 3}
        all_jds_list.sort(key=lambda x: (status_order.get(x.status, 4), -x.created_at.timestamp()))
        
        # Serialize
        serializer = MyJDDetailSerializer(all_jds_list, many=True)
        
        # Prepare response with stats
        response_data = {
            "success": True,
            "type": query_type,
            "status_filter": status_filter if status_filter else "ALL",
            "count": len(all_jds_list),
            "stats": {
                "total": len(all_jds_list),
                "created_by_me": created_jds.count(),
                "assigned_to_me": assigned_jds.count(),
                "hot_count": len([r for r in all_jds_list if r.status == 'HOT']),
                "warm_count": len([r for r in all_jds_list if r.status == 'WARM']),
                "cold_count": len([r for r in all_jds_list if r.status == 'COLD'])
            },
            "results": serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


    
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Requirement
from .serializers import MyJDDetailSerializer
from landing.models import User


class CompanyJDsAPIView(APIView):
    """
    API: Get Company JDs (Today & Yesterday) - For Sub-Admin
    GET /api/jd/company-jds/
    
    Query Params:
    ?type=today          # Today's JDs
    ?type=yesterday      # Yesterday's JDs
    ?type=both           # Both today and yesterday (default)
    ?search=python       # Search in title, req_id, skills, client_name
    ?employee_id=5       # Filter by specific employee (optional)
    """
    permission_classes = [IsAuthenticatedAndActive]
    
    def get(self, request):
        user = request.user
        
        # Only Sub-admin and Central Admin can access
        if user.role not in ['SUB_ADMIN', 'CENTRAL_ADMIN']:
            return Response({
                "success": False,
                "message": "Only Sub-admin and Central Admin can access this API"
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get company
        if user.role == 'SUB_ADMIN':
            company = user
        else:
            # Central Admin - can pass company_id in query
            company_id = request.query_params.get('company_id')
            if company_id:
                try:
                    company = User.objects.get(id=company_id, role='SUB_ADMIN')
                except User.DoesNotExist:
                    return Response({
                        "success": False,
                        "message": "Company not found"
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    "success": False,
                    "message": "company_id is required for Central Admin"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get query params
        query_type = request.query_params.get('type', 'both')
        search_query = request.query_params.get('search', '').strip()
        employee_id = request.query_params.get('employee_id')
        
        # Get date range
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        if query_type == 'today':
            date_range = [today, today]
        elif query_type == 'yesterday':
            date_range = [yesterday, yesterday]
        else:  # both
            date_range = [yesterday, today]
        
        # Get all employees of this company
        employees = User.objects.filter(
            parent_user=company,
            role='EMPLOYEE'
        )
        
        # Filter by specific employee if provided
        if employee_id:
            employees = employees.filter(id=employee_id)
        
        # Get employee IDs list
        employee_ids = list(employees.values_list('id', flat=True))
        
        if not employee_ids:
            return Response({
                "success": True,
                "type": query_type,
                "count": 0,
                "stats": {
                    "total": 0,
                    "created_by_company": 0,
                    "assigned_to_company": 0
                },
                "results": []
            }, status=status.HTTP_200_OK)
        
        # Base queryset - JDs created by OR assigned to these employees
        all_jds = Requirement.objects.filter(
            is_deleted=False,
            created_at__date__range=date_range
        ).filter(
            Q(created_by_id__in=employee_ids) |
            Q(assignments__assigned_to_id__in=employee_ids)
        ).distinct().order_by('-created_at')
        
        # Calculate counts before search
        created_count = Requirement.objects.filter(
            created_by_id__in=employee_ids,
            created_at__date__range=date_range,
            is_deleted=False
        ).count()
        
        assigned_count = Requirement.objects.filter(
            assignments__assigned_to_id__in=employee_ids,
            created_at__date__range=date_range,
            is_deleted=False
        ).distinct().count()
        
        # Apply search filter
        if search_query:
            all_jds = all_jds.filter(
                Q(title__icontains=search_query) |
                Q(requirement_id__icontains=search_query) |
                Q(skills__icontains=search_query) |
                Q(client__company_name__icontains=search_query)
            )
            # Recalculate counts after search
            created_count = all_jds.filter(created_by_id__in=employee_ids).count()
            assigned_count = all_jds.filter(assignments__assigned_to_id__in=employee_ids).distinct().count()
        
        # Serialize
        serializer = MyJDDetailSerializer(all_jds, many=True)
        
        response_data = {
            "success": True,
            "type": query_type,
            "count": all_jds.count(),
            "stats": {
                "total": all_jds.count(),
                "created_by_company": created_count,
                "assigned_to_company": assigned_count
            },
            "results": serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
#======================Requirement status - update==============================================
from rest_framework.permissions import IsAuthenticated
class RequirementStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_requirement(self, pk, user):
        """Company isolated requirement fetch"""
        try:
            if user.role == 'CENTRAL_ADMIN':
                requirement = Requirement.objects.get(pk=pk, is_deleted=False)
            elif user.role == 'SUB_ADMIN':
                requirement = Requirement.objects.get(
                    pk=pk, 
                    company=user,
                    is_deleted=False
                )
            elif user.role == 'EMPLOYEE':
                requirement = Requirement.objects.get(
                    pk=pk,
                    company=user.parent_user,
                    is_deleted=False
                )
            else:
                raise PermissionDenied("Invalid user role")
            return requirement
        except Requirement.DoesNotExist:
            raise NotFound("Requirement not found")

    def put(self, request, pk):
        user = request.user
        
        # Sirf SUB_ADMIN aur CENTRAL_ADMIN ko permission
        if user.role not in ['SUB_ADMIN', 'CENTRAL_ADMIN']:
            raise PermissionDenied("Only Admin can update status manually")
        
        requirement = self.get_requirement(pk, user)
        
        serializer = RequirementStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        
        # Manual status update
        requirement.set_manual_status(new_status)
        
        return Response({
            "message": "Status updated successfully",
            "requirement_id": requirement.requirement_id,
            "status": requirement.status,
            "manual_status": requirement.manual_status,
            "manual_status_updated_at": requirement.manual_status_updated_at
        }, status=status.HTTP_200_OK)
        
class CompanyAvailableRequirementsAPIView(APIView):
    """
    API: Employee ke liye available requirements
    - Jo employee ko assign nahi hui
    - Jo employee ne khud create nahi ki
    - Sirf TODAY aur YESTERDAY ki requirements
    
    GET /api/jd/company-available-requirements/
    
    Query Params:
    ?search=python
    ?status=HOT/WARM/COLD
    """
    permission_classes = [IsAuthenticated]
    
    def get_company_root(self, user):
        """Get company root user"""
        if user.role == 'EMPLOYEE' and user.parent_user:
            return user.parent_user
        raise PermissionDenied("This API is only for employees")
    
    def filter_by_status(self, queryset, status_filter):
        """Filter queryset by status property"""
        if not status_filter:
            return queryset
        
        filtered_ids = []
        for req in queryset:
            if req.status == status_filter:
                filtered_ids.append(req.id)
        
        return queryset.filter(id__in=filtered_ids)
    
    def get(self, request):
        user = request.user
        
        # Sirf employee ke liye
        if user.role != 'EMPLOYEE':
            return Response({
                "success": False,
                "message": "This API is only for employees"
            }, status=status.HTTP_403_FORBIDDEN)
        
        search_query = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip().upper()
        
        # Get company
        company_root = self.get_company_root(user)
        
        # Get today and yesterday date range
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        start_date = datetime.combine(yesterday, datetime.min.time())
        end_date = datetime.combine(today, datetime.max.time())
        
        # Company ki saari requirements (TODAY + YESTERDAY)
        all_company_requirements = Requirement.objects.filter(
            company=company_root,
            is_deleted=False,
            created_at__date__range=[start_date.date(), end_date.date()]
        )
        
        # Requirements jo employee ko assign hain
        assigned_requirement_ids = Requirement.objects.filter(
            assignments__assigned_to=user,
            is_deleted=False
        ).values_list('id', flat=True)
        
        # Requirements jo employee ne khud create ki hain
        self_created_requirement_ids = Requirement.objects.filter(
            created_by=user,
            is_deleted=False
        ).values_list('id', flat=True)
        
        # Exclude: assigned + self-created
        available_requirements = all_company_requirements.exclude(
            id__in=assigned_requirement_ids
        ).exclude(
            id__in=self_created_requirement_ids
        )
        
        # Apply search filter
        if search_query:
            available_requirements = available_requirements.filter(
                Q(title__icontains=search_query) |
                Q(requirement_id__icontains=search_query) |
                Q(skills__icontains=search_query) |
                Q(client__client_name__icontains=search_query) |
                Q(client__company_name__icontains=search_query)
            )
        
        # Apply status filter
        if status_filter and status_filter in ['HOT', 'WARM', 'COLD']:
            available_requirements = self.filter_by_status(available_requirements, status_filter)
        
        # Order by status (HOT first) then created_at desc
        available_list = list(available_requirements)
        
        status_order = {'HOT': 1, 'WARM': 2, 'COLD': 3}
        available_list.sort(key=lambda x: (status_order.get(x.status, 4), -x.created_at.timestamp()))
        
        # Serialize
        serializer = MyJDDetailSerializer(available_list, many=True)
        
        # Prepare response
        response_data = {
            "success": True,
            "employee": f"{user.first_name} {user.last_name}".strip(),
            "employee_email": user.email,
            "company": company_root.email,
            "date_range": {
                "from": start_date.date(),
                "to": end_date.date()
            },
            "total_available": len(available_list),
            "stats": {
                "company_total": all_company_requirements.count(),
                "assigned_to_me": assigned_requirement_ids.count(),
                "created_by_me": self_created_requirement_ids.count(),
                "available": len(available_list),
                "hot_count": len([r for r in available_list if r.status == 'HOT']),
                "warm_count": len([r for r in available_list if r.status == 'WARM']),
                "cold_count": len([r for r in available_list if r.status == 'COLD'])
            },
            "results": serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
  