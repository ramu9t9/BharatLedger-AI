import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Loader2, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { JsonViewer } from "@/components/JsonViewer";
import { StatusBadge } from "@/components/StatusBadge";
import { invoiceApi } from "@/api/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: !!id,
  });

  const processMutation = useMutation({
    mutationFn: () => invoiceApi.process(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast({ title: "Invoice processing started", variant: "success" });
    },
    onError: () => {
      toast({ title: "Processing failed", variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted", variant: "success" });
      navigate("/invoices");
    },
    onError: () => {
      toast({ title: "Failed to delete invoice", variant: "error" });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Delete this invoice? The file will be removed and this cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Invoice not found</h3>
        <Button className="mt-4" onClick={() => navigate("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const extractedData = invoice.extracted_json as Record<string, unknown> | undefined;
  const vendor = extractedData?.vendor as Record<string, string> | undefined;
  const invoiceInfo = extractedData?.invoice as Record<string, string> | undefined;
  const lineItems = extractedData?.line_items as Array<Record<string, unknown>> | undefined;
  const totals = extractedData?.totals as Record<string, number> | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.file_name}</h1>
            <p className="text-muted-foreground">
              Uploaded {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          {(invoice.status === "FAILED" || invoice.status === "NEEDS_REVIEW") && (
            <Button
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reprocess
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {invoice.status === "FAILED" && invoice.error_message && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">{invoice.error_message}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="line-items">Line Items</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{vendor?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GSTIN</span>
                  <span className="font-medium">{vendor?.gstin || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium">{vendor?.address || "-"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number</span>
                  <span className="font-medium">{invoiceInfo?.number || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{invoiceInfo?.date || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{invoiceInfo?.currency || "INR"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taxable Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totals?.taxable_value || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">GST Total</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totals?.gst_total || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totals?.grand_total || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="line-items">
          <Card>
            <CardContent className="p-0">
              {lineItems && lineItems.length > 0 ? (
                <div className="divide-y">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.description as string}</p>
                        <p className="text-sm text-muted-foreground">
                          HSN: {item.hsn_sac as string} | Qty: {item.qty as number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(item.taxable_value as number)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          GST @ {item.gst_rate as number}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No line items extracted yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardContent className="pt-6">
              <JsonViewer data={invoice.extracted_json || {}} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
