import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth({
  // Use environment-based base URL for deployment safety
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 
           (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : undefined),
  // Redirect to chat page after successful authentication
  returnPathname: "/chat"
});
