# Axcess — Full Deployment Guide

This walks through every step from zero to a live, paid MCP server on Fly.io.

---

## Before you start — what you need

- A Mac terminal (you already have this)
- A Coinbase account or any Ethereum wallet with a Base mainnet address (for receiving payments)
- A wallet with a small amount of USDC on Base mainnet for the test payment (~$0.25 is plenty) — this can be the same wallet as your PAYMENT_ADDRESS; the $0.05 just moves from your wallet back to itself
- About 45 minutes

---

## Part 1 — Install flyctl

flyctl is the Fly.io CLI. You need it to deploy.

```bash
brew install flyctl
```

Verify it worked:

```bash
fly version
```

You should see something like `fly v0.3.x ...`. If the command isn't found, close and reopen your terminal.

---

## Part 2 — Create a Fly.io account

1. Go to `https://fly.io` and click **Sign Up**
2. Sign up with GitHub or email
3. Verify your email
4. **Enter a credit card** — Fly.io requires this even for the free tier (abuse prevention). You will not be charged for a single small Node.js app within the free allowance.

---

## Part 3 — Log in via CLI

```bash
fly auth login
```

This opens a browser window. Log in, then return to your terminal. You should see:

```
successfully logged in as your@email.com
```

---

## Part 4 — Get a Coinbase CDP API key

This is required for Base mainnet payments. The key is free.

1. Go to `https://cdp.coinbase.com`
2. Sign up or log in with your Coinbase account
3. Click **Create Project** — name it anything (e.g. `axcess`)
4. Inside the project, click **Create API Key**
5. Name it anything (e.g. `axcess-production`)
6. Leave the permissions as default
7. Click **Create & Download**

You will see two values — **copy them both right now, the secret is only shown once:**

```
CDP_API_KEY_ID=organizations/xxx/apiKeys/yyy
CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----...
```

Save these somewhere safe (a password manager, not a file in the repo).

**Common issue:** The `CDP_API_KEY_SECRET` is a multi-line PEM key. When you set it as a Fly.io secret later, you need to pass it carefully. The exact command is shown in Part 7.

---

## Part 5 — Confirm your PAYMENT_ADDRESS

This is the wallet address where all $0.05 payments will land. It does NOT need to be the same wallet you use for the test payment.

- If you use Coinbase: go to your Coinbase account → Assets → USDC → click **Receive** → make sure the network is **Base** → copy the address
- If you use MetaMask: open MetaMask → switch to Base network → copy your address

It should look like: `0x1234...abcd`

You do NOT need any funds in this wallet to receive payments.

---

## Part 6 — Launch the app on Fly.io (no deploy yet)

Navigate to the server directory:

```bash
cd /Users/tmasingale/Documents/GitHub/comp-design-aesthetics/axcess-mcp-server
```

Run the launch command with `--no-deploy` so it registers the app without deploying:

```bash
fly launch --name axcess-mcp-server --no-deploy
```

**What to expect — answer these prompts:**

- `An existing fly.toml file was found. Would you like to copy its configuration to the new app?` → **Yes**
- `Do you want to tweak these settings before proceeding?` → **No**
- It may ask about a Postgres database or Redis → **No** to both (this app has no database)

If you get `Error: app name "axcess-mcp-server" is already taken` — Fly.io app names are globally unique. Try `axcess-mcp-evaluator` or `axcess-typo-eval` or add your initials: `axcess-mcp-tm`.

After this completes, your app is registered but not yet running.

---

## Part 7 — Set secrets

Secrets are environment variables that are encrypted and never visible in logs or the dashboard.

Run these one at a time. Replace the placeholder values with your real ones:

```bash
fly secrets set PAYMENT_ADDRESS=0xYourBaseMainnetAddress
```

```bash
fly secrets set X402_NETWORK=eip155:8453
```

```bash
fly secrets set CDP_API_KEY_ID="organizations/xxx/apiKeys/yyy"
```

For the CDP secret key (multi-line PEM), use this approach to avoid shell escaping issues:

```bash
fly secrets set CDP_API_KEY_SECRET="$(cat <<'EOF'
-----BEGIN EC PRIVATE KEY-----
your key content here
-----END EC PRIVATE KEY-----
EOF
)"
```

Or paste it as a single line if your CDP dashboard gave you a one-line version.

Verify your secrets are set (values are hidden, just names shown):

```bash
fly secrets list
```

You should see all four listed.

---

## Part 8 — Deploy

```bash
fly deploy
```

This builds the Docker image (using your `Dockerfile`) and deploys it. It will take 2–4 minutes the first time.

**What to watch for in the output:**

```
==> Building image
...
==> Pushing image to registry
...
1 desired, 1 placed, 1 healthy, 0 unhealthy [health checks: 1 total, 1 passing]
```

The last line with `1 healthy` means it's live.

**Common issues:**

- `Error: health check failed` — the `/health` endpoint isn't responding. Check `fly logs` (see Part 9).
- `Error: no machines in group app` — run `fly scale count 1` then retry `fly deploy`
- `Error connecting to Docker daemon` — Docker Desktop needs to be running on your Mac. Open Docker Desktop from your Applications folder.

---

## Part 9 — Check the logs

After deploy, tail the live logs:

```bash
fly logs
```

A healthy startup looks like:

```
[info] Axcess MCP Server running at http://0.0.0.0:3000/mcp
[info] Health check: http://0.0.0.0:3000/health
[info] Payment recipient: 0xYour...Address
```

