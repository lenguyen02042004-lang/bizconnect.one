import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CardFAB } from "@/components/CardFAB";
import { AuthProvider } from "@/contexts/AuthContext";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

import i18n from "@/i18n";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { title: i18n.t("meta.homeTitle", { defaultValue: "BizConnect.One — Bản đồ doanh nghiệp toàn cầu" }) },
      { name: "description", content: i18n.t("meta.homeDesc", { defaultValue: "Kết nối doanh nghiệp toàn cầu qua bản đồ tương tác 3D. Quảng bá thương hiệu, mở rộng giao thương quốc tế chỉ từ $5/năm." }) },
      { name: "theme-color", content: "#c8102e" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: i18n.t("meta.homeTitle", { defaultValue: "BizConnect.One — Bản đồ doanh nghiệp toàn cầu" }) },
      { property: "og:description", content: i18n.t("meta.homeDesc", { defaultValue: "Kết nối doanh nghiệp toàn cầu qua bản đồ tương tác 3D. Quảng bá thương hiệu, mở rộng giao thương quốc tế chỉ từ $5/năm." }) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: i18n.t("meta.homeTitle", { defaultValue: "BizConnect.One — Bản đồ doanh nghiệp toàn cầu" }) },
      { name: "twitter:description", content: i18n.t("meta.homeDesc", { defaultValue: "Kết nối doanh nghiệp toàn cầu qua bản đồ tương tác 3D. Quảng bá thương hiệu, mở rộng giao thương quốc tế chỉ từ $5/năm." }) },
      { property: "og:site_name", content: "BizConnect.One" },

    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=", crossOrigin: "" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://earth-biz-link.lovable.app/#org",
              name: "BizConnect.One",
              url: "https://earth-biz-link.lovable.app/",
              logo: "https://earth-biz-link.lovable.app/favicon.ico",
              description:
                "Worldwide B2B business directory with an interactive 3D map. Create online business cards, connect and exchange contacts with international partners.",
            },
            {
              "@type": "WebSite",
              "@id": "https://earth-biz-link.lovable.app/#website",
              url: "https://earth-biz-link.lovable.app/",
              name: "BizConnect.One",
              publisher: { "@id": "https://earth-biz-link.lovable.app/#org" },
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://earth-biz-link.lovable.app/explore?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <CardFAB />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
