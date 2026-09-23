import { createStart, createMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createMiddleware({ type: "request" }).server(
  async ({ request, handlerType, next }) => {
    if (handlerType !== "serverFn") return next();

    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite === "cross-site") {
      return new Response("Forbidden", { status: 403 });
    }

    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const trustedOrigin = requestUrl.origin;
    const suppliedOrigin = origin ?? (referer ? new URL(referer).origin : null);

    if (suppliedOrigin !== trustedOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    return next();
  },
);

// TanStack uses this marker to detect CSRF middleware in development. The
// implementation above stays server-only while preserving that contract.
if (process.env.NODE_ENV !== "production") {
  Object.defineProperty(csrfMiddleware, Symbol.for("tanstack-start:csrf-middleware"), {
    value: true,
  });
}

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
