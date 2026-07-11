import { createWalletClient, createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync } from 'fs'

const RPC = 'https://rpc.ritualfoundation.org'
const JOB_MARKET = '0xD4FD366d2C6884C5c76890a489Fc876CF5695E9A'
const STAKING = '0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18'
const RITUAL = { id: 1979, name: 'Ritual', nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } }
const SK1 = '0x0000000000000000000000000000000000000000000000000000000000000001'
const SK2 = '0x0000000000000000000000000000000000000000000000000000000000000002'

const marketAbi = [
  { type:'function', name:'requestService', stateMutability:'payable', inputs:[{name:'requiredSkillIds',type:'bytes32[]'},{name:'taskData',type:'bytes'}], outputs:[{type:'uint256'}] },
  { type:'function', name:'submitBid', stateMutability:'nonpayable', inputs:[{name:'jobId',type:'uint256'},{name:'price',type:'uint256'},{name:'estBlocks',type:'uint256'}], outputs:[] },
  { type:'function', name:'assignJob', stateMutability:'payable', inputs:[{name:'jobId',type:'uint256'},{name:'bidIndex',type:'uint256'}], outputs:[] },
  { type:'function', name:'startProcessing', stateMutability:'payable', inputs:[{name:'jobId',type:'uint256'}], outputs:[] },
  { type:'function', name:'submitResult', stateMutability:'nonpayable', inputs:[{name:'jobId',type:'uint256'},{name:'resultData',type:'bytes'}], outputs:[] },
  { type:'function', name:'rateProvider', stateMutability:'nonpayable', inputs:[{name:'jobId',type:'uint256'},{name:'rating',type:'uint256'}], outputs:[] },
  { type:'function', name:'getBids', stateMutability:'view', inputs:[{name:'jobId',type:'uint256'}], outputs:[{type:'tuple[]', components:[{name:'provider',type:'address'},{name:'price',type:'uint256'},{name:'estBlocks',type:'uint256'},{name:'submittedAt',type:'uint256'}]}] },
  { type:'function', name:'nextJobId', stateMutability:'view', inputs:[], outputs:[{type:'uint256'}] },
  { type:'function', name:'jobs', stateMutability:'view', inputs:[{type:'uint256'}], outputs:[{type:'uint256'},{type:'address'},{type:'bytes'},{type:'uint256'},{type:'uint256'},{type:'uint8'},{type:'address'},{type:'bytes'},{type:'uint256'},{type:'uint256'},{type:'uint256'}] },
]
const stakeAbi = [{ type:'function', name:'isAgentActive', stateMutability:'view', inputs:[{type:'address'}], outputs:[{type:'bool'}] }]

const publicClient = createPublicClient({ chain: RITUAL, transport: http(RPC) })
const data = JSON.parse(readFileSync('/tmp/pm-10-agents.json','utf8'))
const openers = data.agents.filter(a => a.role === 'open_bid')
const solvers = data.agents.filter(a => a.role === 'solver')

function w(pk) {
  const account = privateKeyToAccount(pk)
  return { account, address: account.address, client: createWalletClient({ account, chain: RITUAL, transport: http(RPC) }) }
}
async function send(client, account, req, label) {
  const hash = await client.writeContract({ ...req, account, chain: RITUAL, maxFeePerGas: 1200000007n, maxPriorityFeePerGas: 1000000000n })
  const r = await publicClient.waitForTransactionReceipt({ hash })
  if (r.status !== 'success') throw new Error(label + ' revert')
  console.log('OK', label, hash)
  return hash
}

const jobs = []
for (let i = 0; i < 2; i++) {
  const o = openers[i]
  const ow = w(o.privateKey)
  const task = 'FRESH OPEN BID TEST ' + (i+1) + ': analyze market pulse'
  const taskHex = '0x' + Buffer.from(task,'utf8').toString('hex')
  await send(ow.client, ow.account, {
    address: JOB_MARKET, abi: marketAbi, functionName: 'requestService',
    args: [[SK1, SK2], taskHex], value: parseEther('0.001'),
  }, `post job by ${o.name}`)
  const jid = await publicClient.readContract({ address: JOB_MARKET, abi: marketAbi, functionName: 'nextJobId' })
  jobs.push({ jid, opener: o })
  console.log('job id', jid.toString())
}

for (const job of jobs) {
  for (const s of solvers) {
    const sw = w(s.privateKey)
    const active = await publicClient.readContract({ address: STAKING, abi: stakeAbi, functionName: 'isAgentActive', args: [sw.address] })
    if (!active) { console.log('skip unstaked', s.name); continue }
    try {
      await send(sw.client, sw.account, {
        address: JOB_MARKET, abi: marketAbi, functionName: 'submitBid',
        args: [job.jid, parseEther('0.0008'), 50n],
      }, `${s.name} bid #${job.jid}`)
    } catch (e) {
      console.log('bid fail', s.name, e.shortMessage || e.message)
    }
  }
  const bids = await publicClient.readContract({ address: JOB_MARKET, abi: marketAbi, functionName: 'getBids', args: [job.jid] })
  console.log(`job ${job.jid} bids=${bids.length}`)
}

const jid = jobs[0].jid
const bids = await publicClient.readContract({ address: JOB_MARKET, abi: marketAbi, functionName: 'getBids', args: [jid] })
if (bids.length === 0) {
  console.log('NO BIDS')
  process.exit(1)
}
const opener = jobs[0].opener
const ow = w(opener.privateKey)
await send(ow.client, ow.account, {
  address: JOB_MARKET, abi: marketAbi, functionName: 'assignJob', args: [jid, 0n],
}, 'assignJob')

const provider = bids[0].provider
const solver = solvers.find(s => s.address.toLowerCase() === provider.toLowerCase())
const sw = w(solver.privateKey)
await send(sw.client, sw.account, {
  address: JOB_MARKET, abi: marketAbi, functionName: 'startProcessing', args: [jid], value: parseEther('0.0002'),
}, 'startProcessing')

const resultHex = '0x' + Buffer.from('PLATFORM TEST RESULT: market pulse OK, sentiment mixed.', 'utf8').toString('hex')
await send(sw.client, sw.account, {
  address: JOB_MARKET, abi: marketAbi, functionName: 'submitResult', args: [jid, resultHex],
}, 'submitResult')

await send(ow.client, ow.account, {
  address: JOB_MARKET, abi: marketAbi, functionName: 'rateProvider', args: [jid, 5n],
}, 'rateProvider 5')

const job = await publicClient.readContract({ address: JOB_MARKET, abi: marketAbi, functionName: 'jobs', args: [jid] })
const statuses = ['OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','DISPUTED','REFUNDED','CANCELLED']
console.log('FINAL status:', statuses[Number(job[5])] || job[5])
console.log('DONE lifecycle job', jid.toString())
