from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class Vendor(models.Model):
    # ================= REQUIRED FIELDS =================
    name = models.CharField(max_length=255)
    number = models.CharField(max_length=15)
    company_name = models.CharField(max_length=255)

    # ================= OPTIONAL FIELDS =================
    email = models.EmailField(blank=True, null=True)
    company_website = models.URLField(blank=True, null=True)
    company_pan_or_reg_no = models.CharField(max_length=100, blank=True, null=True)

    # ================= POC DETAILS =================
    poc1_name = models.CharField(max_length=255, blank=True, null=True)
    poc1_number = models.CharField(max_length=15, blank=True, null=True)

    poc2_name = models.CharField(max_length=255, blank=True, null=True)
    poc2_number = models.CharField(max_length=15, blank=True, null=True)

    # ================= BUSINESS DETAILS =================
    top_3_clients = models.TextField(blank=True, null=True)
    no_of_bench_developers = models.PositiveIntegerField(blank=True, null=True)
    provide_onsite = models.BooleanField(default=False)
    onsite_location = models.CharField(max_length=255, blank=True, null=True)
    specialized_tech_developers = models.TextField(blank=True, null=True)

    # ================= DOCUMENT =================
    bench_list = models.FileField(upload_to="vendor/bench_list/", blank=True, null=True)

    # ================= NEW AGREEMENT SECTION =================
    class AgreementStatus(models.TextChoices):
        NOT_SENT = "NOT_SENT", "Not Sent"
        SENT = "SENT", "Sent"
        SIGNED = "SIGNED", "Signed"

    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    nda_document = models.FileField(upload_to="vendors/nda/", blank=True, null=True)
    nda_uploaded_date = models.DateField(blank=True, null=True)

    msa_document = models.FileField(upload_to="vendors/msa/", blank=True, null=True)
    msa_uploaded_date = models.DateField(blank=True, null=True)

    nda_status = models.CharField(
        max_length=20,
        choices=AgreementStatus.choices,
        default=AgreementStatus.NOT_SENT,
        blank=True,
        null=True
    )

    msa_status = models.CharField(
        max_length=20,
        choices=AgreementStatus.choices,
        default=AgreementStatus.NOT_SENT,
        blank=True,
        null=True
    )

    vendor_official_email = models.EmailField(blank=True, null=True)
    sending_email_id = models.EmailField(blank=True, null=True)

    provide_bench = models.BooleanField(default=False)
    provide_market = models.BooleanField(default=False)

    company_employee_count = models.PositiveIntegerField(blank=True, null=True)

    remark = models.TextField(blank=True, null=True)

    # ================= SYSTEM FIELDS =================
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vendors"
    )

    assigned_employees = models.ManyToManyField(
        User,
        blank=True,
        related_name="assigned_vendors"
    )
    
    created_by = models.ForeignKey(
        User,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="created_vendor"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.nda_document and not self.nda_uploaded_date:
            self.nda_uploaded_date = timezone.now().date()

        if self.msa_document and not self.msa_uploaded_date:
            self.msa_uploaded_date = timezone.now().date()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.company_name} - {self.name}"
    
    
class Client(models.Model):
    client_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)

    # ================= NEW AGREEMENT SECTION =================
    class AgreementStatus(models.TextChoices):
        NOT_SENT = "NOT_SENT", "Not Sent"
        SENT = "SENT", "Sent"
        SIGNED = "SIGNED", "Signed"

    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    nda_document = models.FileField(upload_to="clients/nda/", blank=True, null=True)
    nda_uploaded_date = models.DateField(blank=True, null=True)

    msa_document = models.FileField(upload_to="clients/msa/", blank=True, null=True)
    msa_uploaded_date = models.DateField(blank=True, null=True)
    
    nda_status = models.CharField(
        max_length=20,
        choices=AgreementStatus.choices,
        default=AgreementStatus.NOT_SENT,
        blank=True,
        null=True
    )

    msa_status = models.CharField(
        max_length=20,
        choices=AgreementStatus.choices,
        default=AgreementStatus.NOT_SENT,
        blank=True,
        null=True
    )

    official_email = models.EmailField(blank=True, null=True)
    sending_email_id = models.EmailField(blank=True, null=True)

    company_employee_count = models.PositiveIntegerField(blank=True, null=True)

    remark = models.TextField(blank=True, null=True)

    # ================= SYSTEM =================
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_clients"
    )
    
    assigned_employees = models.ManyToManyField(
            User,
            blank=True,
            related_name="assigned_clients"
        )
    
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    #================Bank Accounts===================
    # ================= BILLING INFORMATION =================
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)

    account_holder_name = models.CharField(max_length=255, blank=True, null=True)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=100, blank=True, null=True)
    ifsc_code = models.CharField(max_length=50, blank=True, null=True)
    # ===============================================

    def save(self, *args, **kwargs):
        if self.nda_document and not self.nda_uploaded_date:
            self.nda_uploaded_date = timezone.now().date()

        if self.msa_document and not self.msa_uploaded_date:
            self.msa_uploaded_date = timezone.now().date()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_name} - {self.company_name}"
        
    
