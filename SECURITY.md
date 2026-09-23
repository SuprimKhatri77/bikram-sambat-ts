# Security

`bikram-sambat-ts` is a small, offline calendar conversion library. It has no
runtime dependencies, makes no network requests, and doesn't read files,
environment variables or any other system state, so its attack surface is
minimal.

## Supported versions

Only the latest published version gets fixes. While the package is below
1.0.0, a fix ships as a new patch or minor release rather than being backported.

## Reporting a vulnerability

If you believe you've found a security issue, please report it privately via
[GitHub's private vulnerability reporting](https://github.com/SuprimKhatri77/bikram-sambat-ts/security/advisories/new)
rather than opening a public issue, so it can be assessed and fixed before the
details are public.

Wrong calendar data (a BS month with the wrong number of days) is a
correctness bug, not a security issue. Please open a normal issue for it, with
a source, as described in [CONTRIBUTING.md](CONTRIBUTING.md).

## Release integrity

Releases after 0.1.0 are published from GitHub Actions through npm trusted
publishing (OIDC), with provenance, and the package doesn't accept token-based
publishing. You can check a release's provenance on its npm page or with
`npm audit signatures`.
