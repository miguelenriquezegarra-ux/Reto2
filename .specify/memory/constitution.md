<!--
Sync Impact Report (temporary review material; remove before committing)
Version change: 1.0.0 -> 2.0.0.
Rationale: incompatible redefinition of blanket acceptance gates into change,
feature, and release gates; clarified external-effect consistency guarantees.
Modified principles: I (modular tool entry point), II (controlled reproduction),
III (external effects), V (live-model release verification), VII (operational limits).
Updated sections: Mandatory Technical Constraints; Development Workflow and Quality
Gates; Governance. Principle titles unchanged.
Added sections: none. Removed sections: none. Follow-up TODOs: none.
Approval: project owner explicitly approved the complete amendment proposal in chat
on 2026-10-18. Permanent approval evidence is recorded under Governance below.
Migration: future specs and plans must define critical operations, operational limits,
external-effect guarantees, and release verification; no feature artifacts currently
exist to migrate. Templates and commands remain unchanged and read this constitution
at runtime; generic template instructions do not waive constitutional requirements.
-->
# Conversational AI Application Constitution

## Core Principles

### I. Modular Architecture and Explicit Interfaces

Business logic MUST be separated from AI orchestration, external integrations,
infrastructure, and presentation. Persistence MUST be isolated behind well-defined
interfaces. The backend MUST expose explicit application-operation contracts. The
frontend MUST be independently maintainable and communicate through those contracts.
The system prompt MUST reside in `agent/prompt.md`. Typed agent tools MUST be
exposed through the required entry point `src/tools/contratos.ts`, using Zod schemas.
This file MAY delegate implementation to separate modules. Required artifact paths
MUST remain unchanged; modularization MUST preserve their assigned responsibilities.
Architectural decisions MUST prioritize simplicity, maintainability, testability,
and clear responsibilities. Additional components MUST have a documented requirement
and rationale. These boundaries allow independent verification of application rules.

### II. Deterministic Business Authority and Reliable AI

Core business rules MUST use deterministic application logic. An LLM MUST NOT be the
sole authority for business validation, data integrity, or state transitions.
AI-generated structured outputs MUST pass schema and domain validation before use.
Business tools MUST support direct execution without an LLM; AI orchestration MUST
remain separate from tool execution. Significant operations MUST retain safe context
sufficient to reproduce deterministic behavior with controlled inputs and dependencies.
Production traces MUST support operational investigation; they do not promise exact
replay of external effects or identical model responses.

### III. Data Integrity and Boundary Validation

External inputs MUST be validated at system boundaries using Zod, including requests,
integration payloads, and structured model outputs. Domain invariants MUST be enforced
consistently across direct tools and conversational execution. Duplicate operations
and conflicting transitions MUST be prevented or handled through explicit, documented
behavior. Errors, conflicting information, and incomplete data MUST produce predictable
outcomes. Local domain updates MUST preserve declared invariants on failure.
For operations involving external effects, the plan MUST document consistency
guarantees, duplicate handling, partial-failure behavior, and recovery. Atomicity
across independent external systems is not universally required. Persistence
interfaces MUST preserve the declared guarantees and expose failures explicitly.

### IV. Security and Human Oversight

Access MUST follow least privilege and secure defaults. Secrets MUST be externalized
and MUST NOT be hardcoded or committed. Sensitive information MUST be protected in
application state, logs, and external communications. Diagnostics MUST exclude secrets
and redact sensitive values. Untrusted inputs, including AI-generated content, MUST
NOT bypass validation or authorization. Authorization MUST be enforced at application
operation boundaries regardless of caller. Consequential operations MUST support human
confirmation where required by the specification, and execution MUST enforce that
confirmation before applying the operation.

### V. Deterministic Testing and Acceptance Evidence

