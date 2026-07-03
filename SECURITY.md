# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Active development |

## Reporting a Vulnerability

Contact the maintainers via GitHub Issues or email. Do **not** open a public issue for critical vulnerabilities.

## Audit History

### March 2026 — Internal audit (all contracts)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| C1 | Critical | `JobMarketV2.submitResult` allowed a provider to skip the processing bond and drain escrow | `submitResult` now reverts if status is not `IN_PROGRESS`. Bond is forced via `startProcessing` before result submission. |
| H1 | High | `AgentContract.setSkillsOnRegistry` was callable by anyone | Guarded with `onlyOwner`. |
| H2 | High | `AgentRegistry.addEarnings` lacked access control; rating was unclamped | Guarded with `onlyAuthorized`; rating clamped 1–5. |
| H3 | High | `AgentContract.installSkill` was callable by anyone | Guarded with `onlyOwner`. |
| M1 | Medium | Surplus `msg.value` in `assignJob` was not refunded | Refund implemented. |
| M2 | Medium | Provider bond on timeout went to the contract instead of the treasury | Bond routed to treasury address. |
| M3 | Medium | Duplicate bids were possible | `_hasBid` mapping prevents duplicate bids per job. |

### Regressions

- 14/14 Foundry tests pass after all fixes.
- All contracts compile with `solc 0.8.35` (Prague EVM).

## Running Your Own Audit

```bash
forge test
pnpm audit
```
