from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator


class PartnerSelfRegister(BaseModel):
    full_name: str
    document: str
    email: EmailStr
    phone: str | None = None
    segment: str | None = None
    company_name: str | None = None
    lgpd_consent: bool
    term_version: str = "1.0"

    @field_validator("document")
    @classmethod
    def validate_document(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) not in (11, 14):
            raise ValueError("Documento deve ter 11 dígitos (CPF) ou 14 (CNPJ).")
        return digits

    @field_validator("lgpd_consent")
    @classmethod
    def must_accept(cls, v: bool) -> bool:
        if not v:
            raise ValueError("É necessário aceitar os termos para continuar.")
        return v


class PartnerCreate(BaseModel):
    full_name: str
    document: str
    email: EmailStr
    phone: str | None = None
    segment: str | None = None
    company_name: str | None = None
    bank_info: dict | None = None
    initial_password: str | None = None

    @field_validator("document")
    @classmethod
    def validate_document(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) not in (11, 14):
            raise ValueError("Documento deve ter 11 dígitos (CPF) ou 14 (CNPJ).")
        return digits


class PartnerStatusUpdate(BaseModel):
    status: Literal["PENDING", "ACTIVE", "SUSPENDED", "TERMINATED"]


class PartnerUpdate(BaseModel):
    phone: str | None = None
    segment: str | None = None
    company_name: str | None = None
    referral_url: str | None = None
    bank_info: dict | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("A senha deve ter pelo menos 6 caracteres.")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("A senha deve ter pelo menos 6 caracteres.")
        return v


class PartnerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    document: str
    document_type: str
    email: str
    phone: str | None
    segment: str | None
    company_name: str | None
    utm_code: str
    referral_url: str
    status: str
    is_admin: bool
    must_change_password: bool
    term_accepted_at: datetime | None
    term_version: str | None
    documents: list | None
    created_at: datetime


class AdminDashboard(BaseModel):
    partners_total: int
    partners_active: int
    partners_pending: int
    leads_total: int
    leads_active: int
    leads_week: int
    leads_converted: int
    properties_total: int
    properties_operational: int
    commissions_pending_count: int
    commissions_pending_amount: Decimal
    commissions_paid_month: Decimal


class PartnerDashboard(BaseModel):
    partner_id: int
    partner_name: str
    utm_link: str
    total_leads: int
    active_leads: int
    leads_new: int
    leads_in_progress: int
    converted_leads: int
    total_properties: int
    operational_properties: int
    pending_commissions: int
    total_commissions_paid: Decimal
    total_commissions_pending: Decimal
    commissions_to_receive_month: Decimal


class LeadCreate(BaseModel):
    utm_code: str
    full_name: str
    cpf: str
    email: EmailStr
    phone: str | None = None
    address_street: str | None = None
    address_number: str | None = None
    address_complement: str | None = None
    address_city: str | None = None
    address_state: str | None = None
    address_zip: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    lgpd_consent: bool
    lgpd_consent_ip: str | None = None

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) != 11:
            raise ValueError("CPF deve ter 11 dígitos.")
        return digits

    @field_validator("address_state")
    @classmethod
    def validate_state(cls, v: str | None) -> str | None:
        if v is not None and len(v) != 2:
            raise ValueError("Estado deve ser sigla com 2 letras (ex: SP).")
        return v.upper() if v else v

    @field_validator("address_zip")
    @classmethod
    def validate_zip(cls, v: str | None) -> str | None:
        if v is not None:
            digits = "".join(c for c in v if c.isdigit())
            if len(digits) != 8:
                raise ValueError("CEP deve ter 8 dígitos.")
            return digits
        return v


