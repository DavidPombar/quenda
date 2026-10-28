# Security policy

## Supported versions

Quenda is in development (V0). Only the `main` branch receives security fixes until the
first tagged release.

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/DavidPombar/quenda/security/advisories/new).
Do not open public issues, pull requests or discussions about an unfixed vulnerability.

<!-- TODO(#19): add a security contact e-mail once the maintaining entity provides one. -->

Include the affected version or commit, steps to reproduce, the impact you observed and,
if possible, a suggested fix. Never include real personal data in a report; the demo uses
only synthetic accounts.

We aim to acknowledge reports within five working days and to agree a disclosure date
with you once a fix is available. Reporters are credited unless they prefer otherwise.

## Scope

The V0 demo is not a production deployment: demo login (`DEMO_MODE=true`), synthetic data
and missing production hardening are known limitations listed in the README. Reports about
them are still welcome when they affect a production-mode configuration.
