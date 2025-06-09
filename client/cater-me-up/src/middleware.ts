import { authMiddleware } from "@clerk/nextjs/server"; // For Next.js 14+ App Router

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/', // Assuming homepage is public
    '/sign-in(.*)', // Clerk's sign-in page, allows for sub-paths
    '/sign-up(.*)', // Clerk's sign-up page
    '/api/public-route-example(.*)' // Example of a public API route
  ],

  // Routes that can always be accessed, and have
  // no authentication information
  // ignoredRoutes: ['/no-auth-in-this-route'], // Example

  // Ensure that /admin routes are protected
  // By default, all routes not listed in publicRoutes are protected.
  // So, /admin/* will be protected.
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: [
    "/((?!.+\.[\w]+$|_next).*)", // Matches all routes except static files and _next internal routes
    "/", // Match the root route
    "/(api|trpc)(.*)" // Match all API routes
  ],
};
