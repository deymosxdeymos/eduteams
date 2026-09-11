# Upstream provenance

- Source: https://github.com/dmmulroy/anti-slop
- Revision: `95a56e5d24fb3d849673c2d51eb0908b8bd2d33b`
- Copied from: `skills/install-anti-slop/assets/anti-slop/`
- Installed at: `tools/oxlint/anti-slop/`
- Oxlint plugin API: `oxlint@1.82.0` and `@oxlint/plugins@1.82.0`

## Intentional deviations

- The Effect plugin is vendored but not registered because EduTeams does not directly depend on Effect.
- A local `package.json` declares the vendored TypeScript plugin as ESM without changing the application's module type.
- Oxfmt excludes the vendored directory so local formatting does not rewrite the upstream snapshot.
- The Next.js TypeScript project excludes the vendored linter implementation from application type checking.
