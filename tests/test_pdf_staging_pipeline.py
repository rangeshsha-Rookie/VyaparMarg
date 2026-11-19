import hashlib
import sys
from pathlib import Path

from pypdf import PdfWriter

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.pdf_staging_pipeline import (
    build_inventory,
    deduplicate_inventory,
    extract_sections,
    extract_text,
    run,
)


def write_pdf(path: Path, title: str) -> None:
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    with path.open("wb") as handle:
        writer.write(handle)


def test_build_inventory_and_sha256_deduplication(tmp_path: Path) -> None:
    first = tmp_path / "first.pdf"
    second = tmp_path / "nested"
    second.mkdir()
    duplicate = second / "duplicate.pdf"
    write_pdf(first, "First")
    duplicate.write_bytes(first.read_bytes())

    inventory = build_inventory(tmp_path, [first, duplicate])
    result = deduplicate_inventory(inventory)

    assert result["source_pdf_count"] == 2
    assert result["unique_pdf_count"] == 1
    assert result["duplicate_pdf_count"] == 1
    assert result["duplicates"][0]["duplicate_of"] == "first.pdf"
    assert len(result["unique"][0]["sha256"]) == 64
    assert result["unique"][0]["sha256"] == hashlib.sha256(first.read_bytes()).hexdigest()


def test_extract_sections() -> None:
    text = """
Scheme Details
Benefits
Cash grant is available.
Eligibility
Applicant must be 18 years or older.
Documents Required
Aadhaar
PAN card
Sources
https://example.gov.in
""".strip()

    sections = extract_sections(text)

    assert sections["Benefits"] == "Cash grant is available."
    assert sections["Eligibility"] == "Applicant must be 18 years or older."
    assert sections["Documents Required"] == "Aadhaar\nPAN card"
    assert sections["Sources"] == "https://example.gov.in"
    assert sections["Application Process"] is None


def test_extract_text_from_real_pdf(tmp_path: Path) -> None:
    pdf_path = tmp_path / "scheme.pdf"
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    with pdf_path.open("wb") as handle:
        writer.write(handle)

    text, page_count = extract_text(pdf_path)

    assert text == ""
    assert page_count == 1


def test_dry_run_does_not_write_or_modify_source(tmp_path: Path) -> None:
    input_dir = tmp_path / "input"
    output_dir = tmp_path / "output"
    input_dir.mkdir()
    source = input_dir / "scheme.pdf"
    write_pdf(source, "Scheme")
    original_bytes = source.read_bytes()

    manifest = run(input_dir, output_dir, dry_run=True)

    assert manifest["status"] == "dry_run"
    assert manifest["public_scheme_records_modified"] is False
    assert source.read_bytes() == original_bytes
    assert not output_dir.exists()
