#!/usr/bin/env python3
"""Safely promote verified scheme staging rows into the public catalog.

Default mode is dry-run. Use --apply only after a verified staging review.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

from supabase import create_client


class PromotionError(RuntimeError):
    pass


def verified_rows(staging_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [row for row in staging_rows if row.get("verification_status") == "verified"]


def rejected_count(staging_rows: list[dict[str, Any]]) -> int:
    return sum(
        1
        for row in staging_rows
        if row.get("verification_status") == "rejected"
        or row.get("status") == "rejected"
    )


def validate_record(row: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    slug = row.get("proposed_slug")
    record = row.get("proposed_record") or {}
    if not isinstance(slug, str) or not slug.strip():
        raise PromotionError(f"Staging row {row.get('id')} has no proposed_slug")
    if not isinstance(record, dict):
        raise PromotionError(f"Staging row {row.get('id')} has invalid proposed_record")

    name = record.get("name") or row.get("proposed_name")
    short_description = record.get("short_description")
    official_portal_url = record.get("official_portal_url")
    if not isinstance(name, str) or not name.strip():
        raise PromotionError(f"Staging row {row.get('id')} has no scheme name")
    if not isinstance(short_description, str) or not short_description.strip():
        raise PromotionError(f"Staging row {row.get('id')} has no short_description")
    if not isinstance(official_portal_url, str) or not official_portal_url.strip():
        raise PromotionError(f"Staging row {row.get('id')} has no official_portal_url")
    if not official_portal_url.startswith(("https://", "http://")):
        raise PromotionError(f"Staging row {row.get('id')} has unsafe official_portal_url")

    normalized = {
        "slug": slug.strip().lower(),
        "name": name.strip(),
        "short_description": short_description.strip(),
        "authority": record.get("authority"),
        "official_portal_url": official_portal_url.strip(),
        "supported_languages": record.get("supported_languages") or ["hi", "en"],
        "active": bool(record.get("active", True)),
        "source_url": record.get("source_url") or row.get("_document_source_url"),
        "source_document_id": row.get("document_id"),
        "source_document_sha256": row.get("_document_sha256"),
        "last_verified_at": row.get("reviewed_at"),
    }
    requirements = record.get("requirements") or []
    rules = record.get("rules") or []
    if not isinstance(requirements, list) or not isinstance(rules, list):
        raise PromotionError(f"Staging row {row.get('id')} has invalid requirements or rules")
    validate_children(requirements, rules)
    normalized["_requirements"] = requirements
    normalized["_rules"] = rules
    return normalized["slug"], normalized


def build_report(
    staging_rows: list[dict[str, Any]],
    existing_schemes: list[dict[str, Any]],
    force_update: bool,
) -> dict[str, Any]:
    existing_by_slug = {row["slug"]: row for row in existing_schemes}
    report: dict[str, Any] = {
        "mode": "dry_run",
        "inserted": [],
        "updated": [],
        "skipped": [],
        "rejected": [],
    }

    rejected_rows = [row for row in staging_rows if row.get("verification_status") == "rejected" or row.get("status") == "rejected"]
    report["rejected"] = [
        {"staging_id": row["id"], "reason": "verification status is rejected"}
        for row in rejected_rows
    ]

    for row in verified_rows(staging_rows):
        try:
            slug, record = validate_record(row)
        except PromotionError as exc:
            report["skipped"].append({"staging_id": row["id"], "reason": str(exc)})
            continue

        existing = existing_by_slug.get(slug)
        if existing:
            if existing.get("last_verified_at") and not force_update:
                report["skipped"].append({
                    "staging_id": row["id"],
                    "slug": slug,
                    "reason": "existing verified public record; use --force-update to replace",
                })
            else:
                report["updated"].append({
                    "staging_id": row["id"],
                    "scheme_id": existing["id"],
                    "slug": slug,
                    "source_document_sha256": record["source_document_sha256"],
                })
        else:
            report["inserted"].append({
                "staging_id": row["id"],
                "slug": slug,
                "source_document_sha256": record["source_document_sha256"],
            })

    report["inserted_count"] = len(report["inserted"])
    report["updated_count"] = len(report["updated"])
    report["skipped_count"] = len(report["skipped"])
    report["rejected_count"] = len(report["rejected"])
    return report


def fetch_staging(client: Any) -> list[dict[str, Any]]:
    response = (
        client.table("scheme_import_staging")
        .select("*,scheme_import_documents(*)")
        .execute()
    )
    rows = response.data or []
    result = []
    for row in rows:
        document = row.pop("scheme_import_documents", None) or {}
        row["_document_sha256"] = document.get("sha256")
        row["_document_source_path"] = document.get("source_path")
        row["_document_source_url"] = document.get("source_url")
        result.append(row)
    return result


def fetch_existing(client: Any) -> list[dict[str, Any]]:
    response = client.table("schemes").select("id,slug,last_verified_at").execute()
    return response.data or []


def validate_children(requirements: list[dict[str, Any]], rules: list[dict[str, Any]]) -> None:
    allowed_operators = {"equals", "not_equals", "in", "gte", "lte", "contains", "exists"}
    for requirement in requirements:
        if not isinstance(requirement, dict):
            raise PromotionError("Scheme requirement entries must be objects")
        for key in ("requirement_key", "label"):
            if not isinstance(requirement.get(key), str) or not requirement[key].strip():
                raise PromotionError(f"Scheme requirement is missing {key}")
    for rule in rules:
        if not isinstance(rule, dict):
            raise PromotionError("Scheme rule entries must be objects")
        for key in ("rule_key", "operator", "explanation"):
            if not isinstance(rule.get(key), str) or not rule[key].strip():
                raise PromotionError(f"Scheme rule is missing {key}")
        if rule["operator"] not in allowed_operators:
            raise PromotionError(f"Unsupported scheme rule operator: {rule['operator']}")
        if "expected_value" not in rule:
            raise PromotionError("Scheme rule is missing expected_value")


def promote_children(
    client: Any,
    scheme_id: str,
    requirements: list[dict[str, Any]],
    rules: list[dict[str, Any]],
) -> None:
    validate_children(requirements, rules)
    requirement_rows = [
        {
            "scheme_id": scheme_id,
            "requirement_key": item["requirement_key"].strip(),
            "label": item["label"].strip(),
            "data_type": item.get("data_type", "text"),
            "required": bool(item.get("required", True)),
            "help_text": item.get("help_text"),
        }
        for item in requirements
    ]
    rule_rows = [
        {
            "scheme_id": scheme_id,
            "rule_key": item["rule_key"].strip(),
            "operator": item["operator"].strip(),
            "expected_value": item["expected_value"],
            "explanation": item["explanation"].strip(),
            "priority": item.get("priority", 100),
        }
        for item in rules
    ]
    if requirement_rows:
        client.table("scheme_requirements").insert(requirement_rows).execute()
    if rule_rows:
        client.table("scheme_rules").insert(rule_rows).execute()


def replace_children(
    client: Any,
    scheme_id: str,
    requirements: list[dict[str, Any]],
    rules: list[dict[str, Any]],
) -> None:
    validate_children(requirements, rules)
    client.table("scheme_requirements").delete().eq("scheme_id", scheme_id).execute()
    client.table("scheme_rules").delete().eq("scheme_id", scheme_id).execute()
    promote_children(client, scheme_id, requirements, rules)


def apply_report(client: Any, report: dict[str, Any], staging_rows: list[dict[str, Any]]) -> dict[str, Any]:
    staging_by_id = {row["id"]: row for row in staging_rows}
    applied_inserted = []
    applied_updated = []

    for item in report["inserted"]:
        row = staging_by_id[item["staging_id"]]
        _, record = validate_record(row)
        requirements = record.pop("_requirements", [])
        rules = record.pop("_rules", [])
        scheme_response = (
            client.table("schemes")
            .insert(record)
            .select("id,slug")
            .execute()
        )
        created = (scheme_response.data or [{}])[0]
        scheme_id = created.get("id")
        if not scheme_id:
            raise PromotionError(f"Supabase did not return the promoted scheme for staging row {row['id']}")
        promote_children(client, scheme_id, requirements, rules)
        applied_inserted.append({"staging_id": row["id"], "scheme_id": created.get("id"), "slug": record["slug"]})

    for item in report["updated"]:
        row = staging_by_id[item["staging_id"]]
        _, record = validate_record(row)
        requirements = record.pop("_requirements", [])
        rules = record.pop("_rules", [])
        scheme_response = (
            client.table("schemes")
            .update(record)
            .eq("id", item["scheme_id"])
            .select("id,slug")
            .execute()
        )
        updated = (scheme_response.data or [{}])[0]
        scheme_id = updated.get("id") or item["scheme_id"]
        replace_children(client, scheme_id, requirements, rules)
        applied_updated.append({"staging_id": row["id"], "scheme_id": scheme_id, "slug": record["slug"]})

    report["mode"] = "applied"
    report["inserted"] = applied_inserted
    report["updated"] = applied_updated
    report["inserted_count"] = len(applied_inserted)
    report["updated_count"] = len(applied_updated)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Promote verified scheme staging records")
    parser.add_argument("--apply", action="store_true", help="Apply the promotion (default: dry-run)")
    parser.add_argument("--force-update", action="store_true", help="Update an existing verified public scheme")
    parser.add_argument("--output", type=Path, help="Optional report JSON path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

    client = create_client(url, service_key)
    staging_rows = fetch_staging(client)
    existing_schemes = fetch_existing(client)
    report = build_report(staging_rows, existing_schemes, args.force_update)

    if args.apply:
        report = apply_report(client, report, staging_rows)

    output = json.dumps(report, indent=2, ensure_ascii=False)
    print(output)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
