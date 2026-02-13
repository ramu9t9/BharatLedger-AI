import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { invoiceApi, businessApi } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { SearchNormal, Add, Trash, DocumentText, Filter } from "iconsax-react";

export default function InvoiceList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const selectedBusiness = localStorage.getItem("selectedBusiness");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", selectedBusiness],
    queryFn: () => invoiceApi.getAll(selectedBusiness ? { business_id: selectedBusiness } : undefined),
  });

  // Filter invoices
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = !searchQuery || 
      invoice.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const deleteMutation = useMutation({
    mutationFn: (invoiceId: string) => invoiceApi.delete(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to delete invoice", variant: "error" });
    },
  });

  const handleDelete = (e: React.MouseEvent, invoiceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this invoice? This cannot be undone.")) {
      deleteMutation.mutate(invoiceId);
    }
  };

  const statusCounts = {
    all: invoices?.length || 0,
    UPLOADED: invoices?.filter(i => i.status === "UPLOADED").length || 0,
    PROCESSING: invoices?.filter(i => i.status === "PROCESSING").length || 0,
    EXTRACTED: invoices?.filter(i => i.status === "EXTRACTED").length || 0,
    NEEDS_REVIEW: invoices?.filter(i => i.status === "NEEDS_REVIEW").length || 0,
    FAILED: invoices?.filter(i => i.status === "FAILED").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and view your uploaded invoices</p>
        </div>
        <Button asChild>
          <Link to="/invoices/upload">
            <Add variant="Outline" className="mr-2 h-4 w-4" />
            Upload Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <SearchNormal variant="Outline" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter variant="Outline" className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="UPLOADED">Uploaded</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="EXTRACTED">Extracted</SelectItem>
              <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {(["all", "UPLOADED", "PROCESSING", "EXTRACTED", "NEEDS_REVIEW", "FAILED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              statusFilter === status
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts[status]}</p>
            <p className="text-xs text-muted-foreground">
              {status === "all" ? "Total" : status.replace("_", " ")}
            </p>
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                <DocumentText variant="Bulk" className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">No invoices found</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters to find what you're looking for"
                  : "Upload your first invoice to start extracting data and managing GST"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button className="mt-6 rounded-lg" asChild>
                  <Link to="/invoices/upload">Upload Invoice</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 group"
                >
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="flex flex-1 min-w-0 items-center gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <DocumentText variant="Bulk" className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{invoice.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.created_at)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={invoice.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, invoice.id)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete invoice"
                    >
                      <Trash variant="Outline" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
