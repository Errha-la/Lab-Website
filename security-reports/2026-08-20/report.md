# Security Review: Lab-Website

## Scope

Complete source-backed static security audit of the whole Lab-Website repository at revision 30aea51167ffd1f680f4fb6eacbced677131a226.

- Scan mode: repository
- Target kind: git_revision
- Target ID: target_sha256_f6030475b2d5cd5d5b2a532a7aaecf0f404c975ea497dc499a10295895faffc3
- Revision: 30aea51167ffd1f680f4fb6eacbced677131a226
- Inventory strategy: repository
- Included paths: .
- Excluded paths: none
- Runtime or test status: Astro default static output; no server adapter, API routes, authentication, database, uploads, or server-side state found.
- Artifacts reviewed: 62 tracked repository files, Astro pages, layouts, components, client scripts, content schemas, and Markdown collections, package.json and package-lock.json, astro.config.mjs, tsconfig.json, .gitignore, and public assets
- Scan context: Public static Astro laboratory website. The authorized scope was the entire current Git revision.

Limitations and exclusions:
- No deployment or hosting configuration exists in the repository, so effective HTTP response headers could not be verified.
- Dependency advisory databases were not queried; version-specific CVE exposure was not assessed.
- No runtime application execution or production deployment was available; validation was source-backed and offline.

### Scan Summary

| Field | Value |
| --- | --- |
| Reportable findings | 0 |
| Severity mix | none |
| Confidence mix | none |
| Coverage | complete |
| Validation mode | Offline static source review with one independent complete baseline audit, two focused investigations, repository-wide searches, and parent validation. |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

The application is a build-time generated public Astro site. Remote visitors can choose paths and query strings and interact with client-side DOM code, but no server-side privileged operation exists. Security-sensitive boundaries are checked-in content entering raw script/DOM contexts, npm dependencies executing during builds, and visitor navigation or embedding of third-party origins.

### Assets

- Integrity of generated pages and same-origin JavaScript execution for visitors
- Confidentiality and integrity of the build environment
- Integrity and provenance of generated deployment artifacts
- Visitor navigation integrity and privacy
- Published laboratory contact and research metadata

### Trust Boundaries

- Remote visitor URL and query input to static browser-side scripts
- Version-controlled Markdown/content fields and template code entering the Astro build
- npm registry packages and lifecycle scripts entering the build environment
- The static site origin embedding Google Maps and linking to external HTTPS origins

### Attacker Capabilities

- A remote unauthenticated visitor can select paths, supply query parameters, click links, and interact with client-side controls.
- A compromised external destination or embed can control its own cross-origin response but is constrained by browser same-origin protections.
- A dependency supply-chain adversary may execute code during installation only if an integrity-pinned package itself is compromised.
- Repository content modifiers are assumed to have authority comparable to template-code modifiers because no lower-privilege content publication path is established.

### Security Objectives

- Prevent visitor-controlled values from reaching HTML, URL navigation, or script execution without effective validation or encoding.
- Prevent checked-in content from unexpectedly becoming executable across template and serialization contexts.
- Keep external navigation and embeds isolated and free of opener-based privilege transfer.
- Keep secrets and credentials out of tracked source and generated public artifacts.
- Keep dependency sources deterministic and integrity-pinned.

### Assumptions

- Deployment serves the generated static artifact without unpublished server endpoints.
- Only repository-authorized editors can publish src/content changes; no external CMS or automated untrusted content feed is active.
- Public names, publications, email address, and campus address are intended for publication.
- Builds consume the committed lockfile using a frozen-lock workflow or equivalent.

## Findings

### No findings

No reportable findings survived the canonical discovery, validation, and reportability gates.

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Browser URL input and client-side DOM interactions | DOM injection and client-side input handling | No issue found | The publications tag query is accepted only after an exact match against statically rendered allowlisted chips and reaches no HTML or execution sink. |
| Build-time content serialization and rendering | Stored XSS and unsafe URL schemes | Rejected | Raw JSON script serialization and generic URL schemas are defense-in-depth gaps, but current content is benign and no lower-trust content publisher or runtime content source is established. |
| Google Maps embed and external navigation | Cross-origin isolation, opener abuse, and navigation safety | No issue found | The embed origin is fixed and query-encoded; every target=_blank link uses noopener noreferrer; all populated content URLs are HTTPS. |
| npm build tooling and dependency provenance | Build-time supply-chain execution | No issue found | All 513 resolved lockfile artifacts use HTTPS registry.npmjs.org sources with integrity hashes; project scripts are standard Astro commands. Version-specific advisory exposure was not assessed offline. |
| Tracked secrets and security-relevant configuration | Credential exposure and unsafe deployment configuration | No issue found | No tracked credential, private-key, token, or environment file pattern was found. Effective deployment headers cannot be established because hosting configuration is absent. |
| Server endpoints and privileged operations | Authentication, authorization, injection, upload, filesystem, database, and command execution | Not applicable | No server adapter, API route, authentication flow, database, upload, filesystem access, command execution, or runtime server state exists in the reviewed source. |

## Open Questions And Follow Up

- What HTTP security headers and platform controls are applied by the production host?
  - Follow-up prompt: Inspect the actual hosting configuration or response headers for CSP, frame-ancestors, HSTS, Referrer-Policy, Permissions-Policy, and nosniff.
- Do the locked dependency versions have current public security advisories?
  - Follow-up prompt: Run an authorized current advisory scan against package-lock.json in an environment with a trusted vulnerability database.
- Does any out-of-repository workflow grant content-only publication authority?
  - Follow-up prompt: Confirm GitHub roles, branch protections, deployment workflows, and any CMS or automated content imports; if present, re-evaluate raw JSON script serialization as stored XSS.
