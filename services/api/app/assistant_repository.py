from __future__ import annotations

from typing import Any
from uuid import UUID


def _first_row(response: Any, message: str) -> dict[str, Any]:
    data = response.data or []
    row = data[0] if isinstance(data, list) else data
    if not row:
        raise LookupError(message)
    return row


def get_owned_conversation(client: Any, conversation_id: UUID, user_id: UUID) -> dict[str, Any]:
    response = (
        client.table("conversations")
        .select("*")
        .eq("id", str(conversation_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    return _first_row(response, "Conversation not found")


def create_conversation(
    client: Any, user_id: UUID, profile_id: UUID, title: str
) -> dict[str, Any]:
    response = (
        client.table("conversations")
        .insert(
            {
                "user_id": str(user_id),
                "business_profile_id": str(profile_id),
                "title": title[:120],
            }
        )
        .select("*")
        .execute()
    )
    return _first_row(response, "Supabase did not return the created conversation")


def create_message(
    client: Any,
    conversation_id: UUID,
    user_id: UUID,
    role: str,
    content: str,
    language: str,
    structured_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    response = (
        client.table("messages")
        .insert(
            {
                "conversation_id": str(conversation_id),
                "user_id": str(user_id),
                "role": role,
                "content": content,
                "language": language,
                "structured_data": structured_data or {},
            }
        )
        .select("*")
        .execute()
    )
    return _first_row(response, "Supabase did not return the created message")
