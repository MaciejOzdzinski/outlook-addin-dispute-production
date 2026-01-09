# AI Agent Rules and Project Context

## Project Context

This project is a **Microsoft Outlook Add-in** designed to work in:

- Outlook Desktop
- Outlook on the Web (OWA)

The application is built using:

- React
- TypeScript
- Vite
- pnpm
- **Fluent UI v9** for the visual interface

The add-in integrates with Office.js and follows Microsoft Outlook add-in constraints.

---

## General Rules (MANDATORY)

- NEVER commit or push directly to `main`
- All changes must be done on a feature branch
- One task = one branch
- No changes without clear user request
- Always prefer minimal, incremental changes

---

## Scope Rules

- Modify ONLY files explicitly requested by the user
- If additional files are required:

  - STOP
  - List the files
  - Ask for confirmation before proceeding

- NO drive-by refactors
- NO formatting-only changes unless explicitly requested
- NO architectural changes without discussion

---

## Forbidden Changes (unless explicitly requested)

### Configuration & Tooling

- `pnpm-lock.yaml`
- `package.json` dependencies
- `tsconfig*.json`
- ESLint / Prettier configuration
- Vite / bundler configuration
- CI/CD files
- Husky / git hooks

### Outlook / Office

- Office.js integration logic
- Outlook add-in manifest files (`manifest.xml`)
- Authentication, permissions, SSO, or Graph-related logic

---

## UI & Frontend Rules (Fluent UI v9)

- Use **Fluent UI v9 components ONLY**
- Do NOT mix UI frameworks
- Follow Fluent UI v9 design tokens and theming
- Prefer composition over custom styling
- Avoid custom CSS unless absolutely necessary
- Do NOT introduce inline styles unless requested

If adding UI components:

- Follow existing layout and spacing conventions
- Use Fluent UI v9 components for:
  - Buttons
  - Inputs
  - Dialogs
  - Panels
  - Typography

---

## TypeScript Rules

- Keep TypeScript strict
- Do NOT introduce `any`
- Use explicit types and interfaces
- Preserve existing public APIs and props contracts
- Prefer type reuse over duplication

---

## Testing & Quality Rules

Before finalizing changes:

- Ensure code passes:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

If tests are missing:

- Do NOT add test infrastructure unless requested
- Add minimal tests only when explicitly asked

---

## Outlook Add-in Constraints

- Assume code runs inside Outlook sandbox
- Avoid browser-only APIs unless confirmed compatible
- Be careful with async initialization and Office.onReady
- Do NOT assume full browser capabilities
- Avoid heavy runtime logic in initialization paths

---

## AI Output Requirements

For every task:

1. Provide a short **PLAN**
2. List **files to be changed**
3. Apply changes ONLY to those files
4. Summarize what was done
5. Mention how changes were validated

---

## Decision Safety Rule (CRITICAL)

If a decision could:

- Affect architecture
- Affect security
- Affect Outlook integration
- Affect build or deployment

➡️ STOP and ask for confirmation.

---

## Final Principle

> The AI agent assists development but does NOT make autonomous architectural or structural decisions.

Human approval is always required before merging changes into `main`.
