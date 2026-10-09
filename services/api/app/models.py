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
