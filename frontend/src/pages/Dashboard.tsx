import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, DollarSign, Clock, TrendingUp, Upload, ArrowRight, Building2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { invoiceApi, businessApi, gstApi } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Dashboard() {
  const selectedBusiness = localStorage.getItem("selectedBusiness");

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", selectedBusiness],
    queryFn: () => invoiceApi.getAll(selectedBusiness ? { business_id: selectedBusiness } : undefined),
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAll,
  });

  const { data: liability } = useQuery({
    queryKey: ["gst-liability", selectedBusiness],
    queryFn: () => selectedBusiness ? gstApi.getLiability(selectedBusiness) : null,
    enabled: !!selectedBusiness,
  });

  const recentInvoices = invoices?.slice(0, 5) || [];
  
  const stats = {
    totalInvoices: invoices?.length || 0,
    processedInvoices: invoices?.filter(i => i.status === "EXTRACTED").length || 0,
    pendingInvoices: invoices?.filter(i => i.status === "PROCESSING" || i.status === "UPLOADED").length || 0,
    gstPayable: liability?.tax_payable || 0,
  };

  if (businessesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your business finances</p>
        </div>
        <Button asChild className="shrink-0 rounded-lg">
          <Link to="/invoices/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          description="All time"
          icon={FileText}
        />
        <StatCard
          title="Processed"
          value={stats.processedInvoices}
          description="Successfully extracted"
          icon={TrendingUp}
        />
        <StatCard
          title="Pending"
          value={stats.pendingInvoices}
          description="Awaiting processing"
          icon={Clock}
        />
        <StatCard
          title="GST Payable"
          value={formatCurrency(stats.gstPayable)}
          description="This period"
          icon={DollarSign}
        />
      </div>

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
                <ArrowRight className="ml-2 h-4 w-4" />
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
                  <FileText className="h-7 w-7 text-muted-foreground" />
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
                <Upload className="mr-2 h-4 w-4" />
                Upload New Invoice
              </Link>
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
              <Link to="/invoices">
                <FileText className="mr-2 h-4 w-4" />
                View All Invoices
              </Link>
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
              <Link to="/reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate Reports
              </Link>
            </Button>
            {selectedBusiness && (
              <Button variant="outline" className="h-12 justify-start rounded-lg" asChild>
                <Link to="/reports">
                  <DollarSign className="mr-2 h-4 w-4" />
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
