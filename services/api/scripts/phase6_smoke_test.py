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
        raise SystemExit(
            "Business profile id must be the UUID returned by Phase 5, "
            "for example 4d294d44-f98f-4dad-b365-d1f38c6cd9f3."
        ) from exc

    auth_client = create_client(supabase_url, publishable_key)
    session = auth_client.auth.sign_in_with_password(
        {"email": email, "password": password}
    ).session
    if session is None:
        raise RuntimeError("Supabase did not return an authenticated session")

    headers = {"Authorization": f"Bearer {session.access_token}"}
    with httpx.Client(base_url=f"{api_base_url}/api/v1", headers=headers, timeout=15) as client:
        catalog = client.get("/schemes")
        catalog.raise_for_status()
        slugs = {item["slug"] for item in catalog.json()}
        assert {"pmegp", "pmfme"}.issubset(slugs)

        recommendations = client.get(f"/business-profiles/{profile_id}/recommendations")
        recommendations.raise_for_status()
        items = recommendations.json()
        assert items
        assert all("eligibility_status" in item for item in items)

    print("Phase 6 scheme catalog and recommendation slice passed")
    print(f"Catalog schemes: {', '.join(sorted(slugs))}")
    print(f"Recommendation count: {len(items)}")


if __name__ == "__main__":
    main()
