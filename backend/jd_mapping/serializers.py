from rest_framework import serializers
from django.utils import timezone
from .models import Requirement,RequirementStatus
from employee_portal.models import Client
from employee_portal.resume_parser.skills import SKILL_KEYWORDS
import re

class RequirementStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RequirementStatus.choices)

class RequirementCreateSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Requirement
        fields = [
            'id', 'requirement_id', 'title', 'client_id', 'client',
            'experience_required', 'rate','vendor_budget_range', 'time_zone', 'jd_description',
            'skills', 'created_at', 'created_by', 'company'
        ]
        read_only_fields = [
            'id', 'requirement_id', 'created_at', 'created_by', 'company', 'client'
        ]
        extra_kwargs = {
            'skills': {'required': False, 'allow_blank': True, 'allow_null': True}
         }
        
    def validate_client_id(self, value):
        """Check if client exists and belongs to same company"""
        user = self.context['request'].user
        company = self.get_company(user)
        
        try:
            client = Client.objects.get(id=value)
            # Check if client belongs to same company
            if client.created_by.role == 'SUB_ADMIN':
                client_company = client.created_by
            elif client.created_by.role == 'EMPLOYEE' and client.created_by.parent_user:
                client_company = client.created_by.parent_user
            else:
                client_company = None
            
            if client_company != company and user.role != 'CENTRAL_ADMIN':
                raise serializers.ValidationError("Client does not belong to your company")
        except Client.DoesNotExist:
            raise serializers.ValidationError("Client not found")
        
        return value
    
    def get_company(self, user):
        """Get company (Sub-Admin) for the user"""
        if user.role == 'SUB_ADMIN':
            return user
        elif user.role == 'EMPLOYEE' and user.parent_user:
            return user.parent_user
        elif user.role == 'CENTRAL_ADMIN':
            return None  # Central Admin ka koi company nahi
        return None
    
    def extract_skills_from_jd(self, jd_text):
        """
        JD text se skills extract karein
        Exact match karein taaki "c" aur "c++" alag identify ho
        """
        if not jd_text:
            return ""
        
        jd_text_lower = jd_text.lower()
        found_skills = set()
        
        for skill in SKILL_KEYWORDS:
            skill_lower = skill.lower()
            
            # Exact word boundary check - taaki "c" match na ho "c++" me
            # Pattern: word boundary + skill + word boundary
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
            if re.search(pattern, jd_text_lower):
                found_skills.add(skill)  # Original case store karo
        
        # Sort karke comma separated string banao
        return ", ".join(sorted(found_skills))
    
    def validate(self, attrs):
        """Custom validation"""
        # Skills nahi di to JD se extract karo
        if not attrs.get('skills'):
            jd_text = attrs.get('jd_description', '')
            extracted_skills = self.extract_skills_from_jd(jd_text)
            attrs['skills'] = extracted_skills
        
        return attrs
    
    def create(self, validated_data):
        user = self.context['request'].user
        client_id = validated_data.pop('client_id')
        
        # Get client
        client = Client.objects.get(id=client_id)
        
        # Get company
        if user.role == 'SUB_ADMIN':
            company = user
        elif user.role == 'EMPLOYEE' and user.parent_user:
            company = user.parent_user
        elif user.role == 'CENTRAL_ADMIN':
            company = None  # Central Admin ke liye company null?
        else:
            company = None
        
        # Create requirement
        requirement = Requirement.objects.create(
            **validated_data,
            client=client,
            created_by=user,
            company=company
        )
        
        return requirement

    def update(self, instance, validated_data):
        """Handle updates including optional client_id and vendor_budget_range."""
        # Pop client_id if provided and set client relation
        client_id = validated_data.pop('client_id', None)
        if client_id:
            try:
                client = Client.objects.get(id=client_id)
                instance.client = client
            except Client.DoesNotExist:
                raise serializers.ValidationError({"client_id": "Client not found"})

        # Update other fields normally
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance



