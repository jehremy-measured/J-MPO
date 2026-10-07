import { useEffect, useState } from "react";
import type { AppRoute } from "./components/TopNavigation";
import { GeoPage } from "./pages/GeoPage";
import { MpoPage } from "./pages/MpoPage";

const ROUTE_HASHES: Record<AppRoute, string> = {
  optimize: "#/optimize",
  geo: "#/experiment/geo",
};

function routeFromHash(hash: string): AppRoute {
  return hash.startsWith("#/experiment") ? "geo" : "optimize";
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: AppRoute) => {
    window.location.hash = ROUTE_HASHES[next];
    window.scrollTo(0, 0);
  };

  return route === "geo" ? (
    <GeoPage onNavigate={navigate} />
  ) : (
    <MpoPage onNavigate={navigate} />
  );
}