from django.db import models
from django.conf import settings
from employee_portal.models import Vendor, Client

User = settings.AUTH_USER_MODEL


class Candidate(models.Model):
    class RateType(models.TextChoices):
        # --- Local/Standard Rates ---
        LPA = "LPA", "LPA (Lakh Per Annum)"
        LPM = "LPM", "LPM (Lakh Per Month)"
        KPM = "KPM", "KPM (Thousand Per Month)"
        PHR = "PHR", "PHR (Per Hour - INR)"
        
        # --- International Rates (Fixed & Per Hour) ---
        USD = "USD", "USD (US Dollar)"
        USD_PH = "USD_PH", "USD/hr (US Dollar Per Hour)"
        
        EUR = "EUR", "EUR (Euro)"
        EUR_PH = "EUR_PH", "EUR/hr (Euro Per Hour)"
        
        GBP = "GBP", "GBP (Great Britain Pound)"
        GBP_PH = "GBP_PH", "GBP/hr (Pound Per Hour)"

        AED = "AED", "AED (UAE Dirham)"
        SGD = "SGD", "SGD (Singapore Dollar)"
        SAR = "SAR", "SAR (Saudi Riyal)"
        CNY = "CNY", "CNY (Chinese Yuan)"
        JPY = "JPY", "JPY (Japanese Yen)"
        AUD = "AUD", "AUD (Australian Dollar)"
        CAD = "CAD", "CAD (Canadian Dollar)"
        CHF = "CHF", "CHF (Swiss Franc)"
        HKD = "HKD", "HKD (Hong Kong Dollar)"
        THB = "THB", "THB (Thai Baht)"
        MYR = "MYR", "MYR (Malaysian Ringgit)"
        KRW = "KRW", "KRW (South Korean Won)"
        NZD = "NZD", "NZD (New Zealand Dollar)"
        NOK = "NOK", "NOK (Norwegian Krone)"
        SEK = "SEK", "SEK (Swedish Krona)"
        DKK = "DKK", "DKK (Danish Krone)"
        ZAR = "ZAR", "ZAR (South African Rand)"
        RUB = "RUB", "RUB (Russian Ruble)"
        KWD = "KWD", "KWD (Kuwaiti Dinar)"
        QAR = "QAR", "QAR (Qatari Riyal)"

    # ================= RESUME =================
    resume = models.FileField(upload_to="candidates/resumes/", blank=True, null=True)

    # ================= CANDIDATE DETAILS =================
    candidate_name = models.CharField(max_length=255)
    candidate_email = models.EmailField(blank=True, null=True)
    candidate_number = models.CharField(max_length=20,blank=True, null=True)

    years_of_experience_manual = models.CharField(max_length=10000,blank=True, null=True)
    years_of_experience_calculated = models.FloatField(blank=True, null=True)

    skills = models.TextField(blank=True, null=True)
    technology = models.CharField(max_length=10055, blank=True, null=True)

    # ================= VENDOR DETAILS =================
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, related_name="candidates")
    vendor_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    vendor_rate_type = models.CharField(
        max_length=10,
        choices=RateType.choices,
        blank=True,
        null=True
    )

    # ================= CLIENT DETAILS =================
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name="candidates")
    client_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    client_rate_type = models.CharField(
        max_length=10,
        choices=RateType.choices,
        blank=True,
        null=True
    )
    # ================= INTERNAL SUBMISSION =================
    submitted_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_candidates"
    )

    # ================= STATUS =================
    class MainStatus(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        SCREENING = "SCREENING", "Screening"
        L1 = "L1", "L1"
        L2 = "L2", "L2"
        L3 = "L3", "L3"
        OTHER = "OTHER", "Other"
        OFFERED = "OFFERED","Offered"
        ONBORD = "ONBORD", "onbord"
        ON_HOLD  ="ON_HOLD", "On Hold"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        REJECTED ="REJECTED","Rejected"
        OFFBOARDED = "OFFBOARDED", "Offboarded"
        NONE = "NONE","None"


    class SubStatus(models.TextChoices):
        NONE = "NONE", "None"
        SCHEDULED = "SCHEDULED","Scheduled"
        COMPLETED = "COMPLETED","Completed"
        FEEDBACK_PENDING = "FEEDBACK_PENDING", "Feedback Pending"
        CLEARED = "CLEARED" , "CLEARED"
        REJECTED = "REJECTED","Rejected"
        POSTPONED = "POSTPONED","Postponed"
        NO_SHOW = "NO_SHOW" , "No Show"
        ON_HOLD  ="ON_HOLD", "On Hold"
        INTERVIEW_PENDING = "INTERVIEW_PENDING" , "Interview Pending"

        # WAIT_FOR_THE_UPDATE = "WAIT_FOR_THE_UPDATE","Wait For The Update"
        

    main_status = models.CharField(max_length=100, choices=MainStatus.choices, default=MainStatus.SUBMITTED)
    sub_status = models.CharField(max_length=100, choices=SubStatus.choices, default=SubStatus.NONE)

    # ================= VERIFICATION =================
    verification_status = models.BooleanField(default=False)

    # ================= BLACKLIST =================
    is_blocklisted = models.BooleanField(default=False)
    blocklisted_reason = models.TextField(blank=True, null=True)

    # ================= TRACKING =================
    remark = models.TextField(blank=True, null=True)
    extra_details = models.TextField(blank=True, null=True)

    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="changed_candidates"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    created_by = models.ForeignKey(
        User,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="created_candidates"
    )
    is_deleted = models.BooleanField(default=False)
    #--------------ye celender reminder ke liye
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    schedule_description = models.TextField(null=True, blank=True)
    google_event_id = models.CharField(max_length=255, null=True, blank=True)

    scheduled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="scheduled_candidates"
    )
    #--------------------------------------  
    #-------------For Invoicing------------
    # ========= BILLING INFO =========
    billing_start_date = models.DateField(blank=True, null=True)
    billing_end_date = models.DateField(blank=True, null=True)

    default_billing_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True
    )

    default_billing_rate_type = models.CharField(
        max_length=10,
        choices=RateType.choices,
        blank=True,
        null=True
    )
    
    # =============================================
    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="company_candidates",
        null=True,
        blank=True
    )
    
    def save(self, *args, **kwargs):
        # Auto-set company from created_by
        if not self.company and self.created_by:
            if self.created_by.role == 'SUB_ADMIN':
                self.company = self.created_by
            elif self.created_by.role == 'EMPLOYEE' and self.created_by.parent_user:
                self.company = self.created_by.parent_user
        super().save(*args, **kwargs)
    # =============================================

    def __str__(self):
        return self.candidate_name

