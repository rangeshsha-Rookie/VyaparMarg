import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.promote_verified_schemes import build_report, rejected_count, validate_record, verified_rows


def staging_row(status: str = "verified", slug: str = "pmegp") -> dict:
    return {
        "id": "staging-1",
        "document_id": "document-1",
        "proposed_slug": slug,
        "proposed_name": "Prime Minister Employment Scheme",
        "verification_status": status,
        "status": status,
        "reviewed_at": "2026-11-19T00:00:00Z",
        "_document_sha256": "a" * 64,
        "proposed_record": {
            "name": "Prime Minister Employment Scheme",
            "short_description": "A verified rural business support scheme.",
            "authority": "Test Authority",
            "official_portal_url": "https://example.gov.in/scheme",
            "supported_languages": ["en", "hi"],
        },
    }


def test_only_verified_rows_are_selected() -> None:
    rows = [staging_row("pending"), staging_row("rejected"), staging_row("verified")]
    assert [row["verification_status"] for row in verified_rows(rows)] == ["verified"]
    assert rejected_count(rows) == 1


def test_rejected_rows_are_reported_but_not_promoted() -> None:
    report = build_report([staging_row("rejected")], [], force_update=False)
    assert report["rejected_count"] == 1
    assert report["inserted_count"] == 0
    assert report["updated_count"] == 0


def test_existing_verified_record_is_skipped_by_default() -> None:
    row = staging_row("verified")
    report = build_report(
        [row],
        [{"id": "scheme-1", "slug": "pmegp", "last_verified_at": "2026-01-01T00:00:00Z"}],
        force_update=False,
    )
    assert report["skipped_count"] == 1
    assert report["updated_count"] == 0


def test_force_update_marks_existing_verified_record_for_update() -> None:
    row = staging_row("verified")
    report = build_report(
        [row],
        [{"id": "scheme-1", "slug": "pmegp", "last_verified_at": "2026-01-01T00:00:00Z"}],
        force_update=True,
    )
    assert report["updated_count"] == 1
    assert report["updated"][0]["scheme_id"] == "scheme-1"


def test_validate_record_rejects_missing_or_insecure_fields() -> None:
    row = staging_row("verified")
    row["proposed_record"]["official_portal_url"] = "javascript:alert(1)"
    try:
        validate_record(row)
    except RuntimeError:
        return
    raise AssertionError("unsafe URL was accepted")