Automated tests MUST cover critical business logic, validation, domain invariants,
duplicate handling, conflicting transitions, and applicable security and confirmation
rules. Tests MUST use controlled inputs and dependencies for deterministic,
reproducible results. Domain logic, integrations, and AI orchestration MUST be
independently verifiable. Orchestration tests MUST use controlled model responses.
An executable `demo.ts` MUST verify relevant business tools through direct execution
without invoking or consuming an LLM and MUST exit unsuccessfully on verification
failure. Implementation MUST be verified against explicit acceptance criteria.
Every release MUST additionally pass a brief integration check using a real model,
with a bounded budget and explicit pass/fail criteria defined in the plan. This
check MUST verify actual credentials, configuration, connectivity, and a representative
agent interaction. It is separate from the reproducible automated test suite.
Broader live-model quality evaluations MAY supplement these checks.

### VI. Safe Observability and Traceability

Significant operations, tool executions, and state changes MUST produce diagnostics
that identify the operation, outcome, and a correlation identifier. State-change
traces MUST contain safe references connecting execution to resulting state. Errors
MUST provide actionable information without exposing sensitive data. Observability
SHOULD use consistent structured events to support debugging, testing, and operational
analysis; alternatives MUST document how those uses remain supported. Traceability
MUST comply with the security and privacy requirements above.

### VII. Reproducible Execution and Public Deployment

Development, installation, builds, and verification MUST be reproducible through
documented commands, declared runtime requirements, and a committed dependency lockfile.
Environment-specific configuration MUST be externalized, with required variables and
safe setup instructions documented. The application MUST run locally and support
deployment to a publicly accessible URL. The deployed environment MUST provide a
functional frontend, backend, and complete conversational AI agent. Deployment
procedures MUST document configuration, verification, and recovery steps.
The specification MUST define observable behavior when the model is unavailable or
usage limits are reached. Specifications and plans MUST explicitly establish bounded
model consumption and timeouts: product limits and outcomes belong in the specification;
technical values, enforcement, and verification mechanisms belong in the plan.

### VIII. Documentation and Engineering Accountability

The project MUST include `SOLUCION.md` covering architecture, agent lifecycle, design
decisions, significant trade-offs, model cost analysis, and application governance.
Cost analysis MUST state model and usage assumptions and the basis of estimates.
Technical documentation MUST match implemented behavior and explain how to run, test,
verify, and deploy the application. Significant technical decisions MUST document their
rationale and consequences. Behavior and contract changes MUST include corresponding
documentation updates when existing guidance would become inaccurate.

## Mandatory Technical Constraints

- Frontend and backend application code MUST be implemented in TypeScript. The backend
  and build tooling MUST run on Node.js 20 or newer. The frontend MAY execute in a web
  browser. Alternative core application languages or server runtimes MUST NOT be
  introduced; browser execution of the frontend is explicitly permitted.
- Zod MUST provide typed tool schemas and runtime input validation. Compile-time
  types MUST NOT substitute for validation of untrusted runtime values.
- Delivery MUST include a complete, functional conversational AI agent and frontend
  and backend that operate together locally and in the publicly accessible environment.
- `agent/prompt.md`, `src/tools/contratos.ts`, `demo.ts`, and `SOLUCION.md` are mandatory
  artifacts with the responsibilities established in the principles above.
- This constitution selects no additional frameworks, databases, cloud providers, or
  infrastructure. Later plans MUST justify any selection against explicit requirements
  and these principles.

## Development Workflow and Quality Gates

1. **Specification:** Specifications MUST define observable acceptance criteria,
   relevant invariants, error behavior, security boundaries, and any consequential
   operations requiring confirmation. They MUST preserve mandatory constraints.
   They MUST identify critical business logic, significant operations, and required
   agent capabilities through explicit criteria and an operation/capability inventory.
   These definitions MUST determine testing and traceability scope; the plan MUST
   map them to concrete verification evidence.
2. **Clarification:** Ambiguities affecting contracts, integrity, authorization,
   confirmation, or acceptance MUST be resolved before dependent implementation.
   Nonblocking assumptions MUST be explicit and traceable.
3. **Planning:** Each plan MUST include a Constitution Check mapping applicable
   requirements to architecture, artifacts, and verification evidence. Technology
   choices and significant trade-offs MUST be justified. Mandatory conflicts MUST
   block dependent implementation until corrected or formally amended.
