# Azure App Registration — Digital Brain

This document walks through the one-time Azure / Entra ID setup required before
the NextAuth.js Microsoft sign-in will work. You only need to do this once.

---

## Prerequisites

- Admin (or app registration) access to the **DTS Solutions** Microsoft 365 tenant
- The Azure Portal: https://portal.azure.com

---

## Step 1 — Create the app registration

1. Go to **Azure Portal → Microsoft Entra ID → App registrations → New registration**
2. Fill in the form:
   - **Name:** `Digital Brain`
   - **Supported account types:** `Accounts in this organizational directory only (DTS Solutions only — Single tenant)`
   - **Redirect URI:** leave blank for now (you will add these in Step 2)
3. Click **Register**

After registration you land on the app's overview page. Leave this tab open — you
will copy values from it in Step 4.

---

## Step 2 — Add redirect URIs

1. In the app's left menu go to **Authentication**
2. Under **Platform configurations** click **Add a platform → Web**
3. Add the following redirect URIs:

   | Environment | URI |
   |---|---|
   | Local dev | `http://localhost:3001/api/auth/callback/microsoft-entra-id` |
   | Production | `https://brain.dtssolutions.com.au/api/auth/callback/microsoft-entra-id` |

4. Under **Implicit grant and hybrid flows** — leave both boxes **unchecked** (not needed for PKCE/code flow)
5. Click **Save**

---

## Step 3 — Create a client secret

1. In the app's left menu go to **Certificates & secrets**
2. Click **New client secret**
3. Give it a description (e.g., `Digital Brain production`) and choose an expiry
   (24 months is a reasonable default)
4. Click **Add**
5. **Copy the secret Value immediately** — you cannot retrieve it again after leaving the page

---

## Step 4 — Collect the three values you need

Go to the app's **Overview** page and note:

| Value | Where to find it | Maps to env var |
|---|---|---|
| Application (client) ID | Overview → Application (client) ID | `AZURE_AD_CLIENT_ID` |
| Directory (tenant) ID | Overview → Directory (tenant) ID | `AZURE_AD_TENANT_ID` |
| Client secret value | Copied in Step 3 | `AZURE_AD_CLIENT_SECRET` |

---

## Step 5 — Configure environment variables

Copy `web/.env.local.example` to `web/.env.local` and fill in the values:

```
AZURE_AD_CLIENT_ID=<Application (client) ID>
AZURE_AD_CLIENT_SECRET=<client secret value from Step 3>
AZURE_AD_TENANT_ID=<Directory (tenant) ID>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3001
```

For production (Docker on NUC), set these as environment variables in the
container / `docker-compose.yml` rather than a `.env.local` file. Make sure
`NEXTAUTH_URL` is updated to `https://brain.dtssolutions.com.au`.

---

## Step 6 — API permissions

No additional API permissions are required beyond the OpenID Connect defaults.
The app uses the standard `openid`, `profile`, and `email` scopes which are
granted automatically by the Microsoft Entra ID provider in NextAuth.js.

You do **not** need to grant any Microsoft Graph permissions unless you later
want to access mailbox or calendar data.

---

## Testing locally

Once the app registration is complete and `.env.local` is populated:

1. Start the dev server:
   ```
   npm run dev
   ```

2. Navigate to `http://localhost:3001` — you should be immediately redirected to
   `/login` (the custom sign-in page).

3. Click **Sign in with Microsoft** — you will be redirected to the Microsoft
   login page.

4. Sign in with a **DTS Solutions M365 account** — you should be redirected back
   to the app and land on the main page.

5. **Verify tenant lock:** open a private/incognito window and try signing in with
   a personal Microsoft account (e.g., `@hotmail.com`, `@outlook.com`, or any
   account from a different organisation). The sign-in should fail and you should
   be returned to `/login` without gaining access.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `AADSTS50011: The redirect URI ... does not match` | The redirect URI in the Azure app registration doesn't match exactly. Check Step 2. |
| Redirect to `/login` with no error after Microsoft sign-in | Tenant lock is rejecting the account. Confirm the account is on the DTS Solutions tenant and that `AZURE_AD_TENANT_ID` matches the Directory (tenant) ID. |
| `Configuration` error on `/login` page | One or more env vars (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `NEXTAUTH_SECRET`) are missing or empty. |
| Secret expired | Client secrets expire. Rotate in Azure Portal → Certificates & secrets, update `AZURE_AD_CLIENT_SECRET` in your environment. |
