<!--
Sync Impact Report:
- Version change: [CONSTITUTION_VERSION] -> 1.0.0
- Added Principles:
  - I. Tipado Estricto (Strict Full-Stack TypeScript)
  - II. Aislamiento Multi-Inquilino y ACID (Multi-Tenant Isolation & ACID Transactions)
  - III. Resiliencia en Manejo de Errores y Degradación Grácil (Error Handling & Graceful Degradation)
  - IV. Interfaz Ejecutiva, Minimalista y Mobile-First (Executive Minimalist & Mobile-First UI)
  - V. Disciplina de Pruebas en Parsers y Lógica Crítica (Parser & Core Logic Testing Discipline)
- Added Sections:
  - Technical Stack & Security Standards
  - Development & Integration Workflow
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ validated)
  - .specify/templates/spec-template.md (✅ validated)
  - .specify/templates/tasks-template.md (✅ validated)
- Follow-up TODOs: None
-->

# Payo Constitution

## Core Principles

### I. Tipado Estricto (Strict Full-Stack TypeScript)
TypeScript MUST be used across the entire stack, including both Frontend and Backend environments.
The use of the `any` type is strictly prohibited under all circumstances. Explicit type definitions, strict null checks, and comprehensive interface declarations MUST be enforced across all models, services, components, and API boundaries.
*Rationale*: Strong typing prevents dynamic runtime errors, ensures self-documenting code contracts, and guarantees reliable type safety between server and client layers.

### II. Aislamiento Multi-Inquilino y ACID (Multi-Tenant Isolation & ACID Transactions)
Payo is a B2B multi-tenant SaaS. Multi-tenant data separation using the tenant identifier (`id_comercio`) is sacred and MUST be explicitly enforced in every database query, API endpoint handler, and caching layer. Data operations modifying state MUST strictly comply with ACID transactional properties (Atomicity, Consistency, Isolation, Durability) to guarantee zero cross-tenant data leaks and prevent data loss or corruption.
*Rationale*: Tenant isolation and transactional integrity are non-negotiable pillars of trust, privacy, and security in enterprise multi-tenant software.

### III. Resiliencia en Manejo de Errores y Degradación Grácil (Error Handling & Graceful Degradation)
The system MUST implement robust error handling, specifically around third-party service integrations such as Google Cloud Vision OCR and WhatsApp Cloud API. Failures, timeouts, or unexpected responses from third-party services MUST NOT crash the system or block user workflows. If an OCR extraction fails or returns low-confidence data, the system MUST gracefully degrade by enabling manual review and correction by operators.
*Rationale*: External services are inherently unpredictable; core business operations (such as point-of-sale and payment verification) must remain resilient and operable regardless of third-party outages.

### IV. Interfaz Ejecutiva, Minimalista y Mobile-First (Executive Minimalist & Mobile-First UI)
The user interface MUST project financial trust, security, and seriousness. Pastel colors and informal styling are strictly prohibited. The design system MUST rely on an executive, austere palette (e.g., Navy Blues, Slate/Dark Grays, Pure White). The architecture MUST be strictly Mobile-First, ensuring flawless responsiveness and usability on smartphones and tablets. Menus and layout structures must be reorganized for mobile ergonomics (e.g., bottom navigation bars or accessible hamburger menus). High-value widgets like the "Total Money" display must be minimalist, prioritizing data clarity over bloated aesthetics.
*Rationale*: A financial/accounting SaaS must instill absolute confidence and professionalism. Since users will predominantly operate via mobile devices, responsive ergonomics are critical for daily business operations.

### V. Disciplina de Pruebas en Parsers y Lógica Crítica (Parser & Core Logic Testing Discipline)
Automated unit tests are MANDATORY for all financial receipt parsing logic (Parser de Comprobantes Bancarios). Tests MUST verify accurate extraction and validation of essential transaction fields (amount, reference number, bank identifier, timestamp). Core domain calculations and critical business rules MUST achieve near-total test coverage.
*Rationale*: Automated financial reconciliation requires absolute precision. Flaws in parsing logic lead to financial discrepancies, making rigorous test suites indispensable.

## Technical Stack & Security Standards

The technology stack for Payo is unified around end-to-end TypeScript. Security, scalability, and data loss prevention MUST guide all architectural decisions. Sensitive tenant credentials, OAuth tokens, and API keys (such as Google Cloud Vision and WhatsApp Cloud API credentials) MUST be securely stored in environment variables or secret managers and NEVER hardcoded in source code.

## Development & Integration Workflow

All new features and modifications MUST pass automated quality gates, including strict TypeScript compilation (`tsc --noEmit`), linting rules, and unit test suites. Integrations with external APIs MUST implement mock adapters for isolated testing and local sandbox verification before deployment to staging environments.

## Governance

This Constitution supersedes all informal team agreements and development practices. Any amendment to these principles requires formal documentation, a clear migration plan for affected systems, and explicit approval from the lead engineering team. Code reviews MUST verify adherence to all principles detailed in this document.

**Version**: 1.0.0 | **Ratified**: 2026-06-28 | **Last Amended**: 2026-06-28