4. **Task generation:** Tasks MUST trace to requirements and include implementation,
   testing, documentation, observability, and delivery work needed for acceptance.
   Dependencies MUST support deterministic tool execution before dependent AI wiring.
5. **Implementation:** Changes MUST preserve boundaries and enforce validation,
   authorization, invariants, and confirmation in application code. Implementers MUST
   keep contracts, prompts, tests, and documentation consistent.
6. **Testing and review:** Each change MUST pass constitutional review and the checks
   affected by its scope. Review evidence MUST justify every nonapplicable check;
   scope-based nonapplicability MUST NOT waive a requirement that applies to the change.
   Feature acceptance MUST demonstrate its acceptance criteria and pertinent automated
   tests. Every release MUST pass TypeScript type checking, a reproducible build,
   the complete automated test suite, successful execution of `demo.ts` without an
   LLM, public deployment verification, and the bounded real-model check in Principle V.
   Review evidence MUST record findings and their resolution. Documentation-only
   changes and partial increments do not independently require a full release cycle.
7. **Change approval:** Changes to public contracts, business invariants, security,
   persistence behavior, model/tool behavior, or deployment architecture MUST document
   impact, rationale, verification, and migration or recovery needs. A designated
   project owner MUST explicitly approve significant changes in recorded review
   evidence before merge or release. Routine changes MUST receive a recorded compliance
   review as well.
8. **Deployment:** Release evidence MUST identify the source revision, verification
   results, and deployed URL. Deployment verification MUST confirm the frontend,
   backend, and conversational agent function together and documented configuration
   is sufficient. The real-model check MUST exercise the deployed environment.
   Release approval MUST confirm all release gates pass and verification costs remain
   within the planned budget.

## Governance

This constitution takes precedence over conflicting specifications, plans, tasks,
implementation choices, and local practices. MUST denotes a mandatory requirement;
SHOULD denotes a recommendation whose departure requires a documented rationale;
MAY denotes a permitted option. Later Spec Kit phases MUST NOT silently override
mandatory technical or architectural constraints.
Generic template statements that tests are optional MUST NOT override required
constitutional tests. A plan's Complexity Tracking records rationale; it MUST NOT
authorize a constitutional violation without an approved amendment. Constitution
Checks MUST run before planning research and again after design, as required by the
local plan template.

Compliance MUST be evaluated during planning, implementation, review, and deployment
through the gates above. Review records MUST identify applicable requirements,
evidence checked, and deviations. A proposed deviation MUST document its rationale,
impact, alternatives, and affected artifacts. Departures from MUST or MUST NOT require
an approved constitutional amendment before dependent work proceeds; documentation
alone does not authorize an exception.

Amendments MUST document proposed wording, rationale, compatibility impact, affected
artifacts, and migration work. The project owner MUST approve amendments in recorded
review evidence and MAY approve their own changes. Approvals for significant changes
and amendments MUST be recorded in a pull request or a version-controlled document,
identifying the approved scope and decision. An approved amendment MUST update the version and
last-amended date and identify follow-up work. Affected artifacts MUST be reconciled
before acceptance. Temporary Sync Impact Reports MUST be removed before the amended
constitution is committed.

Versions follow MAJOR.MINOR.PATCH: MAJOR for incompatible principle removals or
redefinitions; MINOR for new principles, sections, or materially expanded guidance;
PATCH for clarifications and other nonsemantic corrections. Initial adoption is
1.0.0. The ratification date remains the original adoption date. Governance dates
MUST use ISO 8601 calendar dates.

Amendment approval record: On 2026-10-18, the project owner explicitly approved version
2.0.0 in this conversation with "Apruebo", covering runtime scope, bounded real-model
release verification, modular entry points, proportional quality gates, owner
self-approval with recorded evidence, explicit critical-operation criteria,
controlled reproducibility and external-effect recovery, operational limits, and
template precedence. This version-controlled record preserves that approval.
The gate and consistency redefinitions are incompatible with the previous blanket
interpretation; the original ratification date is retained. Future feature artifacts
MUST apply the amended gates and document the newly explicit decisions; no existing
feature specifications or plans require migration at the time of this amendment.

**Version**: 2.0.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
