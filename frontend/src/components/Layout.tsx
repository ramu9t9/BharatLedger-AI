import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-6">
          <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
            Dashboard
          </Link>
          <Link to="/invoices" className="text-gray-700 hover:text-gray-900 font-medium">
            Invoices
          </Link>
          <Link to="/invoices/upload" className="text-gray-700 hover:text-gray-900 font-medium">
            Upload
          </Link>
          <Link to="/businesses/new" className="text-gray-700 hover:text-gray-900 font-medium">
            Add business
          </Link>
          <Link to="/reports" className="text-gray-700 hover:text-gray-900 font-medium">
            Reports
          </Link>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Logout
        </button>
      </nav>
      <main className="p-4 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
