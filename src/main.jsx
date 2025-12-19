import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./services/queryClient";
import { MIGRATIONS, TARGET_DATA_VERSION } from "./services/migrations";
import { useDataMigration } from "./services/useDataMigration";
import { useAuthBootstrap } from "./features/auth/useAuthBootstrap";
import router from "./app/router";
import "./styles.css";

function AppProviders() {
  useDataMigration(TARGET_DATA_VERSION, MIGRATIONS);
  useAuthBootstrap();
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <AppProviders />
    </QueryClientProvider>
  </React.StrictMode>
);
