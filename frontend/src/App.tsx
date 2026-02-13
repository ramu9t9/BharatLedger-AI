import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import InvoiceList from "./pages/InvoiceList";
import InvoiceDetail from "./pages/InvoiceDetail";
import Upload from "./pages/Upload";
import CreateBusiness from "./pages/CreateBusiness";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/upload" element={<Upload />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="businesses/new" element={<CreateBusiness />} />
        <Route path="reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="upload" element={<Navigate to="/invoices/upload" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
