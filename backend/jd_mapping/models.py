from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from employee_portal.models import Client, Candidate

User = settings.AUTH_USER_MODEL


class RequirementIDCounter(models.Model):
    """
    Har month ke liye sequence number track karne ke liye
    Company-wise alag counter hoga
    """
    month = models.CharField(max_length=4)  # Format: YYMM (e.g., 2603)
    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'SUB_ADMIN'},
        related_name='requirement_counters'
    )
    last_sequence = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['month', 'company']  # Har company ka apna counter per month
        verbose_name = "Requirement ID Counter"
        verbose_name_plural = "Requirement ID Counters"
    
    def __str__(self):
        return f"{self.company.email} - {self.month} - {self.last_sequence}"


class RequirementStatus(models.TextChoices):
    HOT = "HOT", "Hot (0-4 hours)"
    WARM = "WARM", "Warm (4-24 hours)"
    COLD = "COLD", "Cold (24+ hours)"

class Requirement(models.Model):
    """
    Main Requirement/JD Model - Company-wise isolated
    """
    # ================= MANUAL FIELDS =================
    title = models.CharField(max_length=255, verbose_name="Requirement Title / JD Name")
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE,
        related_name="requirements",
        verbose_name="Client Name"
    )
    experience_required = models.CharField(max_length=50, verbose_name="Experience Required (Years)")
    rate = models.CharField(max_length=100, blank=True, null=True, verbose_name="Rate (Optional)")
    time_zone = models.CharField(max_length=100, verbose_name="Time Zone")
    vendor_budget_range = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Vendor Budget Range"
    )   
    jd_description = models.TextField(verbose_name="JD Description")
    skills = models.TextField(
        help_text="Comma separated skills (e.g., Python, Django, React)",
        verbose_name="Skills",
         blank=True,  
        null=True
    )

    # ================= AUTO FIELDS =================
    requirement_id = models.CharField(
        max_length=20, 
        unique=True,
        editable=False,
        verbose_name="Requirement ID"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created Date")
    updated_at = models.DateTimeField(auto_now=True)

    # ================= COMPANY ISOLATION =================
    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'SUB_ADMIN'},
        related_name="company_requirements",
        verbose_name="Company (Sub-Admin)",
        help_text="Jis company ka Sub-Admin hai"
    )

    # ================= SYSTEM FIELDS =================
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_requirements",
        verbose_name="Created By"
    )
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    
    # ================= STATUS FIELDS =================
    manual_status = models.CharField(
        max_length=10,
        choices=RequirementStatus.choices,
        blank=True,
        null=True,
        verbose_name="Manually Set Status",
        help_text="If set, this overrides auto status"
    )
    manual_status_updated_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Manual Status Update Time"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Requirement"
        verbose_name_plural = "Requirements"
        indexes = [
            models.Index(fields=['company', '-created_at']),
            models.Index(fields=['requirement_id']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f"{self.requirement_id} - {self.title}"

    # def save(self, *args, **kwargs):
    #     # Company set karna agar create kar rahe hain to
    #     if not self.company_id and self.created_by:
    #         if self.created_by.role == 'SUB_ADMIN':
    #             self.company = self.created_by
    #         elif self.created_by.role == 'EMPLOYEE' and self.created_by.parent_user:
    #             self.company = self.created_by.parent_user
        
    #     if not self.requirement_id:
    #         self.requirement_id = self.generate_requirement_id()
    #     super().save(*args, **kwargs)
    
    def save(self, *args, **kwargs):
        # Company set karna
        if not self.company_id and self.created_by:
            if self.created_by.role == 'SUB_ADMIN':
                self.company = self.created_by
            elif self.created_by.role == 'EMPLOYEE' and self.created_by.parent_user:
                self.company = self.created_by.parent_user
        
        # Requirement ID generate for new record
        if not self.requirement_id:
            self.requirement_id = self.generate_requirement_id()
        
        super().save(*args, **kwargs)
        
        

    def generate_requirement_id(self):
        """
        Format: REQ-YYMM-XXX
        Example: REQ-2603-001
        Company-wise sequence maintain
        """
        current_month = timezone.now().strftime("%y%m")
        
        if not self.company:
            raise ValidationError("Company is required to generate Requirement ID")
        
        # Get or create counter for this company and month
        counter, created = RequirementIDCounter.objects.get_or_create(
            month=current_month,
            company=self.company,
            defaults={'last_sequence': 0}
        )
        
        # Increment sequence
        counter.last_sequence += 1
        counter.save()
        
        # Format sequence with leading zeros
        sequence = str(counter.last_sequence).zfill(3)
        
        return f"REQ-{current_month}-{sequence}"
        
    @property
    def status(self):
        """
        Real-time status calculate karta hai
        Agar manual status set hai to wo use hoga
        Warna created_time ke hisaab se auto calculate
        """
        if self.manual_status and self.manual_status_updated_at:
            # Manual status hai - check karo kitne time pehle update hua
            hours_passed = (timezone.now() - self.manual_status_updated_at).total_seconds() / 3600
            
            # Agar 24 hours se jyada ho gaye manual update ko, to auto status aana chahiye
            if hours_passed <= 24:
                return self.manual_status
        
        # Auto status calculation based on created_at
        hours_passed = (timezone.now() - self.created_at).total_seconds() / 3600
        
        if hours_passed <= 4:
            return "HOT"
        elif hours_passed <= 24:
            return "WARM"
        else:
            return "COLD"
        
    def set_manual_status(self, new_status):
        """Admin manually status set karne ke liye"""
        self.manual_status = new_status
        self.manual_status_updated_at = timezone.now()
        self.save(update_fields=['manual_status', 'manual_status_updated_at'])

    def clean(self):
        """Validation rules"""
        if self.is_deleted and not self.pk:
            raise ValidationError("New requirement cannot be marked as deleted")
        
        # Company validation
        if self.created_by:
            if self.created_by.role == 'EMPLOYEE' and self.created_by.parent_user:
                if self.company != self.created_by.parent_user:
                    raise ValidationError("Employee can only create requirements in their own company")
            elif self.created_by.role == 'SUB_ADMIN':
                if self.company != self.created_by:
                    raise ValidationError("Sub-admin can only create requirements in their own company")


class RequirementAssignment(models.Model):
    """
    JD kis kis ko assign hui hai - Company-wise isolated
    """
    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.CASCADE,
        related_name="assignments"
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'EMPLOYEE'},  # Sirf employees ko assign ho sakta
        related_name="assigned_requirements"
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_by_requirements"
    )
    assigned_date = models.DateTimeField(auto_now_add=True)
    
    # Company field for easy filtering
    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="company_assignments",
        editable=False
    )
    
    class Meta:
        unique_together = ['requirement', 'assigned_to']  # Ek user ko ek JD ek hi baar assign
        verbose_name = "Requirement Assignment"
        verbose_name_plural = "Requirement Assignments"
        indexes = [
            models.Index(fields=['company', 'assigned_to']),
            models.Index(fields=['requirement', 'assigned_to']),
        ]
    
    def __str__(self):
        return f"{self.requirement.requirement_id} → {self.assigned_to.email}"
    
    def save(self, *args, **kwargs):
        # Auto set company from requirement
        if not self.company_id:
            self.company = self.requirement.company
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validation rules"""
        # Check if assigned_to belongs to same company
        if self.assigned_to.role == 'EMPLOYEE':
            if self.assigned_to.parent_user != self.requirement.company:
                raise ValidationError("Cannot assign to employee from different company")
        elif self.assigned_to.role != 'EMPLOYEE':
            raise ValidationError("Can only assign to employees")
        
        # Check if assigned_by has permission
        if self.assigned_by:
            if self.assigned_by.role not in ['SUB_ADMIN', 'CENTRAL_ADMIN']:
                raise ValidationError("Only Sub-admin or Central Admin can assign")
            if self.assigned_by.role == 'SUB_ADMIN' and self.assigned_by != self.requirement.company:
                raise ValidationError("Sub-admin can only assign requirements from their own company")


class CandidateJDSubmission(models.Model):
    """
    Candidate kis JD ke liye submit hua - Company-wise isolated
    """
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="jd_submissions"
    )
    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.CASCADE,
        related_name="candidate_submissions"
    )
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="submitted_candidates_jd"
    )
    submission_date = models.DateTimeField(auto_now_add=True)
    
    # Company field for easy filtering
    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="company_submissions",
        editable=False
    )
    
    # Extra fields
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['candidate', 'requirement']  # Ek candidate ek JD mein ek baar
        ordering = ['-submission_date']
        verbose_name = "Candidate JD Submission"
        verbose_name_plural = "Candidate JD Submissions"
        indexes = [
            models.Index(fields=['company', '-submission_date']),
            models.Index(fields=['requirement', 'submitted_by']),
            models.Index(fields=['candidate']),
        ]
    
    def __str__(self):
        return f"{self.candidate.candidate_name} → {self.requirement.requirement_id}"
    
    def save(self, *args, **kwargs):
        # Auto set company from requirement
        if not self.company_id:
            self.company = self.requirement.company
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validation rules"""
        # Check if candidate already submitted for this JD
        if CandidateJDSubmission.objects.filter(
            candidate=self.candidate, 
            requirement=self.requirement
        ).exclude(pk=self.pk).exists():
            raise ValidationError("This candidate is already submitted for this JD")
        
        # Check if submitted_by belongs to same company
        if self.submitted_by:
            if self.submitted_by.role == 'EMPLOYEE':
                if self.submitted_by.parent_user != self.requirement.company:
                    raise ValidationError("Employee can only submit to their own company's JDs")
            elif self.submitted_by.role == 'SUB_ADMIN':
                if self.submitted_by != self.requirement.company:
                    raise ValidationError("Sub-admin can only submit to their own company's JDs")


