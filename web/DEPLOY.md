# Open Brain Web App — NUC Deployment Guide

Target: GMKtec NUC at 192.168.1.50 (Ubuntu 24.04), Docker managed via Portainer.
Public URL: https://brain.maundez.uk via Cloudflare Tunnel → Nginx Proxy Manager.

---

## Prerequisites

- Docker installed on the NUC
- Portainer running and accessible
- Nginx Proxy Manager running (ports 80/81/443)
- Wildcard cert `*.maundez.uk` already issued in NPM
- Cloudflare Tunnel already configured

---

## Step 1 — Copy the source to the NUC

Either SCP the `web/` directory or clone the repo directly on the NUC:

```bash
# Option A — SCP from Steve-Desktop (run from Steve-Desktop)
scp -r e:/Projects/open-brain/web steve@192.168.1.50:~/open-brain-ui

# Option B — Git clone on the NUC
ssh steve@192.168.1.50
git clone <repo-url> open-brain
cd open-brain/web
```

---

## Step 2 — Create the production environment file

On the NUC, inside the `web/` (or `open-brain-ui/`) directory:

```bash
cp .env.production.example .env.production
nano .env.production   # Fill in all real values
```

Key values to set:
- `NEXTAUTH_URL=https://brain.maundez.uk` (already set in the example)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- All Azure and Supabase credentials from your secure store

---

## Step 3 — Build the Docker image on the NUC

The image must be built on the NUC (not transferred from Windows) because the
build output is Linux/amd64.

```bash
cd ~/open-brain-ui   # or wherever web/ lives

docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://iwyofenfguyrzgqwytse.supabase.co \
  -t open-brain-ui:latest \
  .
```

`NEXT_PUBLIC_SUPABASE_URL` is the only build-time variable (it gets embedded in
the browser bundle). All other variables are injected at runtime via
`.env.production`.

---

## Step 4 — Create the Docker network (first time only)

The `docker-compose.yml` uses an external network called `nuc-proxy`. Create it
once if it doesn't exist:

```bash
docker network create nuc-proxy
```

If your other NUC services already use a shared network with a different name,
update the `networks` section in `docker-compose.yml` to match.

---

## Step 5 — Deploy via Portainer stack

1. Open Portainer → **Stacks** → **Add stack**
2. Name: `open-brain-ui`
3. Paste the contents of `docker-compose.yml` into the web editor
   **or** point Portainer at the `docker-compose.yml` file on disk
4. Under **Env**, confirm Portainer will pick up `.env.production` from the same
   directory (it reads `env_file` entries relative to the stack file path)
5. Click **Deploy the stack**

Alternatively, deploy from the NUC CLI:

```bash
cd ~/open-brain-ui
docker compose up -d
```

Verify the container is running:

```bash
docker ps | grep open-brain-ui
docker logs open-brain-ui --tail 50
```

---

## Step 6 — Configure Nginx Proxy Manager

1. Open NPM at `http://192.168.1.50:81`
2. **Proxy Hosts** → **Add Proxy Host**
3. Fill in:
   - **Domain name:** `brain.maundez.uk`
   - **Scheme:** `http`
   - **Forward hostname/IP:** `192.168.1.50` (or the container name `open-brain-ui` if NPM is on the same Docker network)
   - **Forward port:** `3000`
   - **Block common exploits:** on
4. **SSL tab:**
   - Select the `*.maundez.uk` wildcard certificate
   - Force SSL: on
   - HTTP/2: on
5. Save

---

## Step 7 — Cloudflare Tunnel

### Option A — Tunnel → NPM (recommended, NPM handles TLS)

In the Cloudflare Zero Trust dashboard, point the tunnel for `brain.maundez.uk`
to `http://192.168.1.50:80`. NPM handles the HTTPS termination.

### Option B — Tunnel directly to the container

Point the tunnel to `http://192.168.1.50:3000`. Set the tunnel to use `No TLS
verify` if needed, and ensure the app's `NEXTAUTH_URL` matches the public URL.

---

## Step 8 — Smoke test

1. Visit `https://brain.maundez.uk` — you should be redirected to `/login`
2. Click **Sign in with Microsoft** — Azure OAuth flow should complete
3. You should land on the main thoughts browser

If login fails, check:
- `NEXTAUTH_URL` in `.env.production` exactly matches `https://brain.maundez.uk`
- The redirect URI is registered in Azure (see Azure App Registration section)
- Container logs: `docker logs open-brain-ui`

---

## Rebuilding after a code change

```bash
# Pull latest code
cd ~/open-brain-ui
git pull   # or scp new files

# Rebuild image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://iwyofenfguyrzgqwytse.supabase.co \
  -t open-brain-ui:latest \
  .

# Restart container
docker compose up -d
```

---

## Azure App Registration — redirect URI

Before the production deployment will work, add the production redirect URI to
your Azure App Registration. See the Azure App Registration section in the
main task summary for exact steps.
