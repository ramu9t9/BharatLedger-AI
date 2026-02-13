import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Plus, AlertTriangle, Download, ChevronDown } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { invoiceApi, businessApi, gstApi, GSTSummary, VendorGST, ITCSummary } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { TrendUp, Wallet, DocumentText, Receipt1, Element4, ArrowDown2, Calendar, ArrowRight, CloudChange, Chart, Money2, Building } from "iconsax-react";

// Month options for selector
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Dashboard() {
  const selectedBusiness = localStorage.getItem("selectedBusiness");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  
  const [year, month] = selectedMonth.split("-");

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAll,
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", selectedBusiness],
    queryFn: () => invoiceApi.getAll(selectedBusiness ? { business_id: selectedBusiness } : undefined),
  });

  const { data: gstSummary, isLoading: gstSummaryLoading } = useQuery<GSTSummary>({
    queryKey: ["gst-summary", selectedBusiness, selectedMonth],
    queryFn: () => selectedBusiness ? gstApi.getSummary(selectedBusiness, selectedMonth) : Promise.resolve({} as GSTSummary),
    enabled: !!selectedBusiness,
  });

  const { data: vendors, isLoading: vendorsLoading } = useQuery<VendorGST[]>({
    queryKey: ["gst-vendors", selectedBusiness, selectedMonth],
    queryFn: () => selectedBusiness ? gstApi.getVendors(selectedBusiness, selectedMonth) : Promise.resolve([]),
    enabled: !!selectedBusiness,
  });

  const { data: itcSummary, isLoading: itcLoading } = useQuery<ITCSummary>({
    queryKey: ["gst-itc", selectedBusiness, selectedMonth],
    queryFn: () => selectedBusiness ? gstApi.getITC(selectedBusiness, selectedMonth) : Promise.resolve({} as ITCSummary),
    enabled: !!selectedBusiness,
  });

  const exportCAPackMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBusiness) throw new Error("No business selected");
      return await gstApi.exportCAPack(selectedBusiness, selectedMonth);
    },
    onSuccess: (blob: Blob) => {
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CA_Pack_${selectedMonth}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "CA Pack downloaded successfully", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to download CA Pack", variant: "error" });
    },
  });

  const recentInvoices = invoices?.slice(0, 5) || [];
  
  // Top 5 vendors for chart
  const topVendors = useMemo(() => {
    if (!vendors || vendors.length === 0) return [];
    return [...vendors]
      .sort((a, b) => b.total_purchase - a.total_purchase)
      .slice(0, 5)
      .map(v => ({
        name: v.vendor_name.length > 15 ? v.vendor_name.substring(0, 15) + "..." : v.vendor_name,
        fullName: v.vendor_name,
        purchase: v.total_purchase,
        share: v.percentage_share,
      }));
  }, [vendors]);

  // Calculate if GST is high (threshold: ₹50,000)
  const isHighGST = (gstSummary?.net_gst_payable || 0) > 50000;
  
  // Calculate projected GST warning (mock - would need previous month data)
  const isGSTWarning = false; // Would compare with previous month

  const stats = {
    totalInvoices: invoices?.length || 0,
    processedInvoices: invoices?.filter(i => i.status === "EXTRACTED").length || 0,
    pendingInvoices: invoices?.filter(i => i.status === "PROCESSING" || i.status === "UPLOADED").length || 0,
    totalSales: gstSummary?.total_sales || 0,
    totalPurchases: gstSummary?.total_purchases || 0,
    outputGST: gstSummary?.output_gst || 0,
    inputGST: gstSummary?.input_gst || 0,
    netGSTPayable: gstSummary?.net_gst_payable || 0,
  };

  if (businessesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
        <div className="mx-auto max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Welcome to BharatLedger AI</h2>
            <p className="text-sm text-muted-foreground">
              Create your first business to start managing invoices and GST compliance
            </p>
          </div>
          <Button asChild size="lg" className="rounded-lg">
            <Link to="/businesses/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Business
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentMonthLabel = MONTHS.find(m => m.value === month)?.label || "";
  const currentYear = year;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Financial Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your business finances</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px] rounded-lg">
              <Calendar variant="Outline" className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={`${year}-${m.value}`}>
                  {m.label} {currentYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Export CA Pack Button */}
          <Button 
            variant="outline" 
            className="rounded-lg"
            onClick={() => exportCAPackMutation.mutate()}
            disabled={exportCAPackMutation.isPending || !selectedBusiness}
          >
            <ArrowDown2 variant="Outline" className="mr-2 h-4 w-4" />
            CA Pack
          </Button>
          
          <Button asChild className="shrink-0 rounded-lg">
            <Link to="/invoices/upload">
              <CloudChange variant="Outline" className="mr-2 h-4 w-4" />
              Upload Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* GST Warning Banner */}
      {isGSTWarning && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-700 dark:text-orange-400">
                Projected GST Liability Alert
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-500">
                Your net GST payable is 20% higher than last month. Review your input credits.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Row Cards - Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          description={`${currentMonthLabel} ${currentYear}`}
          icon={TrendUp}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Total Purchases"
          value={formatCurrency(stats.totalPurchases)}
          description={`${currentMonthLabel} ${currentYear}`}
          icon={Receipt1}
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="Output GST"
          value={formatCurrency(stats.outputGST)}
          description="Sales GST collected"
          icon={Wallet}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Input GST"
          value={formatCurrency(stats.inputGST)}
          description="Purchase GST paid"
          icon={Element4}
          className="border-l-4 border-l-purple-500"
        />
        <StatCard
          title="Net GST Payable"
          value={formatCurrency(stats.netGSTPayable)}
          description="After ITC adjustment"
          icon={Money2}
          className={isHighGST ? "border-l-4 border-l-red-500" : "border-l-4 border-l-green-500"}
        />
      </div>

      {/* Second Row - Charts & ITC */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vendor Dependency Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendor Dependency</CardTitle>
            <CardDescription>Top 5 vendors by purchase value</CardDescription>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : topVendors.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topVendors} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Purchase"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="purchase" radius={[0, 4, 4, 0]}>
                    {topVendors.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "#3b82f6" : index === 1 ? "#8b5cf6" : index === 2 ? "#06b6d4" : "#64748b"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No vendor data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* ITC Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>ITC Summary</CardTitle>
            <CardDescription>Input Tax Credit analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {itcLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total ITC Available</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(itcSummary?.total_itc || 0)}
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <p className="mb-2 text-sm font-medium">Risk Flagged Vendors</p>
                  {itcSummary?.risk_flagged_vendors && itcSummary.risk_flagged_vendors.length > 0 ? (
                    <div className="space-y-2">
                      {itcSummary.risk_flagged_vendors.map((vendor, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between rounded-lg bg-red-50 p-2 text-sm dark:bg-red-950/30"
                        >
                          <div>
                            <p className="font-medium text-red-700 dark:text-red-400">{vendor.vendor_name}</p>
                            <p className="text-xs text-red-600 dark:text-red-500">{vendor.issue}</p>
                          </div>
                          <span className="font-medium text-red-700 dark:text-red-400">
                            {formatCurrency(vendor.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No risk flags</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Recent Invoices & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/30">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest uploaded invoices</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/invoices">
                View all
                <ArrowRight variant="Outline" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <DocumentText variant="Bulk" className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">No invoices yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Upload your first invoice to get started</p>
                <Button variant="outline" className="mt-6 rounded-lg" asChild>
                  <Link to="/invoices/upload">Upload Invoice</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50 hover:border-border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/30">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 pt-4">
            <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
              <Link to="/invoices/upload">
                <CloudChange variant="Outline" className="mr-2 h-4 w-4" />
                Upload New Invoice
              </Link>
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
              <Link to="/invoices">
                <DocumentText variant="Outline" className="mr-2 h-4 w-4" />
                View All Invoices
              </Link>
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
              <Link to="/reports">
                <Chart variant="Outline" className="mr-2 h-4 w-4" />
                Generate Reports
              </Link>
            </Button>
            {selectedBusiness && (
              <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
                <Link to="/reports">
                  <Money2 variant="Outline" className="mr-2 h-4 w-4" />
                  GST Returns
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