class LeadStatusUpdate(BaseModel):
    status: Literal["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "EXPIRED", "DISQUALIFIED"]
    reason: str | None = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    partner_id: int
    full_name: str
    email: str
    cpf: str
    phone: str | None
    address_street: str | None
    address_number: str | None
    address_complement: str | None
    address_city: str | None
    address_state: str | None
    address_zip: str | None
    status: str
    attribution_expires_at: datetime
    created_at: datetime


class PropertyCreate(BaseModel):
    lead_id: int
    owner_name: str
    owner_document: str
    address_street: str
    address_number: str
    address_complement: str | None = None
    address_city: str
    address_state: str
    address_zip: str
    contract_model: Literal["A", "B", "C"]
    model_a_setup_fee: Decimal | None = None
    model_a_revenue_pct: Decimal | None = None
    model_b_setup_fee: Decimal | None = None
    model_b_fixed_monthly: Decimal | None = None
    model_b_revenue_pct: Decimal | None = None
    model_c_first_allocation: Decimal | None = None
    model_c_ongoing_pct: Decimal | None = None

    @model_validator(mode="after")
    def check_contract_fields(self) -> Self:
        if self.contract_model == "A" and self.model_a_revenue_pct is None:
            raise ValueError("Modelo A requer model_a_revenue_pct.")
        if self.contract_model == "B" and (
            self.model_b_fixed_monthly is None or self.model_b_revenue_pct is None
        ):
            raise ValueError("Modelo B requer model_b_fixed_monthly e model_b_revenue_pct.")
        if self.contract_model == "C" and (
            self.model_c_first_allocation is None or self.model_c_ongoing_pct is None
        ):
            raise ValueError("Modelo C requer model_c_first_allocation e model_c_ongoing_pct.")
        return self


class PropertyUpdate(BaseModel):
    owner_name: str | None = None
    owner_document: str | None = None
    address_street: str | None = None
    address_number: str | None = None
    address_complement: str | None = None
    address_city: str | None = None
    address_state: str | None = None
    address_zip: str | None = None
    model_a_setup_fee: Decimal | None = None
    model_a_revenue_pct: Decimal | None = None
    model_b_setup_fee: Decimal | None = None
    model_b_fixed_monthly: Decimal | None = None
    model_b_revenue_pct: Decimal | None = None
    model_c_first_allocation: Decimal | None = None
    model_c_ongoing_pct: Decimal | None = None


class PropertyStatusUpdate(BaseModel):
    status: Literal[
        "LEAD", "PROPOSAL_SENT", "CONTRACT_SIGNED", "ONBOARDING", "OPERATIONAL", "CANCELLED"
    ]


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lead_id: int
    partner_id: int
    owner_name: str
    owner_document: str
    address_street: str
    address_number: str
    address_complement: str | None
    address_city: str
    address_state: str
    address_zip: str
    contract_model: str
    model_a_setup_fee: Decimal | None
    model_a_revenue_pct: Decimal | None
    model_b_setup_fee: Decimal | None
    model_b_fixed_monthly: Decimal | None
    model_b_revenue_pct: Decimal | None
    model_c_first_allocation: Decimal | None
    model_c_ongoing_pct: Decimal | None
    status: str
    operational_since: datetime | None
    created_at: datetime


class RevenueRecordCreate(BaseModel):
    property_id: int
    reference_year: int
    reference_month: int

    @field_validator("reference_month")
    @classmethod
    def validate_month(cls, v: int) -> int:
        if not 1 <= v <= 12:
            raise ValueError("Mês deve estar entre 1 e 12.")
        return v

    gross_revenue: Decimal
    wecare_admin_fee: Decimal
    owner_payout: Decimal


class RevenueRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    reference_year: int
    reference_month: int
    gross_revenue: Decimal
    wecare_admin_fee: Decimal
    owner_payout: Decimal
    is_first_complete_month: bool
    created_at: datetime


class CommissionStatusUpdate(BaseModel):
    status: Literal["AWAITING_NFSE", "APPROVED", "PAID", "CANCELLED"]
    cancellation_reason: (
        Literal["OWNER_CANCELLED", "PROPERTY_NEVER_OPERATED", "FRAUD", "CHARGEBACK"] | None
    ) = None
    nfse_number: str | None = None

    @model_validator(mode="after")
    def check_cancellation(self) -> Self:
        if self.status == "CANCELLED" and self.cancellation_reason is None:
            raise ValueError("cancellation_reason é obrigatório ao cancelar.")
        return self


class CommissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    partner_id: int
    property_id: int
    revenue_record_id: int
    contract_model: str
    commission_base: Decimal
    commission_amount: Decimal
    status: str
    cancellation_reason: str | None
    payment_due_date: date
    paid_at: datetime | None
    nfse_number: str | None
    created_at: datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    title: str
    body: str
    payload: dict | None
    read_at: datetime | None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int


class MaterialCreate(BaseModel):
    title: str
    description: str | None = None
    category: Literal["ART", "TEXT", "PRESENTATION"]
    tags: list[str] | None = None
    file_url: str
    file_name: str
    file_mime_type: str | None = None
    file_size_bytes: int | None = None


class MaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    category: str
    status: str
    tags: list | None
    file_url: str
    file_name: str
    file_mime_type: str | None
    file_size_bytes: int | None
    created_at: datetime


class MaterialDownloadResponse(BaseModel):
    material: MaterialResponse
    download_url: str


class KanbanPropertySummary(BaseModel):
    id: int
    status: str
    address_city: str
    address_state: str
    owner_name: str
    contract_model: str


class KanbanCommissionSummary(BaseModel):
    count_pending: int
    count_paid: int
    total_pending: Decimal
    total_paid: Decimal
    latest_status: str | None


class KanbanLeadCard(BaseModel):
    id: int
    partner_id: int
    full_name: str
    email: str
    cpf: str
    phone: str | None
    address_street: str | None
    address_number: str | None
    address_complement: str | None
    address_city: str | None
    address_state: str | None
    address_zip: str | None
    status: str
    attribution_expires_at: datetime
    created_at: datetime
    partner_name: str
    partner_utm_code: str
    days_remaining_attribution: int
    kanban_column: Literal["NEW", "CONTACTED", "QUALIFIED", "ONBOARDING", "OPERATIONAL", "CANCELLED"]
    property: KanbanPropertySummary | None
    commission: KanbanCommissionSummary | None


class KanbanResponse(BaseModel):
    NEW: list[KanbanLeadCard]
    CONTACTED: list[KanbanLeadCard]
    QUALIFIED: list[KanbanLeadCard]
    ONBOARDING: list[KanbanLeadCard]
    OPERATIONAL: list[KanbanLeadCard]
    CANCELLED: list[KanbanLeadCard]
