import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require a signed-in user at all.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/submit(.*)",
  "/admin(.*)",
]);

// Routes that additionally require the "admin" role.
// Role-gating happens here at the edge AND again via RLS in Supabase —
// this is defense in depth, not a substitute for the database-level check.
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isAdminRoute(req)) {
    // "role" is read from a custom claim set on the Clerk session token
    // via the JWT template — see SETUP.md, step 1.
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
