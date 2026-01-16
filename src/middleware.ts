import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export const config = { 
  matcher: [
    "/", 
    "/chat", 
    "/account/:path*", 
    "/api/:path*",
    "/((?!test-chat|api/test-chat).*)"
  ] 
};

export default authkitMiddleware();
