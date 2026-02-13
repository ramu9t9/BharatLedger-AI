import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { businessApi } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Upload", href: "/invoices/upload", icon: Upload },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAll,
  });

  const [selectedBusiness, setSelectedBusiness] = useState<string>(
    () => localStorage.getItem("selectedBusiness") || ""
  );

  // Sync selectedBusiness when businesses load/update (e.g. after creating new business)
  useEffect(() => {
    const stored = localStorage.getItem("selectedBusiness");
    if (businesses && businesses.length > 0) {
      if (stored && businesses.some((b) => b.id === stored)) {
        setSelectedBusiness(stored);
      } else if (!stored || !businesses.some((b) => b.id === stored)) {
        const first = businesses[0].id;
        setSelectedBusiness(first);
        localStorage.setItem("selectedBusiness", first);
      }
    }
  }, [businesses]);

  const handleBusinessChange = (businessId: string) => {
    setSelectedBusiness(businessId);
    localStorage.setItem("selectedBusiness", businessId);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentBusiness = businesses?.find((b) => b.id === selectedBusiness);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Application Shell pattern */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 transform border-r border-border/60 bg-card shadow-card transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">BharatLedger</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-border/60 px-4 py-4">
          {isLoading ? (
            <Skeleton className="h-11 w-full rounded-lg" />
          ) : businesses && businesses.length > 0 ? (
            <Select value={selectedBusiness} onValueChange={handleBusinessChange}>
              <SelectTrigger className="h-11 w-full rounded-lg border-border/80 bg-muted/50">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/businesses/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Business
            </Button>
          )}
        </div>

        <nav className="space-y-0.5 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Main
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "" : "opacity-70")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {currentBusiness && (
              <div className="hidden items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 lg:flex">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-sm">{currentBusiness.name}</span>
                {currentBusiness.gstin && (
                  <span className="text-xs text-muted-foreground">{currentBusiness.gstin}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
