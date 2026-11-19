from __future__ import annotations

import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger("vyaparmarg.api")

from .auth import AuthenticatedUser, DEMO_USER_ID, get_current_user
from .assistant_repository import create_conversation, create_message, get_owned_conversation
from .assistant_service import build_assistant_text, build_multilingual_assistant_text
from .dependencies import get_supabase_client
from .models import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    Application,
    ApplicationCreate,
    ApplicationUpdate,
    BusinessProfile,
    BusinessProfileCreate,
    BusinessProfileUpdate,
    DigitalToolItem,
    DigitalToolRecommendation,
    DocumentChecklistItem,
    GrowthDashboardResponse,
    HealthResponse,
    LogisticsQuoteRequest,
    LogisticsQuoteResponse,
    MarketplaceItem,
    MarketplaceRecommendation,
    PortalGuideItem,
    SchemeCatalogItem,
    SchemeRecommendation,
)
from .repositories import (
    create_business_profile as insert_business_profile,
    list_business_profiles as select_business_profiles,
    update_business_profile as patch_business_profile,
    create_application as insert_application,
    list_applications as select_applications,
    update_application as patch_application,
)
from .scheme_repository import (
    get_active_scheme,
    list_active_schemes,
    recommend_schemes,
)
from services.ai.profile_extractor import extract_profile_from_text
from services.documents.checklist_engine import generate_document_checklist
from services.marketplaces.recommender import (
    DEFAULT_MARKETPLACES,
    DEFAULT_DIGITAL_TOOLS,
    recommend_marketplaces_for_profile,
    recommend_digital_tools_for_profile,
)
from services.portals.portal_service import get_portal_guide, list_portal_guides
from services.integrations.logistics_contract import calculate_logistics_quote
from services.integrations.dashboard_contract import generate_growth_dashboard_summary

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="vyaparmarg-api", version="0.1.0")


# ==========================================
# 1. Business Profiles Flow
# ==========================================

