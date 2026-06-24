from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    document: Mapped[str] = mapped_column(String(18), nullable=False, unique=True)
    document_type: Mapped[str] = mapped_column(Enum("CPF", "CNPJ", name="document_type_enum"), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    segment: Mapped[str | None] = mapped_column(String(100), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    referral_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("PENDING", "ACTIVE", "SUSPENDED", "TERMINATED", name="partner_status_enum"),
        nullable=False,
        default="PENDING",
    )
    hashed_password: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    bank_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    term_accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    term_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    term_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    documents: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    leads: Mapped[list["Lead"]] = relationship("Lead", back_populates="partner")
    commissions: Mapped[list["Commission"]] = relationship("Commission", back_populates="partner")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    partner_id: Mapped[int] = mapped_column(Integer, ForeignKey("partners.id"), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    cpf: Mapped[str] = mapped_column(String(11), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address_street: Mapped[str | None] = mapped_column(String(200), nullable=True)
    address_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address_complement: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_state: Mapped[str | None] = mapped_column(String(2), nullable=True)
    address_zip: Mapped[str | None] = mapped_column(String(8), nullable=True)
    utm_code: Mapped[str] = mapped_column(String(20), nullable=False)
    utm_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lgpd_consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    lgpd_consent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lgpd_consent_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "EXPIRED", "DISQUALIFIED", name="lead_status_enum"),
        nullable=False,
        default="NEW",
    )
    attribution_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    partner: Mapped["Partner"] = relationship("Partner", back_populates="leads")
    properties: Mapped[list["Property"]] = relationship("Property", back_populates="lead")

    __table_args__ = (
        Index("ix_lead_phone", "phone"),
        Index("ix_lead_address", "address_street", "address_number", "address_city"),
    )


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id"), nullable=False)
    partner_id: Mapped[int] = mapped_column(Integer, ForeignKey("partners.id"), nullable=False)
    owner_name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_document: Mapped[str] = mapped_column(String(18), nullable=False)
    address_street: Mapped[str] = mapped_column(String(200), nullable=False)
    address_number: Mapped[str] = mapped_column(String(20), nullable=False)
    address_complement: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_city: Mapped[str] = mapped_column(String(100), nullable=False)
    address_state: Mapped[str] = mapped_column(String(2), nullable=False)
    address_zip: Mapped[str] = mapped_column(String(8), nullable=False)
    contract_model: Mapped[str] = mapped_column(Enum("A", "B", "C", name="contract_model_enum"), nullable=False)
    model_a_setup_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    model_a_revenue_pct: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    model_b_setup_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    model_b_fixed_monthly: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    model_b_revenue_pct: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    model_c_first_allocation: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    model_c_ongoing_pct: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    setup_fee_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    setup_fee_paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("LEAD", "PROPOSAL_SENT", "CONTRACT_SIGNED", "ONBOARDING", "OPERATIONAL", "CANCELLED", name="property_status_enum"),
        nullable=False,
        default="LEAD",
    )
    operational_since: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    lead: Mapped["Lead"] = relationship("Lead", back_populates="properties")
    revenue_records: Mapped[list["RevenueRecord"]] = relationship(
        "RevenueRecord", back_populates="property"
    )
    commissions: Mapped[list["Commission"]] = relationship("Commission", back_populates="property")


class RevenueRecord(Base):
    __tablename__ = "revenue_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    property_id: Mapped[int] = mapped_column(Integer, ForeignKey("properties.id"), nullable=False)
    reference_year: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_month: Mapped[int] = mapped_column(Integer, nullable=False)
    gross_revenue: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    wecare_admin_fee: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    owner_payout: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    is_first_complete_month: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    property: Mapped["Property"] = relationship("Property", back_populates="revenue_records")

    __table_args__ = (
        UniqueConstraint(
            "property_id", "reference_year", "reference_month",
            name="uq_revenue_record_period",
        ),
    )


class Commission(Base):
    __tablename__ = "commissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    partner_id: Mapped[int] = mapped_column(Integer, ForeignKey("partners.id"), nullable=False)
    property_id: Mapped[int] = mapped_column(Integer, ForeignKey("properties.id"), nullable=False)
    revenue_record_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("revenue_records.id"), nullable=False, unique=True
    )
    contract_model: Mapped[str] = mapped_column(Enum("A", "B", "C", name="contract_model_enum"), nullable=False)
    commission_base: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    commission_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("PENDING", "AWAITING_NFSE", "APPROVED", "PAID", "CANCELLED", name="commission_status_enum"),
        nullable=False,
        default="PENDING",
    )
    cancellation_reason: Mapped[str | None] = mapped_column(
        Enum("OWNER_CANCELLED", "PROPERTY_NEVER_OPERATED", "FRAUD", "CHARGEBACK", name="cancellation_reason_enum"),
        nullable=True,
    )
    payment_due_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    nfse_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )

    partner: Mapped["Partner"] = relationship("Partner", back_populates="commissions")
    property: Mapped["Property"] = relationship("Property", back_populates="commissions")


class InAppNotification(Base):
    __tablename__ = "in_app_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("partners.id"), nullable=False)
    event_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    type: Mapped[str] = mapped_column(
        Enum("NEW_LEAD", "COMMISSION_UPDATED", "PROPERTY_STATUS", name="notification_type_enum"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(String(500), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    user: Mapped["Partner"] = relationship("Partner")

    __table_args__ = (
        Index("ix_notifications_user_created", "user_id", "created_at"),
        Index("ix_notifications_user_read", "user_id", "read_at"),
    )


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(
        Enum("ART", "TEXT", "PRESENTATION", name="material_category_enum"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum("PUBLISHED", "ARCHIVED", name="material_status_enum"),
        nullable=False,
        default="PUBLISHED",
    )
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_by_partner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("partners.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )


class MaterialDownload(Base):
    __tablename__ = "material_downloads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("materials.id"), nullable=False)
    partner_id: Mapped[int] = mapped_column(Integer, ForeignKey("partners.id"), nullable=False)
    downloaded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    __table_args__ = (
        Index("ix_material_downloads_material", "material_id"),
        Index("ix_material_downloads_partner", "partner_id"),
    )
