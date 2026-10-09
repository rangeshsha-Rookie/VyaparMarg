from __future__ import annotations

import getpass
import os

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

    auth_client = create_client(supabase_url, publishable_key)
    session = auth_client.auth.sign_in_with_password(
        {"email": email, "password": password}
    ).session
    if session is None:
        raise RuntimeError("Supabase did not return an authenticated session")

    headers = {"Authorization": f"Bearer {session.access_token}"}
    profile = {
        "business_name": "Phase 5 Smoke Test",
        "business_type": "retail",
        "state": "Maharashtra",
        "district": "Thane",
    }

    with httpx.Client(base_url=f"{api_base_url}/api/v1", headers=headers, timeout=15) as client:
        created = client.post("/business-profiles", json=profile)
        created.raise_for_status()
        created_profile = created.json()
        profile_id = created_profile["id"]

        listed = client.get("/business-profiles")
        listed.raise_for_status()
        assert any(item["id"] == profile_id for item in listed.json())

        updated = client.patch(
            f"/business-profiles/{profile_id}",
            json={"business_name": "Phase 5 Smoke Test Updated"},
        )
        updated.raise_for_status()
        assert updated.json()["business_name"] == "Phase 5 Smoke Test Updated"

    print("Phase 5 authenticated profile slice passed")
    print(f"Created profile id: {profile_id}")


if __name__ == "__main__":
    main()
