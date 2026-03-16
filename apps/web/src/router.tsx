import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./ui/HomePage";
import { DropsPage } from "./ui/DropsPage";
import { CustomPage } from "./ui/CustomPage";
import { BulkPage } from "./ui/BulkPage";
import { CheckoutPage } from "./ui/CheckoutPage";
import { OrdersPage } from "./ui/OrdersPage";
import { AdminLayout } from "./ui/admin/AdminLayout";
import { AdminLoginPage } from "./ui/admin/AdminLoginPage";
import { AdminDropsPage } from "./ui/admin/AdminDropsPage";
import { AdminCustomRequestsPage } from "./ui/admin/AdminCustomRequestsPage";
import { AdminOrdersPage } from "./ui/admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "./ui/admin/AdminOrderDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "drops", element: <DropsPage /> },
      { path: "custom", element: <CustomPage /> },
      { path: "bulk", element: <BulkPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders", element: <OrdersPage /> }
    ]
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOrdersPage /> },
      { path: "login", element: <AdminLoginPage /> },
      { path: "drops", element: <AdminDropsPage /> },
      { path: "custom", element: <AdminCustomRequestsPage /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "orders/:id", element: <AdminOrderDetailPage /> }
    ]
  }
]);