class RequirementListSerializer(serializers.ModelSerializer):
    """List view ke liye serializer with full details"""
    
    # Client details
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    client_id = serializers.IntegerField(source='client.id', read_only=True)
    
    # Creator details
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    created_by_id = serializers.IntegerField(source='created_by.id', read_only=True)
    
    # Company details
    company_name = serializers.SerializerMethodField()
    
    # Assignment details (assigned employees)
    assigned_to = serializers.SerializerMethodField()
    assigned_count = serializers.SerializerMethodField()
    
    # Submission stats
    total_submissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Requirement
        fields = [
            'id', 
            'requirement_id', 
            'title', 
            'status',
            'client_id',
            'client_name', 
            'experience_required', 
            'rate',
            'vendor_budget_range', 
            'time_zone',
            'jd_description',
            'skills', 
            'created_by_id',
            'created_by_name',
            'company_name',
            'created_at',
            'assigned_to',
            'assigned_count',
            'total_submissions'
        ]
    
    def get_company_name(self, obj):
        if obj.company:
            return f"{obj.company.first_name} {obj.company.last_name}".strip()
        return None
    
    def get_assigned_to(self, obj):
        """Get list of assigned employees names"""
        assignments = obj.assignments.select_related('assigned_to').all()
        return [
            {
                'id': a.assigned_to.id,
                'name': f"{a.assigned_to.first_name} {a.assigned_to.last_name}".strip(),
                'email': a.assigned_to.email
            }
            for a in assignments if a.assigned_to
        ]
    
    def get_assigned_count(self, obj):
        """Get count of assigned employees"""
        return obj.assignments.count()
    
    def get_total_submissions(self, obj):
        """Get total number of candidate submissions for this JD"""
        return obj.candidate_submissions.filter(is_active=True).count()
        
#------requirement-detail- api -----
class RequirementDetailSerializer(serializers.ModelSerializer):
    """Complete requirement details with assignments and submissions"""
    
    # Basic details
    client_details = serializers.SerializerMethodField()
    created_by_details = serializers.SerializerMethodField()
    company_details = serializers.SerializerMethodField()
    
    # Assignments
    assignments = serializers.SerializerMethodField()
    
    # Submissions with full candidate details
    submissions = serializers.SerializerMethodField()
    
    # Stats
    total_submissions = serializers.SerializerMethodField()
    unique_candidates = serializers.SerializerMethodField()
    
    class Meta:
        model = Requirement
        fields = [
            'id', 'requirement_id', 'title','status', 'client_details',
            'experience_required', 'rate','vendor_budget_range',  'time_zone', 'jd_description',
            'skills', 'created_by_details', 'company_details', 'created_at',
            'total_submissions', 'unique_candidates', 'assignments', 'submissions'
        ]
    
    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.client_name,
                'company_name': obj.client.company_name,
                'email': obj.client.email,
                'phone': obj.client.phone_number
            }
        return None
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'name': f"{obj.created_by.first_name} {obj.created_by.last_name}".strip(),
                'email': obj.created_by.email,
                'role': obj.created_by.role
            }
        return None
    
    def get_company_details(self, obj):
        if obj.company:
            return {
                'id': obj.company.id,
                'email': obj.company.email,
                'company_name': f"{obj.company.first_name} {obj.company.last_name}".strip()
            }
        return None
    
    def get_assignments(self, obj):
        """Get all employees this JD is assigned to"""
        assignments = obj.assignments.select_related('assigned_to').all()
        return [
            {
                'id': a.assigned_to.id,
                'name': f"{a.assigned_to.first_name} {a.assigned_to.last_name}".strip(),
                'email': a.assigned_to.email,
                'assigned_date': a.assigned_date
            }
            for a in assignments if a.assigned_to
        ]
    
    def get_submissions(self, obj):
        """Get all candidate submissions for this JD with full details"""
        submissions = obj.candidate_submissions.select_related(
            'candidate', 'submitted_by'
        ).filter(is_active=True).order_by('-submission_date')
        
        result = []
        for sub in submissions:
            candidate = sub.candidate
            if candidate:
                # Get vendor details
                vendor_info = None
                if candidate.vendor:
                    vendor_info = {
                        'id': candidate.vendor.id,
                        'name': candidate.vendor.name,
                        'company_name': candidate.vendor.company_name
                    }
                
                # Get client details (if different from JD client)
                client_info = None
                if candidate.client:
                    client_info = {
                        'id': candidate.client.id,
                        'name': candidate.client.client_name,
                        'company_name': candidate.client.company_name
                    }
                
                result.append({
                    'submission_id': sub.id,
                    'submission_date': sub.submission_date,
                    'notes': sub.notes,
                    'submitted_by': {
                        'id': sub.submitted_by.id if sub.submitted_by else None,
                        'name': f"{sub.submitted_by.first_name} {sub.submitted_by.last_name}".strip() if sub.submitted_by else None,
                        'email': sub.submitted_by.email if sub.submitted_by else None
                    },
                    'candidate': {
                        'id': candidate.id,
                        'name': candidate.candidate_name,
                        'email': candidate.candidate_email,
                        'phone': candidate.candidate_number,
                        'skills': candidate.skills,
                        'technology': candidate.technology,
                        'experience': candidate.years_of_experience_manual,
                        'experience_calculated': candidate.years_of_experience_calculated,
                        'vendor': vendor_info,
                        'client': client_info,
                        'vendor_rate': candidate.vendor_rate,
                        'vendor_rate_type': candidate.vendor_rate_type,
                        'client_rate': candidate.client_rate,
                        'client_rate_type': candidate.client_rate_type,
                        'main_status': candidate.main_status,
                        'sub_status': candidate.sub_status,
                        'resume': candidate.resume.url if candidate.resume else None,
                        'is_blocklisted': candidate.is_blocklisted,
                        'created_at': candidate.created_at
                    }
                })
        
        return result
    
    def get_total_submissions(self, obj):
        """Total number of submissions for this JD"""
        return obj.candidate_submissions.filter(is_active=True).count()
    
    def get_unique_candidates(self, obj):
        """Number of unique candidates submitted"""
        return obj.candidate_submissions.filter(
            is_active=True
        ).values('candidate').distinct().count()
        
        
