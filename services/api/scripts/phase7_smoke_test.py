from __future__ import annotations

import getpass
import os
from uuid import UUID

import httpx
from dotenv import load_dotenv
from supabase import create_client


def main() -> None:
    load_dotenv()
    supabase_url = os.environ["SUPABASE_URL"]
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.environ["SUPABASE_ANON_KEY"]
    api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")

    email = input("Supabase test-user email: ").strip()
    password = getpass.getpass("Supabase test-user password: ")
    profile_id_input = input("Business profile UUID: ").strip()
    try:
        profile_id = str(UUID(profile_id_input))
    except ValueError as exc:
        raise SystemExit("Business profile id must be a valid UUID.") from exc

    auth_client = create_client(supabase_url, publishable_key)
    session = auth_client.auth.sign_in_with_password(
        {"email": email, "password": password}
    ).session
    if session is None:
        raise RuntimeError("Supabase did not return an authenticated session")

    headers = {"Authorization": f"Bearer {session.access_token}"}
    with httpx.Client(base_url=f"{api_base_url}/api/v1", headers=headers, timeout=15) as client:
        response = client.post(
            "/assistant/messages",
            json={
                "business_profile_id": profile_id,
                "message": "Which schemes may fit my business?",
                "language": "en",
            },
        )
        response.raise_for_status()
        body = response.json()
        assert body["engine_status"] == "ready"
        assert body["conversation_id"]
        assert body["message_id"]
        assert body["recommendations"]

    print("Phase 7 assistant conversation slice passed")
    print(f"Conversation id: {body['conversation_id']}")
    print(f"Recommendation count: {len(body['recommendations'])}")


if __name__ == "__main__":
    main()
