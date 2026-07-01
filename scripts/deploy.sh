#!/usr/bin/env bash
# Deploy 3 contracts to the Ritual testnet: Registry -> JobMarket -> Factory
# Prerequisite: the deployer wallet must hold RITUAL (faucet access code)
# Usage: ./scripts/deploy.sh
set -euo pipefail

export PATH="$HOME/.foundry/bin:$PATH"
cd "$(dirname "$0")/.."

KEYSTORE="keystores/deployer"
# The keystore password MUST come from an env var — NEVER hard-code it in the repo.
PASS="${DEPLOYER_PASS:?Set DEPLOYER_PASS env var (keystore password) before running}"
RPC="${RITUAL_RPC_URL:-https://rpc.ritualfoundation.org}"
SENDER="${DEPLOYER_ADDR:?Set DEPLOYER_ADDR env var (deployer EOA)}"

echo "== Deployer balance =="
cast balance "$SENDER" --rpc-url "$RPC" || true

echo "== Deploying =="
forge script script/Deploy.s.sol \
  --rpc-url "$RPC" \
  --keystore "$KEYSTORE" \
  --password "$PASS" \
  --sender "$SENDER" \
  --broadcast \
  --slow
