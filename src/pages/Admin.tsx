import { Navigate, useLocation } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { apiClient } from "@/lib/api";

export default function Admin() {
  const location = useLocation();
  const isLogin = location.pathname === "/admin/login";
  const hasToken = !!apiClient.getAdminToken();

  if (isLogin) {
    return hasToken ? <Navigate to="/admin" replace /> : <AdminLogin />;
  }
  return <AdminDashboard />;
}
