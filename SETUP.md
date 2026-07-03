# TSU Repository — Auth Wiring Setup

This covers the steps that happen in the Clerk and Supabase dashboards,
not in code. Do these in order — each one depends on the last.

## Step 1 — Connect Clerk as a Supabase Third-Party Auth Provider

Supabase's native Clerk integration means Clerk-issued session tokens
are accepted directly by Supabase and verified against Clerk's public
keys — no manual JWT secret copying, and no separate JWT template needed
for basic auth to work.

1. In the **Clerk Dashboard** → your application → **Configure** →
   copy your **Frontend API URL** (looks like `https://your-app.clerk.accounts.dev`,
   or your custom domain if configured).
2. In the **Supabase Dashboard** → your project → **Authentication** →
   **Sign In / Providers** → **Third Party Auth** → **Add provider** →
   choose **Clerk** → paste the Frontend API URL from step 1.
3. Save. Supabase will now verify incoming Clerk tokens automatically.

## Step 2 — Add the `role` custom claim to Clerk's session token

Our `middleware.ts` reads `sessionClaims.metadata.role` to gate `/admin`
routes at the edge (RLS is the real enforcement; this is just a fast
redirect so non-admins never see the admin shell load).

1. Clerk Dashboard → **Sessions** → **Customize session token**.
2. Add:
   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```
3. Save. Any user's `public_metadata.role` will now appear in
   `sessionClaims.metadata.role` on every request.

## Step 3 — Set up the Clerk → Supabase user-sync webhook

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
2. Endpoint URL: `https://<your-deployed-domain>/api/webhooks/clerk`
   (for local testing, use the Clerk CLI or a tunnel like ngrok).
3. Subscribe to events: `user.created`, `user.updated`.
4. Copy the **Signing Secret** (`whsec_...`) into `CLERK_WEBHOOK_SIGNING_SECRET`
   in your `.env`.

## Step 4 — Promoting a user to Admin

There is no self-service admin signup. To make someone an admin:

1. Clerk Dashboard → **Users** → select the user → **Metadata** →
   **Public metadata** → add:
   ```json
   { "role": "admin" }
   ```
2. Save. On their next sign-in (or token refresh), two things happen:
   - The webhook fires `user.updated` → their `users.role` row in
     Supabase updates to `admin` → RLS now treats them as admin.
   - Their session token's `metadata.role` claim updates → middleware
     now lets them into `/admin`.

## Step 5 — Verify the whole chain

1. Run the app locally (`npm run dev`), sign up as a test user.
2. Visit `/dashboard`. You should see:
   - Your Clerk session user id and email
   - A matching row pulled back from Supabase's `users` table via RLS
3. If the Supabase row is missing: check the webhook fired (Clerk
   Dashboard → Webhooks → your endpoint → **Logs**) and check
   `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env`.
4. Promote yourself to admin (Step 4), sign out/in, confirm `/admin`
   routes are now reachable and were blocked before.

Once this checks out end to end, the auth layer is solid and every
screen we build after this (submission form, admin review queue,
public browse/search) can be built directly on top of it with
confidence that access control is actually enforced — not assumed.
