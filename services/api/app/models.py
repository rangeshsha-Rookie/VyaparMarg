from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


Language = Literal["mr", "hi", "en", "hinglish"]
EligibilityStatus = Literal["eligible", "likely", "ineligible", "needs_information"]
ApplicationStatus = Literal["planned", "started", "in_progress", "submitted", "completed", "abandoned"]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str


class BusinessProfileCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_name: str | None = None
    business_type: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, min_length=4, max_length=10)
    annual_turnover: float | None = Field(default=None, ge=0)
    employee_count: int | None = Field(default=None, ge=0)
    registration_status: str | None = Field(default=None, max_length=100)
    profile_data: dict[str, object] = Field(default_factory=dict)


class BusinessProfile(BusinessProfileCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class BusinessProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_name: str | None = None
    business_type: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, min_length=4, max_length=10)
    annual_turnover: float | None = Field(default=None, ge=0)
    employee_count: int | None = Field(default=None, ge=0)
    registration_status: str | None = Field(default=None, max_length=100)
    profile_data: dict[str, object] | None = None


class SchemeRequirement(BaseModel):
    requirement_key: str
    label: str
    data_type: str
    required: bool
    help_text: str | None = None


class SchemeCatalogItem(BaseModel):
    id: UUID
    slug: str
    name: str
    short_description: str
    authority: str | None = None
    official_portal_url: str
    supported_languages: list[str]
    source_url: str | None = None
    last_verified_at: datetime | None = None
    requirements: list[SchemeRequirement] = Field(default_factory=list)


class AssistantMessageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_profile_id: UUID
    message: str = Field(min_length=1, max_length=4000)
    language: Language
    conversation_id: UUID | None = None


class RecommendationItem(BaseModel):
    scheme_id: UUID
    rank: int = Field(gt=0)
    eligibility_status: EligibilityStatus
    score: float | None = Field(default=None, ge=0, le=1)
    reasons: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)


class SchemeRecommendation(RecommendationItem):
    scheme: SchemeCatalogItem


class ApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_profile_id: UUID
    scheme_id: UUID


class ApplicationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ApplicationStatus | None = None
    official_application_id: str | None = Field(default=None, max_length=200)
    last_step: str | None = Field(default=None, max_length=200)


class Application(BaseModel):
    id: UUID
    user_id: UUID
    business_profile_id: UUID
    scheme_id: UUID
    status: ApplicationStatus
    official_application_id: str | None = None
    portal_url: str
    last_step: str | None = None
    last_seen_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AssistantMessageResponse(BaseModel):
    conversation_id: UUID
    message_id: UUID
    assistant_message: str
    extracted_profile: dict[str, object] = Field(default_factory=dict)
    recommendations: list[RecommendationItem] = Field(default_factory=list)
    engine_status: Literal["not_connected", "ready"]


# New Models for Marketplaces & Digital Tools
class MarketplaceItem(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    description: str
    target_sectors: list[str]
    onboarding_url: str
    commission_model: str
    benefits: list[str]
    required_documents: list[str]
    active: bool = True


class MarketplaceRecommendation(BaseModel):
    marketplace: MarketplaceItem
    score: float
    reasons: list[str]
    onboarding_url: str


class DigitalToolItem(BaseModel):
    id: str
    slug: str
    name: str
    tool_type: str
    pricing_tier: str
    description: str
    best_for: str
    official_url: str
    supported_languages: list[str]
    features: list[str]
    offline_support: bool
    active: bool = True


class DigitalToolRecommendation(BaseModel):
    tool: DigitalToolItem
    score: float
    reasons: list[str]
    official_url: str


# Document Checklist
class DocumentChecklistItem(BaseModel):
    key: str
    name_en: str
    name_mr: str
    issuing_portal: str
    authority: str
    help_text: str
    mandatory: bool
    status: str
    is_ready: bool


# Portal Guidance
class PortalGuideStep(BaseModel):
    step_number: int
    title: str
    description: str
    tip: str | None = None


class PortalGuideItem(BaseModel):
    portal_slug: str
    portal_name: str
    official_url: str
    department: str
    state: str
    description: str
    steps: list[PortalGuideStep]
    prerequisites: list[str]
    helpdesk_contact: str | None = None


# Student 2 Integration: Logistics
class LogisticsQuoteRequest(BaseModel):
    origin_district: str
    destination_district: str
    weight_kg: float = Field(gt=0)
    cargo_type: str = "general"


class LogisticsCarrierQuote(BaseModel):
    carrier_name: str
    vehicle_type: str
    capacity_kg: float
    estimated_cost_inr: float
    estimated_delivery_hours: int
    best_for: str
    rural_doorstep_pickup: bool


class LogisticsQuoteResponse(BaseModel):
    origin_district: str
    destination_district: str
    weight_kg: float
    cargo_type: str
    estimated_distance_km: float
    available_carriers: list[LogisticsCarrierQuote]
    recommended_carrier: str
    integrated_module: str


# Student 3 Integration: Growth Dashboard
class GrowthDashboardResponse(BaseModel):
    business_name: str
    district: str
    annual_turnover_inr: float
    digital_readiness_score: int
    readiness_factors: list[str]
    potential_subsidy_inr: float
    active_applications_count: int
    suggested_actions: list[str]
    integrated_module: str


def new_timestamp() -> datetime:
    return datetime.now(timezone.utc)


def build_business_profile(payload: BusinessProfileCreate, user_id: UUID) -> BusinessProfile:
    now = new_timestamp()
    return BusinessProfile(
        id=uuid4(),
        user_id=user_id,
        created_at=now,
        updated_at=now,
        **payload.model_dump(),
    )