# =============================Assignement=leave==========================================================

from .models import Requirement, RequirementAssignment, CandidateJDSubmission

# ================= ASSIGNMENT SERIALIZERS =================

class AssignmentCreateSerializer(serializers.ModelSerializer):
    """Create assignment serializer"""
    requirement_id = serializers.IntegerField(write_only=True)
    assigned_to_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        help_text="List of employee user IDs to assign"
    )
    
    class Meta:
        model = RequirementAssignment
        fields = ['id', 'requirement_id', 'assigned_to_ids', 'assigned_date']
        read_only_fields = ['id', 'assigned_date']
    
    def validate_requirement_id(self, value):
        """Check if requirement exists and belongs to same company"""
        user = self.context['request'].user
        company = self.get_company(user)
        
        try:
            requirement = Requirement.objects.get(id=value, is_deleted=False)
            
            # Check if requirement belongs to same company
            if user.role == 'SUB_ADMIN' and requirement.company != user:
                raise serializers.ValidationError("Requirement does not belong to your company")
            if user.role == 'EMPLOYEE' and requirement.company != user.parent_user:
                raise serializers.ValidationError("Requirement does not belong to your company")
                
        except Requirement.DoesNotExist:
            raise serializers.ValidationError("Requirement not found")
        
        return value
    
    def validate_assigned_to_ids(self, values):
        """Check if all assigned users exist and are employees of same company"""
        user = self.context['request'].user
        company = self.get_company(user)
        
        if not values:
            raise serializers.ValidationError("At least one employee must be assigned")
        
        from landing.models import User
        
        invalid_users = []
        for user_id in values:
            try:
                employee = User.objects.get(id=user_id, role='EMPLOYEE')
                
                # Check if employee belongs to same company
                if user.role == 'SUB_ADMIN':
                    if employee.parent_user != company:
                        invalid_users.append(user_id)
                elif user.role == 'CENTRAL_ADMIN':
                    # Central admin can assign to any employee
                    pass
                    
            except User.DoesNotExist:
                invalid_users.append(user_id)
        
        if invalid_users:
            raise serializers.ValidationError(
                f"Invalid or unauthorized user IDs: {invalid_users}"
            )
        
        return values
    
    def get_company(self, user):
        """Get company (Sub-Admin) for the user"""
        if user.role == 'SUB_ADMIN':
            return user
        elif user.role == 'EMPLOYEE' and user.parent_user:
            return user.parent_user
        return None
    
    def create(self, validated_data):
        requirement_id = validated_data.pop('requirement_id')
        assigned_to_ids = validated_data.pop('assigned_to_ids')
        assigned_by = self.context['request'].user
        
        requirement = Requirement.objects.get(id=requirement_id)
        
        assignments = []
        for user_id in assigned_to_ids:
            # Check if already assigned
            if not RequirementAssignment.objects.filter(
                requirement_id=requirement_id,
                assigned_to_id=user_id
            ).exists():
                assignment = RequirementAssignment.objects.create(
                    requirement=requirement,
                    assigned_to_id=user_id,
                    assigned_by=assigned_by,
                    company=requirement.company
                )
                assignments.append(assignment)
        
        if not assignments:
            raise serializers.ValidationError(
                "All selected employees are already assigned to this requirement"
            )
        
        return assignments[0]  # Return first for response, but all are created