class RequirementSkill(models.Model):
    """
    Optional: Agar skills ko alag se store karna ho to
    """
    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.CASCADE,
        related_name="skill_list"
    )
    skill_name = models.CharField(max_length=100)
    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="company_skills",
        editable=False
    )
    
    class Meta:
        unique_together = ['requirement', 'skill_name']
        verbose_name = "Requirement Skill"
        verbose_name_plural = "Requirement Skills"
    
    def __str__(self):
        return f"{self.requirement.requirement_id} - {self.skill_name}"
    
    def save(self, *args, **kwargs):
        if not self.company_id:
            self.company = self.requirement.company
        super().save(*args, **kwargs)


class SubmissionHistory(models.Model):
    """
    Submission changes track karne ke liye (audit log)
    """
    submission = models.ForeignKey(
        CandidateJDSubmission,
        on_delete=models.CASCADE,
        related_name="history"
    )
    action = models.CharField(max_length=50)  # CREATED, UPDATED, DELETED
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    performed_at = models.DateTimeField(auto_now_add=True)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-performed_at']
        verbose_name = "Submission History"
        verbose_name_plural = "Submission Histories"
    
    def __str__(self):
        return f"{self.submission} - {self.action} by {self.performed_by}"


class AssignmentHistory(models.Model):
    """
    Assignment changes track karne ke liye
    """
    assignment = models.ForeignKey(
        RequirementAssignment,
        on_delete=models.CASCADE,
        related_name="history"
    )
    action = models.CharField(max_length=50)  # ASSIGNED, UNASSIGNED
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    performed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-performed_at']
    
    def __str__(self):
        return f"{self.assignment} - {self.action}"