@router.get("/business-profiles", response_model=list[BusinessProfile], tags=["business-profiles"])
async def list_business_profiles(
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[BusinessProfile]:
    if user.id == DEMO_USER_ID or client is None:
        return [
            BusinessProfile(
                id=DEMO_USER_ID,
                user_id=DEMO_USER_ID,
                business_name="Savita Agro & Turmeric Processing",
                business_type="agro_processing",
                district="Sangli",
                state="Maharashtra",
                annual_turnover=1800000,
                category="OBC (SHG)",
                gender="female",
                created_at="2026-11-19T00:00:00Z",
                updated_at="2026-11-19T00:00:00Z",
            )
        ]
    return select_business_profiles(client, user.id)


@router.post(
    "/business-profiles",
    response_model=BusinessProfile,
    status_code=status.HTTP_201_CREATED,
    tags=["business-profiles"],
)
async def create_business_profile(
    payload: BusinessProfileCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> BusinessProfile:
    return insert_business_profile(
        client,
        user.id,
        payload.model_dump(exclude_none=True),
    )


@router.patch(
    "/business-profiles/{profile_id}",
    response_model=BusinessProfile,
    tags=["business-profiles"],
)
async def update_business_profile(
    profile_id: UUID,
    payload: BusinessProfileUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> BusinessProfile:
    try:
        return patch_business_profile(
            client,
            user.id,
            profile_id,
            payload.model_dump(exclude_none=True),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ==========================================
# 2. Scheme Catalog & Discovery
# ==========================================

@router.get("/schemes", response_model=list[SchemeCatalogItem], tags=["schemes"])
async def list_schemes(
    _user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[SchemeCatalogItem]:
    return list_active_schemes(client)


@router.get("/schemes/{slug}", response_model=SchemeCatalogItem, tags=["schemes"])
async def get_scheme(
    slug: str,
    _user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> SchemeCatalogItem:
    scheme = get_active_scheme(client, slug)
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@router.get(
    "/business-profiles/{profile_id}/recommendations",
    response_model=list[SchemeRecommendation],
    tags=["recommendations"],
)
async def recommend_for_business_profile(
    profile_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[SchemeRecommendation]:
    if profile_id == DEMO_USER_ID or user.id == DEMO_USER_ID or not client:
        return [
            SchemeRecommendation(
                scheme_id=UUID("00000000-0000-0000-0000-000000000001"),
                rank=1,
                eligibility_status="eligible",
                score=0.95,
                reasons=[
                    "Rural location in Sangli qualifies for maximum 35% margin money subsidy",
                    "Special Category benefit (Women + OBC SHG entrepreneur)",
                    "Agro and turmeric food processing is a top priority manufacturing sector",
                ],
                missing_requirements=[],
                scheme=SchemeCatalogItem(
                    id=UUID("00000000-0000-0000-0000-000000000001"),
                    slug="pmegp",
                    name="Prime Minister's Employment Generation Programme (PMEGP)",
                    short_description="Up to 35% government capital subsidy on bank-financed projects up to ₹50 Lakh for rural food and agro manufacturing units.",
                    official_portal_url="https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
                ),
            ),
            SchemeRecommendation(
                scheme_id=UUID("00000000-0000-0000-0000-000000000002"),
                rank=2,
                eligibility_status="eligible",
                score=0.92,
                reasons=[
                    "ODOP (One District One Product) verified for Sangli Turmeric Processing Cluster",
                    "35% credit-linked capital subsidy up to ₹10 Lakh for machinery upgrade",
                ],
                missing_requirements=[],
                scheme=SchemeCatalogItem(
                    id=UUID("00000000-0000-0000-0000-000000000002"),
                    slug="pmfme",
                    name="PM Formalisation of Micro Food Processing Enterprises (PMFME)",
                    short_description="35% credit-linked subsidy up to ₹10 Lakh for machinery purchase, FSSAI compliance, and modern packaging.",
                    official_portal_url="https://pmfme.mofpi.gov.in/",
                ),
            ),
            SchemeRecommendation(
                scheme_id=UUID("00000000-0000-0000-0000-000000000003"),
                rank=3,
                eligibility_status="eligible",
                score=0.90,
                reasons=[
                    "Maharashtra state domicile confirmed",
                    "Up to 30% capital subsidy from Maharashtra Directorate of Industries",
                ],
                missing_requirements=[],
                scheme=SchemeCatalogItem(
                    id=UUID("00000000-0000-0000-0000-000000000003"),
                    slug="cmegp",
                    name="Chief Minister Employment Generation Programme (CMEGP Maharashtra)",
                    short_description="Government of Maharashtra flagship scheme providing 25-30% capital subsidy on manufacturing projects up to ₹50 Lakh.",
                    official_portal_url="https://maha-cmegp.gov.in/",
                ),
            ),
        ]
    try:
        return recommend_schemes(client, profile_id, user.id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ==========================================
# 3. Document Readiness Checklist (Phase 4)
# ==========================================

@router.get(
    "/schemes/{slug}/document-checklist",
    response_model=list[DocumentChecklistItem],
    tags=["documents"],
)
async def get_scheme_document_checklist(
    slug: str,
    profile_id: UUID | None = None,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[DocumentChecklistItem]:
    profile_data: dict = {}
    if profile_id:
        profiles = select_business_profiles(client, user.id)
        matched = [p for p in profiles if p.id == profile_id]
        if matched:
            profile_data = matched[0].model_dump()

    checklist = generate_document_checklist(slug, profile_data)
    return [DocumentChecklistItem(**item) for item in checklist]


# ==========================================
# 4. Marketplaces & Digital Tools (Phase 6)
# ==========================================

@router.get("/marketplaces", response_model=list[MarketplaceItem], tags=["marketplaces"])
async def list_marketplaces(
    _user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[MarketplaceItem]:
    try:
        res = client.table("marketplaces").select("*").eq("active", True).execute()
        if res.data:
            return [MarketplaceItem(**m) for m in res.data]
    except Exception as exc:
        logger.info("Reading live marketplaces from Supabase failed (%s), using verified seed catalog.", exc)
    return [MarketplaceItem(**m) for m in DEFAULT_MARKETPLACES]


@router.get(
    "/business-profiles/{profile_id}/marketplaces",
    response_model=list[MarketplaceRecommendation],
    tags=["marketplaces"],
)
async def recommend_marketplaces(
    profile_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[MarketplaceRecommendation]:
    profiles = select_business_profiles(client, user.id)
    matched = [p for p in profiles if p.id == profile_id]
    if not matched:
        raise HTTPException(status_code=404, detail="Business profile not found")
    profile_dict = matched[0].model_dump()

    # Query database catalog first
    catalog = None
    try:
        res = client.table("marketplaces").select("*").eq("active", True).execute()
        if res.data:
            catalog = res.data
    except Exception as exc:
        logger.info("Reading live marketplaces failed (%s), using verified seed catalog.", exc)

    recs = recommend_marketplaces_for_profile(profile_dict, catalog=catalog)
    return [MarketplaceRecommendation(**r) for r in recs]


@router.get("/digital-tools", response_model=list[DigitalToolItem], tags=["digital-tools"])
async def list_digital_tools(
    _user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[DigitalToolItem]:
    try:
        res = client.table("digital_tools").select("*").eq("active", True).execute()
        if res.data:
            return [DigitalToolItem(**t) for t in res.data]
    except Exception as exc:
        logger.info("Reading live digital tools from Supabase failed (%s), using verified seed catalog.", exc)
    return [DigitalToolItem(**t) for t in DEFAULT_DIGITAL_TOOLS]


@router.get(
    "/business-profiles/{profile_id}/digital-tools",
    response_model=list[DigitalToolRecommendation],
    tags=["digital-tools"],
)
async def recommend_digital_tools(
    profile_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[DigitalToolRecommendation]:
    profiles = select_business_profiles(client, user.id)
    matched = [p for p in profiles if p.id == profile_id]
    if not matched:
        raise HTTPException(status_code=404, detail="Business profile not found")
    profile_dict = matched[0].model_dump()

    catalog = None
    try:
        res = client.table("digital_tools").select("*").eq("active", True).execute()
        if res.data:
            catalog = res.data
    except Exception as exc:
        logger.info("Reading live digital tools failed (%s), using verified seed catalog.", exc)

    recs = recommend_digital_tools_for_profile(profile_dict, catalog=catalog)
    return [DigitalToolRecommendation(**r) for r in recs]


# ==========================================
# 5. Maharashtra Government Portal Guidance (Phase 5 & 10)
# ==========================================

@router.get("/portals", response_model=list[PortalGuideItem], tags=["portals"])
async def list_portals(
    _user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[PortalGuideItem]:
    try:
        res = client.table("portal_guides").select("*").eq("active", True).execute()
        if res.data:
            return [PortalGuideItem(**g) for g in res.data]
    except Exception as exc:
        logger.info("Reading live portal guides failed (%s), using verified seed catalog.", exc)
    return [PortalGuideItem(**g) for g in list_portal_guides()]


@router.get("/portals/{portal_slug}", response_model=PortalGuideItem, tags=["portals"])
async def get_portal(
    portal_slug: str,
    _user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> PortalGuideItem:
    try:
        res = client.table("portal_guides").select("*").eq("portal_slug", portal_slug).eq("active", True).execute()
        if res.data:
            return PortalGuideItem(**res.data[0])
    except Exception as exc:
        logger.info("Reading portal guide for %s failed (%s), using verified seed catalog.", portal_slug, exc)
    guide = get_portal_guide(portal_slug)
    if guide is None:
        raise HTTPException(status_code=404, detail="Portal guide not found")
    return PortalGuideItem(**guide)


# ==========================================
# 6. Applications Flow
# ==========================================

@router.get("/applications", response_model=list[Application], tags=["applications"])
async def list_applications(
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[Application]:
    if user.id == DEMO_USER_ID or not client:
        return [
            Application(
                id=UUID("00000000-0000-0000-0000-000000000071"),
                business_profile_id=DEMO_USER_ID,
                scheme_id=UUID("00000000-0000-0000-0000-000000000001"),
                status="in_progress",
                official_application_id="MH-SANGLI-PMEGP-2026-8841",
                portal_url="https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
                last_step="DIC District Task Force Committee (DTFC) Interview Scheduled",
                created_at="2026-11-10T10:00:00Z",
                updated_at="2026-11-18T14:30:00Z",
            ),
            Application(
                id=UUID("00000000-0000-0000-0000-000000000072"),
                business_profile_id=DEMO_USER_ID,
                scheme_id=UUID("00000000-0000-0000-0000-000000000002"),
                status="started",
                official_application_id="PMFME-MH-SGL-5520",
                portal_url="https://pmfme.mofpi.gov.in/",
                last_step="Document Verification - FSSAI & Machinery Quotation",
                created_at="2026-11-15T11:00:00Z",
                updated_at="2026-11-19T09:00:00Z",
            ),
        ]
    return select_applications(client, user.id)


@router.post(
    "/applications",
    response_model=Application,
    status_code=status.HTTP_201_CREATED,
    tags=["applications"],
)
async def create_application(
    payload: ApplicationCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> Application:
    try:
        return insert_application(client, user.id, payload.business_profile_id, payload.scheme_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch(
    "/applications/{application_id}",
    response_model=Application,
    tags=["applications"],
)
async def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> Application:
    try:
        return patch_application(
            client,
            user.id,
            application_id,
            payload.model_dump(exclude_none=True),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ==========================================
# 7. Assistant Conversation (Phase 3 & 8)
# ==========================================

@router.post(
    "/assistant/messages",
    response_model=AssistantMessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["assistant"],
)
async def create_assistant_message(
    payload: AssistantMessageRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> AssistantMessageResponse:
    if user.id == DEMO_USER_ID or client is None:
        extracted = extract_profile_from_text(payload.message)
        dummy_recs = [
            {
                "scheme_id": UUID("00000000-0000-0000-0000-000000000001"),
                "rank": 1,
                "eligibility_status": "eligible",
                "score": 0.95,
                "reasons": ["Rural location in Sangli qualifies for maximum 35% margin money subsidy"],
                "missing_requirements": [],
            }
        ]
        assistant_text = build_multilingual_assistant_text(
            recommendations=dummy_recs,
            language=payload.language,
            extracted_profile=extracted,
            query_text=payload.message,
        )
        return AssistantMessageResponse(
            conversation_id=payload.conversation_id or uuid4(),
            message_id=uuid4(),
            assistant_message=assistant_text,
            extracted_profile=extracted,
            recommendations=dummy_recs,
            engine_status="ready",
        )

    try:
        if payload.conversation_id:
            conversation = get_owned_conversation(client, payload.conversation_id, user.id)
        else:
            conversation = create_conversation(
                client,
                user.id,
                payload.business_profile_id,
                payload.message,
            )
        conversation_id = UUID(str(conversation["id"]))
        create_message(
            client,
            conversation_id,
            user.id,
            "user",
            payload.message,
            payload.language,
        )

        # Extract structured entities from natural user query
        extracted = extract_profile_from_text(payload.message)
        extracted["business_profile_id"] = str(payload.business_profile_id)

        # Synchronize newly extracted profile details directly into database
        profile_patch = {}
        if "business_type" in extracted:
            profile_patch["business_type"] = extracted["business_type"]
        if "district" in extracted:
            profile_patch["district"] = extracted["district"]
        if "annual_turnover" in extracted:
            profile_patch["annual_turnover"] = extracted["annual_turnover"]

        extra_data = {k: v for k, v in extracted.items() if k in {"category", "gender", "is_urban"}}
        if extra_data:
            profile_patch["profile_data"] = extra_data

        if profile_patch:
            try:
                patch_business_profile(client, user.id, payload.business_profile_id, profile_patch)
                logger.info("Successfully synchronized %d extracted fields to profile %s", len(profile_patch), payload.business_profile_id)
            except Exception as exc:
                logger.warning("Could not auto-patch business profile from message (%s): %s", payload.business_profile_id, exc)

        recommendations = recommend_schemes(client, payload.business_profile_id, user.id)

        # Generate culturally nuanced multilingual text (Marathi/Hindi/English)
        assistant_text = build_multilingual_assistant_text(
            recommendations=recommendations,
            language=payload.language,
            extracted_profile=extracted,
            query_text=payload.message,
        )

        assistant_message = create_message(
            client,
            conversation_id,
            user.id,
            "assistant",
            assistant_text,
            payload.language,
            structured_data={"recommendations": recommendations, "extracted": extracted},
        )
        recommendation_items = [
            {
                "scheme_id": item["scheme_id"],
                "rank": item["rank"],
                "eligibility_status": item["eligibility_status"],
                "score": item["score"],
                "reasons": item["reasons"],
                "missing_requirements": item["missing_requirements"],
            }
            for item in recommendations
        ]
        return AssistantMessageResponse(
            conversation_id=conversation_id,
            message_id=UUID(str(assistant_message["id"])),
            assistant_message=assistant_text,
            extracted_profile=extracted,
            recommendations=recommendation_items,
            engine_status="ready",
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ==========================================
# 8. Team Integration Contracts (Phase 11)
# ==========================================

@router.post(
    "/integrations/logistics/quote",
    response_model=LogisticsQuoteResponse,
    tags=["integrations"],
)
async def get_logistics_quote(
    payload: LogisticsQuoteRequest,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> LogisticsQuoteResponse:
    """Contract with Student 2: Shivam (Smart Rural Logistics Planner)."""
    quote = calculate_logistics_quote(
        origin_district=payload.origin_district,
        destination_district=payload.destination_district,
        weight_kg=payload.weight_kg,
        cargo_type=payload.cargo_type,
    )
    return LogisticsQuoteResponse(**quote)


@router.get(
    "/business-profiles/{profile_id}/dashboard-summary",
    response_model=GrowthDashboardResponse,
    tags=["integrations"],
)
async def get_growth_dashboard_summary_endpoint(
    profile_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> GrowthDashboardResponse:
    """Contract with Student 3: Shruti (Rural Business Growth Dashboard)."""
    profiles = select_business_profiles(client, user.id)
    matched = [p for p in profiles if p.id == profile_id]
    if not matched:
        raise HTTPException(status_code=404, detail="Business profile not found")

    profile_dict = matched[0].model_dump()
    apps = select_applications(client, user.id)
    apps_dict = [a.model_dump() for a in apps]
    try:
        recs = recommend_schemes(client, profile_id, user.id)
    except Exception:
        recs = []

    summary = generate_growth_dashboard_summary(profile_dict, apps_dict, recs)
    return GrowthDashboardResponse(**summary)
