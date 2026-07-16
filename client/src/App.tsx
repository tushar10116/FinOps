import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import WorkspaceLayout from "./components/WorkspaceLayout";
import { getStoredToken } from "./lib/auth";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterUser from "./pages/RegisterUser";
import CloudConnectPage from "./pages/CloudConnectPage";
import OrganizationUsersPage from "./pages/OrganizationUsersPage";
import RegisterOrganizationPage from "./pages/RegisterOrganizationPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";


function HomeRedirect() {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/register-organization" element={<RegisterOrganizationPage />} />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<WorkspaceLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<ProtectedRoute authorisedRoles={["admin"]} />}>
            <Route path="/organization-users" element={<OrganizationUsersPage />} />
             
            <Route path="/cloud-platforms" element={<CloudConnectPage />} />
           </Route>
            
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
