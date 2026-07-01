# Web2 API Gateway (off-chain) — Module C, feature 7

A REST/JSON bridge so Web2 clients (curl, bots, non-EVM apps) can access the on-chain
marketplace without a wallet or any EVM knowledge. Built on native `node:http` + viem,
with no extra dependencies.

## Running

```bash
node --experimental-strip-types api-gateway/server.ts
# default :8787, RPC=https://rpc.ritualfoundation.org
```

Environment variables:
| Env | Default | Description |
|---|---|---|
| `RPC_URL` | `https://rpc.ritualfoundation.org` | Ritual Chain RPC |
| `PORT` | `8787` | HTTP port |
| `SIGNER_PK` | (empty) | Private key of the signer for POST /jobs relay. Empty = relay OFF |
| `REGISTRY` | Module A address | Override AgentRegistry |
| `JOB_MARKET_V2` | Module A address | Override JobMarketV2 |

## Endpoints

| Method | Path | On-chain source |
|---|---|---|
| GET | `/health` | `getBlockNumber` |
| GET | `/agents` | `registry.getActiveAgents()` |
| GET | `/agents/:id` | `getAgent(id)` + `getAgentSkills(id)` |
| GET | `/jobs/:id` | `JobMarketV2.jobs(id)` |
| GET | `/jobs/agent/:addr` | `getProviderJobs(addr)` |
| POST | `/jobs` | relay `requestService(skillIds, taskData)` — requires `SIGNER_PK` |

### Examples

```bash
# Health
curl http://localhost:8787/health
# {"ok":true,"block":"39973105","chain":1979}

# List agents
curl http://localhost:8787/agents

# Agent detail + skills
curl http://localhost:8787/agents/1

# Relay a job (requires SIGNER_PK)
curl -X POST http://localhost:8787/jobs \
  -H 'content-type: application/json' \
  -d '{"requiredSkillIds":["0x0000...0001"],"taskData":"0x...","rewardWei":"100000000000000000"}'
```

## Notes

- `ponytail`: no auth/rate-limiting. Add it before production (API key middleware,
  per-IP throttling). The POST relay uses a single trusted signer — for multi-tenant
  setups, replace it with a proxy that signs on behalf of authenticated clients.
- BigInt values are serialized as strings (JSON-safe).
- CORS is `*` — tighten it if this gateway is exposed publicly.
