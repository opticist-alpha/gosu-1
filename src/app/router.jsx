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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "pros", element: <ProsPage /> },
      { path: "requests", element: <RequestPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "dashboard", element: <DashboardPage /> },
    ],
  },
]);

export default router;
