# Implementation Plan: Automatización de Conciliación de Comprobantes (Nequi y Bancolombia)

**Branch**: `001-payment-reconciliation` | **Date**: 2026-06-28 | **Spec**: [spec.md](file:///Users/avyla/Documents/Payo/specs/001-payment-reconciliation/spec.md)

**Input**: Feature specification from `/specs/001-payment-reconciliation/spec.md`

## Summary

Implementación de un sistema SaaS multi-inquilino B2B para la conciliación automatizada de comprobantes de pago digitales de Nequi y Bancolombia en comercios físicos. El sistema incluye una arquitectura decoupled con frontend Next.js (App Router, React, Tailwind CSS) y backend Node.js (Express, TypeScript), persistencia en PostgreSQL con transacciones ACID y almacenamiento en Google Cloud Storage (GCS). La ingesta se realiza vía Panel Web o Webhook de WhatsApp Cloud API, procesando imágenes con Google Cloud Vision OCR y parsers Regex especializados.

## Technical Context

**Language/Version**: TypeScript 5.x (Estricto en Frontend y Backend; prohibido uso de `any`), Node.js v18+.  
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, Express, Prisma ORM, `@google-cloud/vision`, `@google-cloud/storage`, `axios`.  
**Storage**: PostgreSQL (Base de datos relacional multi-tenant), Google Cloud Storage (GCS para imágenes).  
**Testing**: Vitest / Jest (Pruebas unitarias obligatorias para Parsers Regex), Supertest (Pruebas de endpoints).  
**Target Platform**: Servidores Linux en la nube (Backend), Navegadores Web Modernos (Frontend Dashboard & Ingesta).  
**Project Type**: Web Application Multi-Tenant (Frontend Web + Backend REST API / Webhooks).  
**Performance Goals**: Procesamiento completo de comprobante y respuesta en < 4 segundos; recepción e ingesta de webhook en < 2 segundos. Renderizado inicial rápido (SSR) para métricas de Dashboard.  
**Constraints**: Aislamiento estricto por `id_comercio`; degradación grácil ante fallos de OCR; rate limiting estricto por IP/Inquilino; paginación Server-Side (SSR) para el Dashboard. Uso de `"use client"` restringido solo a componentes de alta interactividad.  
**Scale/Scope**: Módulo 1 (Conciliación Nequi/Bancolombia, Ingesta Web/WhatsApp, Dashboard B2B Frontend).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Tipado Estricto (TypeScript)**: Todo el código en Frontend y Backend está definido en TypeScript estricto. Uso de `any` prohibido. (PASSED)
- [x] **II. Aislamiento Multi-Inquilino y ACID**: Todas las consultas filtran por `id_comercio`. Mutaciones usan transacciones ACID PostgreSQL. (PASSED)
- [x] **III. Resiliencia y Degradación Grácil**: Manejo de excepciones en GCS, Vision API y WhatsApp; fallos de OCR asignan estado "Subido sin verificar" para revisión manual. (PASSED)
- [x] **IV. Consistencia Visual y Eficiencia**: Interfaz construida con Next.js y Tailwind CSS optimizada para scannability rápida de cajeros/admins. (PASSED)
- [x] **V. Disciplina de Pruebas en Parsers**: Suite de pruebas unitarias obligatoria para los parsers de comprobantes Nequi y Bancolombia. (PASSED)

## Project Structure

### Documentation (this feature)

```text
specs/001-payment-reconciliation/
├── plan.md              # Este archivo (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── api-routes.md
│   ├── whatsapp-webhook.md
│   └── parser-contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/          # Variables de entorno y GCP clients
│   ├── controllers/     # Handlers de transacciones, dashboard y webhooks
│   ├── middlewares/     # Auth JWT, validación multi-tenant (id_comercio), webhook signature
│   ├── models/          # Entidades y queries PostgreSQL / Prisma
│   ├── parsers/         # Parsers regex para Nequi y Bancolombia (TypeScript)
│   ├── services/        # Lógica de negocio (GCS, Vision API, OCR pipeline)
│   └── app.ts
└── tests/
    ├── integration/     # Pruebas de API endpoints
    └── unit/            # Pruebas unitarias de parsers de comprobantes

frontend/
├── src/
│   ├── app/             # Next.js App Router (Dashboard, Upload, Auth)
│   ├── components/      # Componentes UI reutilizables con Tailwind CSS
│   ├── hooks/           # Custom hooks para peticiones a API
│   ├── services/        # Cliente API HTTP
│   └── types/           # Definiciones TypeScript compartidas
└── tests/
```

**Structure Decision**: Se selecciona la opción de Aplicación Web Decoupled con directorios independientes `backend/` y `frontend/` en la raíz del repositorio, garantizando separación clara de responsabilidades y modularidad multi-tenant.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because                             |
| --------- | ---------- | ---------------------------------------------------------------- |
| _Ninguna_ | N/A        | Todas las pautas constitucionales se cumplen de manera estricta. |
