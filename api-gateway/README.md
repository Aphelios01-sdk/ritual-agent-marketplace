# API Gateway Web2 (off-chain) — Modul C fitur 7

Bridge REST/JSON untuk client Web2 (curl, bot, aplikasi non-EVM) mengakses marketplace
on-chain tanpa perlu wallet atau pengetahuan EVM. Native `node:http` + viem, tanpa
dependency tambahan.

## Menjalankan

```bash
node --experimental-strip-types api-gateway/server.ts
# default :8787, RPC=https://rpc.ritualfoundation.org
```

Variabel env:
| Env | Default | Keterangan |
|---|---|---|
| `RPC_URL` | `https://rpc.ritualfoundation.org` | Ritual Chain RPC |
| `PORT` | `8787` | Port HTTP |
| `SIGNER_PK` | (kosong) | Private key signer untuk POST /jobs relay. Kosong = relay OFF |
| `REGISTRY` | alamat Modul A | Override AgentRegistry |
| `JOB_MARKET_V2` | alamat Modul A | Override JobMarketV2 |

## Endpoint

| Method | Path | Sumber on-chain |
|---|---|---|
| GET | `/health` | `getBlockNumber` |
| GET | `/agents` | `registry.getActiveAgents()` |
| GET | `/agents/:id` | `getAgent(id)` + `getAgentSkills(id)` |
| GET | `/jobs/:id` | `JobMarketV2.jobs(id)` |
| GET | `/jobs/agent/:addr` | `getProviderJobs(addr)` |
| POST | `/jobs` | relay `requestService(skillIds, taskData)` — butuh `SIGNER_PK` |

### Contoh

```bash
# Health
curl http://localhost:8787/health
# {"ok":true,"block":"39973105","chain":1979}

# Daftar agent
curl http://localhost:8787/agents

# Detail agent + skills
curl http://localhost:8787/agents/1

# Relay job (butuh SIGNER_PK)
curl -X POST http://localhost:8787/jobs \
  -H 'content-type: application/json' \
  -d '{"requiredSkillIds":["0x0000...0001"],"taskData":"0x...","rewardWei":"100000000000000000"}'
```

## Catatan

- `ponytail`: tidak ada auth/rate-limit. Tambah saat produksi (API key middleware, per-IP
  throttle). POST relay memakai satu trusted signer — untuk multi-tenant, ganti jadi
  proxy yang sign atas permintaan client berotentikasi.
- BigInt diserialisasi sebagai string (aman untuk JSON).
- CORS `*` — ketatkan bila gateway ini terbuka ke publik.
