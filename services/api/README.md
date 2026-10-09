# VyaparMarg API skeleton

## Run locally

From the repository root:

```powershell
& .venv\Scripts\Activate.ps1
pip install -r services\api\requirements.txt
uvicorn app.main:app --app-dir services\api --reload
```

Before starting the API, create a root `.env` from `.env.example` and fill in
`SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`). Keep
the service-role key out of browser and mobile application code.

The first routes are available at `http://localhost:8000/api/v1`.

- `GET /health`
- `GET /business-profiles`
- `POST /business-profiles`
- `PATCH /business-profiles/{profile_id}`
- `POST /assistant/messages`

Business-profile routes now validate the Supabase bearer token and persist through
the logged-in user's Supabase session. The assistant endpoint now persists an
authenticated conversation turn and returns deterministic scheme recommendations.

## Authenticated smoke test

With the API running in another terminal, run this from the repository root:

```powershell
& .venv\Scripts\python.exe services\api\scripts\phase5_smoke_test.py
```

The script prompts for the Supabase test-user email and password without saving
either value. It creates one temporary profile, reads it back, and updates it.

## Scheme recommendation smoke test

With the API running, run:

```powershell
& .venv\Scripts\python.exe services\api\scripts\phase6_smoke_test.py
```

Enter the same test user and a business profile ID. The script verifies the
PMEGP and PMFME catalog entries and the authenticated deterministic recommendations.

## Assistant conversation smoke test

With the API running, run:

```powershell
& .venv\Scripts\python.exe services\api\scripts\phase7_smoke_test.py
```

The script creates one authenticated assistant turn, persists the conversation
and both messages, and returns the deterministic recommendation results.