class AssignmentListSerializer(serializers.ModelSerializer):
    """List assignments serializer"""
    requirement_title = serializers.CharField(source='requirement.title', read_only=True)
    requirement_id_display = serializers.CharField(source='requirement.requirement_id', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.email', read_only=True)
    assigned_to_full_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.CharField(source='assigned_by.email', read_only=True)
    company_name = serializers.CharField(source='company.email', read_only=True)
    
    class Meta:
        model = RequirementAssignment
        fields = [
            'id', 'requirement', 'requirement_id_display', 'requirement_title',
            'assigned_to', 'assigned_to_name', 'assigned_to_full_name',
            'assigned_by', 'assigned_by_name', 'assigned_date', 'company_name'
        ]
    
    def get_assigned_to_full_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
        return None


class AssignmentDetailSerializer(serializers.ModelSerializer):
    """Assignment detail serializer"""
    requirement_details = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()
    assigned_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = RequirementAssignment
        fields = [
            'id', 'requirement_details', 'assigned_to_details',
            'assigned_by_details', 'assigned_date'
        ]
    
    def get_requirement_details(self, obj):
        return {
            'id': obj.requirement.id,
            'requirement_id': obj.requirement.requirement_id,
            'title': obj.requirement.title,
            'client': obj.requirement.client.company_name if obj.requirement.client else None
        }
    
    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                'id': obj.assigned_to.id,
                'email': obj.assigned_to.email,
                'name': f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip(),
                'number': obj.assigned_to.number
            }
        return None
    
    def get_assigned_by_details(self, obj):
        if obj.assigned_by:
            return {
                'id': obj.assigned_by.id,
                'email': obj.assigned_by.email,
                'name': f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}".strip(),
                'role': obj.assigned_by.role
            }
        return None

# ==========================Submission serializers ========================================
from employee_portal.models import Candidate

