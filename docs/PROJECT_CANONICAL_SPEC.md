# VyaparMarg — Canonical Project Specification

This file is the source of truth for all AI tools, IDEs, agents, and contributors working on VyaparMarg. Future analysis may refine implementation details, but must not replace the locked problem statements, ownership boundaries, or product direction below.

## Project identity

- **Project:** VyaparMarg
- **Theme:** Tech4Startup: Enabling Rural Entrepreneurship through Digital Tools in Maharashtra
- **Owner:** Rangesh Gupta, Roll No. 53, SE CPMN A
- **Module owner:** Rural Business Assistant

## Locked main problem statement

> There is no unified digital platform tailored to rural entrepreneurs that combines sales, payments, logistics, and customer support. This fragmentation restricts market access and sustainable scaling of rural businesses.

This wording is locked. Do not replace it with a narrower scheme-only or language-only problem statement.

## Locked assigned sub-problem statement

> Rural entrepreneurs do not know which government schemes, marketplaces, or digital tools fit their business.

This wording is locked. Language barriers, document complexity, trust, low bandwidth, and hallucination prevention are implementation requirements supporting this sub-problem; they are not replacements for it.

## Locked solution

> VyaparMarg is a multilingual AI-powered Rural Business Assistant that helps rural entrepreneurs identify suitable government schemes, marketplaces, and digital tools based on their business profile, then guides them through eligibility, required documents, official portals, and the next practical action.

The solution is a hybrid product:

1. A real Android mobile application for discovery, conversation, recommendations, profiles, documents, and guidance.
2. A browser extension for page-aware assistance on supported government and business portals.
3. A shared FastAPI, Supabase, recommendation, and AI backend.

The mobile app answers **“What should I do?”** The extension helps answer **“How do I do it on this page?”**

## Team ownership

### Student 1 — Rangesh Gupta: Rural Business Assistant

Recommends government schemes, marketplaces, and digital tools in Marathi/Hindi/Hinglish, with voice support and guided next actions.

### Student 2 — Shivam: Smart Rural Logistics Planner

Compares transport options, predicts delivery cost, and groups nearby orders. VyaparMarg may integrate with this module later; it must not silently absorb or replace it.

### Student 3 — Shruti: Rural Business Growth Dashboard

Connects sales, payments, and inventory data and provides business suggestions. VyaparMarg may integrate with this module later; it must not silently absorb or replace it.

## Hybrid scope boundary

VyaparMarg owns the assistant, opportunity catalog, recommendation engine, profile, eligibility/document guidance, official-portal navigation, mobile app, and browser extension.

The project does **not** claim that this module independently implements a complete marketplace, payment gateway, logistics planner, or growth dashboard. Those are platform-level capabilities connected through the team’s shared architecture.

## Development approach

Each phase must deliver two real, testable components:

1. Foundation and authenticated profile flow.
2. Scheme catalog and recommendations.
3. Assistant conversation and saved plans.
4. Eligibility explanation and document checklist.
5. Maharashtra portal guidance: MahaDBT, Aaple Sarkar, and MahaOnline where supported.
6. Marketplace and digital-tool recommendations.
7. Native Android app and native API/authentication flow.
8. Marathi/Hindi/Hinglish assistant and voice interaction.
9. Browser extension shell and page-aware portal assistance.
10. Safe field explanation, validation, and user-confirmed autofill.
11. Integration contracts with the logistics and dashboard modules.
12. End-to-end demonstration, testing, and deployment.

No phase may be described as complete unless its components run and have evidence such as a passing test, working screen, API result, or recorded demonstration.

## Data-source policy

- Official Maharashtra portals are the operational source of truth for links, instructions, and application steps.
- MyScheme and the Hugging Face government-scheme dataset may support the knowledge base, but records must be verified before being presented as authoritative.
- data.gov.in may provide government datasets and contextual information.
- Kaggle datasets are for experimentation, benchmarking, and testing unless independently verified.

## Non-negotiable safety boundaries

- Never claim an application is approved or eligibility is guaranteed.
- Keep deterministic eligibility checks separate from generative explanations.
- Require user review before sensitive autofill or submission.
- Do not read, store, or submit passwords, OTPs, CAPTCHA answers, or private payment credentials.
- Use official links and show source/update information for recommendations.

## Instructions for AI tools and IDEs

Before proposing changes, read this file. Preserve the exact Main PS, assigned Sub-PS, product name, hybrid mobile-plus-extension approach, and team boundaries. You may improve code, UI, datasets, testing, phase ordering, and implementation maturity, but you must not silently redefine the project.

