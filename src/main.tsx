import React, { lazy, Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const AdminDashboard = lazy(() => import("./AdminDashboard"));

function Router() {
  const [isAdmin, setIsAdmin] = useState(
    window.location.pathname.replace(/\/+$/, "") === "/admin" ||
      window.location.hash === "#admin",
  );

  useEffect(() => {
    const updateRoute = () =>
      setIsAdmin(
        window.location.pathname.replace(/\/+$/, "") === "/admin" ||
          window.location.hash === "#admin",
      );
    window.addEventListener("hashchange", updateRoute);
    window.addEventListener("popstate", updateRoute);
    return () => {
      window.removeEventListener("hashchange", updateRoute);
      window.removeEventListener("popstate", updateRoute);
    };
  }, []);

  return isAdmin
    ? (
      <Suspense fallback={<main className="admin-shell"><p role="status">Loading administrator portal...</p></main>}>
        <AdminDashboard />
      </Suspense>
    )
    : <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);