class CandidateSubmissionCreateSerializer(serializers.ModelSerializer):
    """Create candidate submission (JD Mapping)"""
    candidate_id = serializers.IntegerField(write_only=True)
    requirement_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CandidateJDSubmission
        fields = [
            'id', 'candidate_id', 'requirement_id', 'notes', 'submission_date'
        ]
        read_only_fields = ['id', 'submission_date']
    
    def get_company(self, user):
        """Get company for the user"""
        if user.role == 'SUB_ADMIN':
            return user
        elif user.role == 'EMPLOYEE' and user.parent_user:
            return user.parent_user
        elif user.role == 'CENTRAL_ADMIN':
            return None
        return None
    
    def validate_candidate_id(self, value):
        """Check if candidate exists and belongs to same company"""
        user = self.context['request'].user
        company = self.get_company(user)
        
        try:
            from employee_portal.models import Candidate
            candidate = Candidate.objects.get(id=value, is_deleted=False)
            
            # Get candidate's company
            candidate_company = None
            if candidate.company:
                candidate_company = candidate.company
            elif candidate.created_by:
                if candidate.created_by.role == 'SUB_ADMIN':
                    candidate_company = candidate.created_by
                elif candidate.created_by.role == 'EMPLOYEE' and candidate.created_by.parent_user:
                    candidate_company = candidate.created_by.parent_user
            
            # Company isolation check
            if user.role == 'CENTRAL_ADMIN':
                # Central Admin can submit any candidate
                pass
            else:
                # Sub-admin or Employee - must be same company
                if candidate_company != company:
                    raise serializers.ValidationError(
                        f"Candidate does not belong to your company"
                    )
                    
        except Candidate.DoesNotExist:
            raise serializers.ValidationError("Candidate not found")
        
        return value
    
    def validate_requirement_id(self, value):
        """Check if requirement exists and belongs to same company"""
        user = self.context['request'].user
        company = self.get_company(user)
        
        try:
            requirement = Requirement.objects.get(id=value, is_deleted=False)
            
            # Company isolation check
            if user.role == 'CENTRAL_ADMIN':
                pass
            else:
                if requirement.company != company:
                    raise serializers.ValidationError(
                        f"Requirement does not belong to your company"
                    )
                
        except Requirement.DoesNotExist:
            raise serializers.ValidationError("Requirement not found")
        
        return value
    
    def validate(self, attrs):
        """Check if candidate already submitted for this JD"""
        candidate_id = attrs.get('candidate_id')
        requirement_id = attrs.get('requirement_id')
        
        if CandidateJDSubmission.objects.filter(
            candidate_id=candidate_id,
            requirement_id=requirement_id,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                {"candidate_id": "This candidate is already submitted for this requirement"}
            )
        
        return attrs
    
    def create(self, validated_data):
        candidate_id = validated_data.pop('candidate_id')
        requirement_id = validated_data.pop('requirement_id')
        user = self.context['request'].user
        company = self.get_company(user)
        
        from employee_portal.models import Candidate
        candidate = Candidate.objects.get(id=candidate_id)
        requirement = Requirement.objects.get(id=requirement_id)
        
        submission = CandidateJDSubmission.objects.create(
            candidate=candidate,
            requirement=requirement,
            submitted_by=user,
            company=company,
            notes=validated_data.get('notes', '')
        )
        
        return submission
    
#===================MY-JD-api SErilizers ------------------
class MyJDDetailSerializer(serializers.ModelSerializer):
    """My JD detail serializer with full info"""
    
    client_details = serializers.SerializerMethodField()
    created_by_details = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()
    total_submissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Requirement
        fields = [
            'id', 'requirement_id', 'title','status', 'client_details',
            'experience_required', 'rate', 'vendor_budget_range', 'time_zone', 'jd_description',
            'skills', 'created_by_details', 'created_at', 'assigned_to_details',
            'total_submissions'
        ]
    
    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.client_name,
                'company_name': obj.client.company_name
            }
        return None
    
    def get_created_by_details(self, obj):
        if obj.created_by:
            return {
                'id': obj.created_by.id,
                'name': f"{obj.created_by.first_name} {obj.created_by.last_name}".strip(),
                'email': obj.created_by.email
            }
        return None
    
    def get_assigned_to_details(self, obj):
        assignments = obj.assignments.select_related('assigned_to').all()
        return [
            {
                'id': a.assigned_to.id,
                'name': f"{a.assigned_to.first_name} {a.assigned_to.last_name}".strip(),
                'email': a.assigned_to.email
            }
            for a in assignments if a.assigned_to
        ]
    
    def get_total_submissions(self, obj):
        return obj.candidate_submissions.filter(is_active=True).count()