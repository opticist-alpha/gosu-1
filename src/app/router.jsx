import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HomePage from "../features/home/HomePage";
import ProsPage from "../features/pros/components/ProsPage";
import RequestPage from "../features/requests/components/RequestPage";
import MessagesPage from "../features/messages/components/MessagesPage";
import OrdersPage from "../features/orders/components/OrdersPage";
import DashboardPage from "../features/pros/components/DashboardPage";
import ErrorBoundary from "./ErrorBoundary";
import AuthPage from "../features/auth/components/AuthPage";
import RequireAuth from "../features/auth/components/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "pros", element: <ProsPage /> },
      { path: "auth", element: <AuthPage /> },
      {
        path: "requests",
        element: (
          <RequireAuth roles={["customer"]}>
            <RequestPage />
          </RequireAuth>
        ),
      },
      {
        path: "messages",
        element: (
          <RequireAuth>
            <MessagesPage />
          </RequireAuth>
        ),
      },
      {
        path: "orders",
        element: (
          <RequireAuth roles={["customer", "pro"]}>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: "dashboard",
        element: (
          <RequireAuth roles={["pro"]}>
            <DashboardPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);

export default router;