from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied


class CandidateSoftDeleteAPIView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)

    def get_company_root(self, user):
        if user.role == "SUB_ADMIN":
            return user
        if user.role == "EMPLOYEE" and user.parent_user:
            return user.parent_user
        raise PermissionDenied("Invalid company structure.")

    def get_queryset(self):
        user = self.request.user
        UserModel = get_user_model()

        company_root = self.get_company_root(user)

        company_users = UserModel.objects.filter(
            Q(id=company_root.id) | Q(parent_user=company_root)
        )

        return Candidate.objects.filter(
            created_by__in=company_users,
            is_deleted=False
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        # Only creator employee or company SubAdmin can soft delete
        if user.role == "SUB_ADMIN":
            pass
        elif instance.created_by == user:
            pass
        else:
            raise PermissionDenied("You do not have permission to delete this candidate.")

        instance.is_deleted = True
        instance.changed_by = user
        instance.save(update_fields=["is_deleted", "changed_by"])

        return Response(
            {"message": "Candidate soft deleted successfully"},
            status=status.HTTP_200_OK
        )

# ================= STATUS HISTORY =================
class CandidateStatusHistory(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=50, blank=True, null=True)
    new_status = models.CharField(max_length=50)
    sub_status = models.CharField(max_length=50, blank=True, null=True)

    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)


# ================= REMARK HISTORY =================
class CandidateRemarkHistory(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="remark_history")
    remark = models.TextField()

    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
   
    
class TimeSheet(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="timesheets")
    month = models.DateField()
    total_working_days = models.PositiveIntegerField(default=0)
    working_days = models.PositiveIntegerField(default=0)
    leave_days = models.PositiveIntegerField(default=0)
    file = models.FileField(upload_to="candidates/timesheets/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="uploaded_timesheets")

    def save(self, *args, **kwargs):
        self.leave_days = self.total_working_days - self.working_days
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.candidate.candidate_name} - {self.month.strftime('%B %Y')}"


class VendorInvoice(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="vendor_invoices")
    month = models.DateField()
    total_amount_with_gst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount_without_gst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    file = models.FileField(upload_to="candidates/vendor_invoices/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="uploaded_vendor_invoices")

    def save(self, *args, **kwargs):
        # Calculate amount without GST: amount_with_gst / (1 + gst_rate/100)
        if self.total_amount_with_gst and self.gst_rate:
            self.total_amount_without_gst = self.total_amount_with_gst / (1 + (self.gst_rate / 100))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.candidate.candidate_name} - {self.month.strftime('%B %Y')}"