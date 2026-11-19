#!/usr/bin/env python3
"""Inventory, deduplicate, and extract text from scheme PDF staging files.

This script is intentionally read-only with respect to source PDFs and public
scheme records. It writes only derived staging artifacts.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Iterable

from pypdf import PdfReader


SECTION_NAMES = (
    "Benefits",
    "Eligibility",
    "Exclusions",
    "Application Process",
    "Documents Required",
    "Frequently Asked Questions",
    "Sources",
    "References",
)

HEADING_PATTERN = re.compile(
    r"(?i)(?<![A-Za-z])("
    r"Benefits|Eligibility|Exclusions|Application\s+Process|"
    r"Documents\s+Required|Frequently\s+Asked\s+Questions|Sources|References"
    r")(?![A-Za-z])"
)


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.digest().hex()


def discover_pdfs(input_dir: Path) -> list[Path]:
    if not input_dir.is_dir():
        raise ValueError(f"PDF input directory does not exist: {input_dir}")
    return sorted(
        (path for path in input_dir.rglob("*") if path.is_file() and path.suffix.lower() == ".pdf"),
        key=lambda path: path.relative_to(input_dir).as_posix(),
    )


def build_inventory(input_dir: Path, pdf_paths: Iterable[Path]) -> list[dict]:
    inventory = []
    for path in pdf_paths:
        inventory.append(
            {
                "source_path": path.relative_to(input_dir).as_posix(),
                "size_bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )
    return inventory


def deduplicate_inventory(inventory: list[dict]) -> dict:
    groups: dict[str, list[dict]] = {}
    for record in inventory:
        groups.setdefault(record["sha256"], []).append(record)

    unique: list[dict] = []
    duplicates: list[dict] = []
    for digest, records in sorted(groups.items()):
        representative = records[0]
        unique.append(
            {
                "sha256": digest,
                "source_path": representative["source_path"],
                "size_bytes": representative["size_bytes"],
            }
        )
        for duplicate in records[1:]:
            duplicates.append(
                {
                    "source_path": duplicate["source_path"],
                    "sha256": digest,
                    "duplicate_of": representative["source_path"],
                }
            )

    return {
        "hash_algorithm": "sha256",
        "source_pdf_count": len(inventory),
        "unique_pdf_count": len(unique),
        "duplicate_pdf_count": len(duplicates),
        "unique": unique,
        "duplicates": duplicates,
    }


def extract_text(pdf_path: Path) -> tuple[str, int]:
    reader = PdfReader(str(pdf_path))
    page_text = []
    for page in reader.pages:
        page_text.append(page.extract_text() or "")
    return "\n\n".join(page_text).strip(), len(reader.pages)


def normalize_heading(value: str) -> str:
    normalized = re.sub(r"\s+", " ", value).strip()
    return normalized.casefold()


def extract_sections(text: str) -> dict[str, str | None]:
    sections: dict[str, str | None] = {
        name: None for name in SECTION_NAMES
    }
    matches = list(HEADING_PATTERN.finditer(text))
    if not matches:
        return sections

    for index, match in enumerate(matches):
        heading_key = normalize_heading(match.group(1))
        canonical = next(
            (
                name
                for name in SECTION_NAMES
                if normalize_heading(name) == heading_key
            ),
            None,
        )
        if canonical is None:
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        content = text[match.end():end].strip()
        sections[canonical] = content or None
    return sections


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def run(input_dir: Path, output_dir: Path, dry_run: bool = False) -> dict:
    pdf_paths = discover_pdfs(input_dir)
    inventory = build_inventory(input_dir, pdf_paths)
    deduplication = deduplicate_inventory(inventory)

    duplicate_paths = {item["source_path"] for item in deduplication["duplicates"]}
    extracted = []
    failures = []

    for record in deduplication["unique"]:
        source_path = input_dir / record["source_path"]
        try:
            text, page_count = extract_text(source_path)
            extracted.append(
                {
                    "source_path": record["source_path"],
                    "sha256": record["sha256"],
                    "page_count": page_count,
                    "text_chars": len(text),
                    "text": text,
                    "sections": extract_sections(text),
                }
            )
        except Exception as exc:
            failures.append(
                {
                    "source_path": record["source_path"],
                    "sha256": record["sha256"],
                    "error": f"{type(exc).__name__}: {exc}",
                }
            )

    manifest = {
        "status": "dry_run" if dry_run else "completed",
        "hash_algorithm": "sha256",
        "input_dir": str(input_dir.resolve()),
        "output_dir": str(output_dir.resolve()),
        "source_pdf_count": len(pdf_paths),
        "preserved_source_pdf_count": len(pdf_paths),
        "unique_pdf_count": deduplication["unique_pdf_count"],
        "duplicate_pdf_count": deduplication["duplicate_pdf_count"],
        "text_extraction_count": len(extracted),
        "text_extraction_failure_count": len(failures),
        "public_scheme_records_modified": False,
    }

    if not dry_run:
        write_json(output_dir / "manifest.json", manifest)
        write_json(output_dir / "pdf_inventory.json", inventory)
        write_json(output_dir / "deduplication.json", deduplication)

        text_dir = output_dir / "text"
        sections_dir = output_dir / "sections"
        for item in extracted:
            digest = item["sha256"]
            (text_dir).mkdir(parents=True, exist_ok=True)
            (text_dir / f"{digest}.txt").write_text(item.pop("text"), encoding="utf-8")
            write_json(
                sections_dir / f"{digest}.json",
                {
                    "source_path": item["source_path"],
                    "sha256": item["sha256"],
                    "page_count": item["page_count"],
                    "sections": item["sections"],
                },
            )
            item.pop("sections")

        write_json(output_dir / "text_extraction.json", extracted)
        write_json(output_dir / "text_extraction_failures.json", failures)

    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Stage PDF inventory, SHA-256 deduplication, text extraction, and section extraction."
    )
    parser.add_argument(
        "input_dir",
        nargs="?",
        type=Path,
        default=Path("data/datasets/gov_myscheme/text_data"),
        help="Directory containing source PDFs (default: data/datasets/gov_myscheme/text_data)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/staging/myscheme"),
        help="Derived staging output directory (default: data/staging/myscheme)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute the inventory and extraction plan without writing staging artifacts",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest = run(args.input_dir, args.output_dir, dry_run=args.dry_run)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