**Warning you might see (harmless):**

```
[x402] WARNING: PAYMENT_ADDRESS not set
```

If you see this despite setting the secret, double check with `fly secrets list` and redeploy.

---

## Part 10 — Verify the live URL

Get your app URL:

```bash
fly status
```

Your hostname will be shown, e.g. `axcess-mcp-server.fly.dev`.

Run these three checks:

**Health check (should return 200):**
```bash
curl https://axcess-mcp-server.fly.dev/health
```

**Free tool (should return 200 with capabilities JSON):**
```bash
curl -s -X POST https://axcess-mcp-server.fly.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "mcp-protocol-version: 2025-03-26" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_capabilities","arguments":{}}}' \
  | jq .
```

**Paid tool (should return 402 — this is correct):**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://axcess-mcp-server.fly.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "mcp-protocol-version: 2025-03-26" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"evaluate_typography","arguments":{"elements":[]}}}'
```

Expected output: `402` — that means the payment gate is working.

If you get `000` or a connection error instead of `402`, the server may still be starting. Wait 30 seconds and try again.

---

## Part 11 — End-to-end payment test (real USDC on Base mainnet)

For this you need a wallet with ~$0.25 USDC on Base mainnet.

**Getting USDC on Base mainnet if you don't have it:**
- If you have USDC on Coinbase: withdraw it to your wallet, select **Base** as the network (not Ethereum mainnet — fees on Ethereum are much higher)
- If you have ETH on Base: swap it on Uniswap or Aerodrome at `app.uniswap.org`
- The USDC contract on Base is `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**Run the test:**

```bash
cd /Users/tmasingale/Documents/GitHub/comp-design-aesthetics/axcess-mcp-server
MCP_SERVER_URL=https://axcess-mcp-server.fly.dev/mcp \
EVM_PRIVATE_KEY=0xYourTestWalletPrivateKey \
npm run test:paid
```

**Expected output:**

```
Settlement success: true
Payer: 0xYour...address
Transaction: 0x...hash
Network: eip155:8453
Response status: 200
Overall score: ...
Verdict: ...
```

**If you see `Settlement success: false`:**
- Check that `EVM_PRIVATE_KEY` is the key for a wallet with actual USDC on Base mainnet (not testnet)
- Check that `X402_NETWORK` secret is `eip155:8453` (not `eip155:84532`)
- Check `fly logs` for any facilitator errors

---

## Part 12 — Update URLs in the repo

Now that you have a live URL, update two files:

**[README.md](README.md)** — replace `your-deployment.up.railway.app` (3 places) with your actual Fly.io hostname:
```
https://axcess-mcp-server.fly.dev/mcp
```

**[smithery.yaml](smithery.yaml)** — update the `remote.url` field:
```yaml
remote:
  url: https://axcess-mcp-server.fly.dev/mcp
```

---

## Part 13 — Push to GitHub

The Smithery registry needs a public GitHub repo to submit from.

If the repo isn't on GitHub yet:
```bash
cd /Users/tmasingale/Documents/GitHub/comp-design-aesthetics
gh repo create axcess-mcp-server --public --source=axcess-mcp-server --push
```

If it's already on GitHub:
```bash
cd /Users/tmasingale/Documents/GitHub/comp-design-aesthetics/axcess-mcp-server
git add .
git commit -m "Add deployment config and documentation"
git push
```

**Make sure `.env` is NOT committed.** The `.gitignore` should already cover this but double check:
```bash
git status
```
If you see `.env` listed, do not add it. Only `.env.example` should be committed.

---

## Part 14 — Submit to registries

### Smithery (most important)

1. Go to `https://smithery.ai`
2. Log in with GitHub
3. Click **Submit Server**
4. Enter your GitHub repo URL
5. Smithery reads `smithery.yaml` automatically

### mcp.so

1. Go to `https://mcp.so`
2. Click **Submit** in the nav
3. It opens a GitHub issue template in their repo — fill it out with your server name, description, URL, and tools

### glama.ai

1. Go to `https://glama.ai/mcp/servers`
2. Click **Submit**
3. Provide your GitHub repo URL and the live server URL

---

## Part 15 — Connect it to Claude.ai to test

1. Go to `https://claude.ai`
2. Open **Settings** → **Integrations**
3. Click **Add MCP Server**
4. Enter: `https://axcess-mcp-server.fly.dev/mcp`
5. Name it `Axcess`

Claude will call `list_capabilities` automatically. You should see the tools listed in Claude's tool panel.

Note: Claude.ai does not yet have a built-in USDC wallet, so it can discover the tools but cannot autonomously pay for `evaluate_typography`. It will show the tool and describe what it does. The paying users today are developers wiring up `@x402/fetch` in their own agents.

---

## Quick reference — useful commands

```bash
fly logs                    # live logs
fly status                  # app status and hostname
fly secrets list            # show which secrets are set (not values)
fly deploy                  # redeploy after code changes
fly scale count 1           # ensure 1 machine is running
fly ssh console             # SSH into the running container
```

---

## Cost

The free tier includes:
- 3 shared-cpu-1x VMs (256MB each)
- 3GB outbound transfer/month
- 160GB storage total

This app runs on 1 VM and has negligible transfer. You should stay well within the free allowance indefinitely unless you get significant traffic, at which point you're earning $0.05 per call to cover it.
