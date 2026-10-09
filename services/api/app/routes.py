from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from .auth import AuthenticatedUser, get_current_user
from .assistant_repository import create_conversation, create_message, get_owned_conversation
from .assistant_service import build_assistant_text
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
    HealthResponse,
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

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="vyaparmarg-api", version="0.1.0")


@router.get("/business-profiles", response_model=list[BusinessProfile], tags=["business-profiles"])
async def list_business_profiles(
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[BusinessProfile]:
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
    try:
        return recommend_schemes(client, profile_id, user.id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/applications", response_model=list[Application], tags=["applications"])
async def list_applications(
    user: AuthenticatedUser = Depends(get_current_user),
    client=Depends(get_supabase_client),
) -> list[Application]:
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
        recommendations = recommend_schemes(client, payload.business_profile_id, user.id)
        assistant_text = build_assistant_text(recommendations)
        assistant_message = create_message(
            client,
            conversation_id,
            user.id,
            "assistant",
            assistant_text,
            payload.language,
            structured_data={"recommendations": recommendations},
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
            extracted_profile={"business_profile_id": str(payload.business_profile_id)},
            recommendations=recommendation_items,
            engine_status="ready",
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
