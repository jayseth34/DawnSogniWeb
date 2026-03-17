import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./ui/HomePage";
import { DropsPage } from "./ui/DropsPage";
import { DropDetailPage } from "./ui/DropDetailPage";
import { CustomPage } from "./ui/CustomPage";
import { BulkPage } from "./ui/BulkPage";
import { CheckoutPage } from "./ui/CheckoutPage";
import { OrdersPage } from "./ui/OrdersPage";
import { LoginPage } from "./ui/LoginPage";
import { ContactPage } from "./ui/ContactPage";
import { ReturnsPage } from "./ui/ReturnsPage";
import { SizeChartPage } from "./ui/SizeChartPage";
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
      { path: "drops/:id", element: <DropDetailPage /> },
      { path: "custom", element: <CustomPage /> },
      { path: "bulk", element: <BulkPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "returns", element: <ReturnsPage /> },
      { path: "size-chart", element: <SizeChartPage /> }
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