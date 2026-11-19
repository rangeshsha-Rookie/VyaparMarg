from pathlib import Path


MIGRATION = (
    Path(__file__).resolve().parents[1]
    / "supabase"
    / "migrations"
    / "20261119000000_scheme_import_review.sql"
).read_text(encoding="utf-8")


def test_import_tables_are_defined() -> None:
    for table_name in (
        "scheme_import_documents",
        "scheme_import_staging",
        "scheme_import_reviews",
    ):
        assert f"create table public.{table_name}" in MIGRATION


def test_staging_and_review_statuses_include_pending_verified_rejected() -> None:
    assert MIGRATION.count("check (status in ('pending', 'verified', 'rejected'))") >= 2


def test_import_tables_have_rls_and_admin_policies() -> None:
    for table_name in (
        "scheme_import_documents",
        "scheme_import_staging",
        "scheme_import_reviews",
    ):
        assert f"alter table public.{table_name} enable row level security;" in MIGRATION
        assert f"alter table public.{table_name} force row level security;" in MIGRATION

    assert "public.is_vyaparmarg_admin()" in MIGRATION
    assert "(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'" in MIGRATION
    assert "reviewer_id = (select auth.uid())" in MIGRATION


def test_migration_does_not_promote_or_reference_public_schemes() -> None:
    assert "references public.schemes" not in MIGRATION
    assert "public.schemes(" not in MIGRATION
    assert "promotion procedure" in MIGRATION
