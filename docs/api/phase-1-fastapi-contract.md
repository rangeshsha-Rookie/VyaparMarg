# VyaparMarg Phase 1 FastAPI contract

Base URL: `/api/v1`

Authentication: `Authorization: Bearer <supabase access token>`.
FastAPI validates the Supabase JWT. Service-role credentials stay server-side.

## Health

`GET /health`

Response:

```json
{"status":"ok","service":"vyaparmarg-api","version":"0.1.0"}
```

## Business profile

`GET /business-profiles`

`POST /business-profiles`

```json
{
  "business_name": "Shree Dairy",
  "business_type": "dairy",
  "state": "Maharashtra",
  "district": "Thane",
  "pincode": "400000",
  "annual_turnover": 250000,
  "employee_count": 2,
  "registration_status": "unregistered",
  "profile_data": {}
}
```

`PATCH /business-profiles/{id}` updates only the authenticated user’s profile.

## Assistant and recommendations

`POST /assistant/messages`

Request:

```json
{
  "business_profile_id": "uuid",
  "message": "mala dairy business expand karaycha aahe",
  "language": "mr",
  "conversation_id": "uuid"
}
```

Response:

```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "extracted_profile": {
    "business_type": "dairy",
    "goal": "expansion"
  },
  "recommendations": [
    {
      "scheme_id": "uuid",
      "rank": 1,
      "eligibility_status": "needs_information",
      "score": 0.87,
      "reasons": ["business type matches"],
      "missing_requirements": ["gst_information"]
    }
  ]
}
```

The LLM extracts and explains. The scheme engine evaluates rules and produces the eligibility status.

## Scheme catalog

`GET /schemes?business_profile_id={id}` returns active schemes and deterministic match results.

`GET /schemes/{slug}` returns the scheme, requirements, rules, and official portal URL.

## Applications

`POST /applications` creates a planned application after the user selects a scheme.

`PATCH /applications/{id}` updates status and the last assisted portal step.

## Error format

```json
{
  "error": {
    "code": "validation_error",
    "message": "business_type is required",
    "request_id": "uuid"
  }
}
```
