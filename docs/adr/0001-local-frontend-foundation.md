# ADR 0001 — Separate local frontend foundation

Date: 2026-09-28
Status: Implemented within the project owner's authorized local setup scope

## Context and decision

The owner requested a new local frontend repository and explicitly prohibited
design work during setup. Create an independent sibling repository named
`atoma-storefront-v3`, on `codex/foundation`, without cloning the wider monorepo
or altering its working tree. The first page is only unstyled boot text.

Use Next.js App Router and strict TypeScript to retain compatibility with the
existing public presentation boundary. This is a source-code separation, not
approval for another operational service or mutable data authority. There is
no public deployment, remote, database, CMS, API, authentication, analytics, or
commerce adapter in this foundation.

Preserve JMM's technical charter and accepted ADR-0015/0016/0018 boundaries:

- Core owns approved offers/prices and ledger-backed inventory availability.
- Shopify executes reconciled channel offers, cart, hosted checkout, payment,
  and external order state. The storefront does not handle payment itself.
- Future integration uses reviewed public projections and server-only adapters.
  No browser access to private operational rows, supplier costs, or raw payloads.
- Keep one canonical operational authority, separate buyer/internal sessions,
  publication/consent controls, integer minor-unit money, and integer grams.
- Existing pack/bundle rules and wholesale scope are not changed by examples in
  brand notes. Database and production changes remain outside this request.

These decisions are inherited from the sibling JMM repository's
`docs/TECHNICAL_CHARTER.md` and `docs/adr/0015-*`, `0016-*`, and `0018-*`.
The task creates no new integration contract and does not copy historical UI.

## Dependency choices

All direct versions are exact in `package.json`, with transitive resolution in
`pnpm-lock.yaml`. Node 24.20.0 and pnpm 11.24.0 match the existing workspace.

| Dependency                                  | Need and consequence                                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next 16.3.6                                 | App Router and future server-rendered storefront. Uses a current 16.3 patch; the prior repo is on 16.3.3. No prior repo upgrade is performed.                                   |
| React / React DOM 19.2.8                    | Required rendering runtime, retained from the existing frontend.                                                                                                                |
| TypeScript 5.9.3 and matching type packages | Strict compilation and editor support; no browser runtime dependency.                                                                                                           |
| ESLint 9.39.5 and eslint-config-next 16.3.6 | Explicit Next/React/TypeScript linting. Build alone does not run lint. ESLint 9 matches the existing workspace and the bundled React/import/accessibility plugins' peer ranges. |
| Prettier 3.9.6                              | Consistent formatting for code and notes; development only.                                                                                                                     |

Use the supported Webpack CLI option to keep bundler behavior aligned with the
existing local setup. No animation, 3D, UI-kit, font, Tailwind, testing-framework,
or commerce dependency is introduced without a task that needs it.

ESLint 9 is marked end-of-life upstream. The current Next config's React,
import, and accessibility plugins do not accept ESLint 10 in their declared
peer ranges. Retain the compatible existing 9.39.5 baseline instead of
overriding peers or disabling rules. Revisit the tooling set when these plugins
support ESLint 10; this is a development-tool limitation, not runtime behavior.

Use pnpm's YAML settings for exact saves, engine enforcement, and explicit
install-script policy. No dependency install scripts are required for the
foundation; native optional dependencies use prebuilt packages. Revisit that
policy with evidence if a future feature requires a build script.

## Validation and consequences

`pnpm validate` runs formatting, ESLint with zero warnings, route type generation
and strict TypeScript, then a local production build. A separate local HTTP
smoke check verifies the boot page and missing route. No artificial unit tests
are added for the one-line static scaffold; add behavior coverage with future
behavior. No checks or tests were removed from either existing repository.

The placeholder is marked noindex. System browser defaults are used: no color,
font, layout, logo, component, or motion system is selected by this setup.
Deployment and real commerce validation remain future work.

## Official references checked 2026-09-28

- [Next.js installation and CLI setup](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js explicit ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Next CLI route type generation and Webpack options](https://nextjs.org/docs/app/api-reference/cli/next)
- [pnpm workspace settings](https://pnpm.io/settings)
- [ESLint version support](https://eslint.org/version-support/)

Exact package versions and compatibility are also checked against package
registry metadata and the installed packages during setup.
