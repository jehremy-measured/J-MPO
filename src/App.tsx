import { useEffect, useState } from "react";
import type { AppRoute } from "./components/TopNavigation";
import { GeoPage } from "./pages/GeoPage";
import { MpoPage } from "./pages/MpoPage";

const ROUTE_HASHES: Record<AppRoute, string> = {
  optimize: "#/optimize",
  geo: "#/experiment/geo",
};

const DEFAULT_ROUTE: AppRoute = import.meta.env.VITE_DEFAULT_ROUTE === "geo" ? "geo" : "optimize";

function routeFromHash(hash: string): AppRoute {
  if (hash.startsWith("#/experiment") || hash === "#geo") return "geo";
  if (hash.startsWith("#/optimize") || hash === "#optimize") return "optimize";
  return DEFAULT_ROUTE;
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: AppRoute) => {
    // Route lives in state; the hash is a best-effort deep link (some hosts strip it)
    setRoute(next);
    try {
      window.location.hash = ROUTE_HASHES[next];
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
  };

  return route === "geo" ? (
    <GeoPage onNavigate={navigate} />
  ) : (
    <MpoPage onNavigate={navigate} />
  );
}
