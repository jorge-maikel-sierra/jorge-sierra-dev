import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Only the pages: API routes, Next.js internals and files never pass through.
  matcher: ["/", "/(es|en)/:path*"],
};
