import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Loader2, FileText, Trash2, Save, Pencil, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { JsonViewer } from "@/components/JsonViewer";
import { StatusBadge } from "@/components/StatusBadge";
import { invoiceApi, InvoiceLineItem } from "@/api/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

const GST_RATES = [0, 5, 12, 18, 28];

interface EditableLineItem extends InvoiceLineItem {
  isEditing?: boolean;
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: !!id,
  });

  // Initialize line items when invoice loads
  useState(() => {
    if (invoice?.extracted_json) {
      const extractedData = invoice.extracted_json as Record<string, unknown>;
      const items = extractedData?.line_items as Array<Record<string, unknown>> | undefined;
      if (items) {
        setLineItems(items.map((item, idx) => ({
          id: `item-${idx}`,
          description: item.description as string || "",
          hsn_sac: item.hsn_sac as string || "",
          gst_rate: item.gst_rate as number || 0,
          qty: item.qty as number || 1,
          rate: item.rate as number || 0,
          taxable_value: item.taxable_value as number || 0,
          cgst: item.cgst as number,
          sgst: item.sgst as number,
          igst: item.igst as number,
          total: item.total as number,
          isEditing: false,
        })));
      }
    }
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

  const updateLineItemsMutation = useMutation({
    mutationFn: () => invoiceApi.updateLineItem(id!, lineItems.map(({ isEditing, ...item }) => item)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      setHasChanges(false);
      toast({ title: "Line items saved", description: "Invoice marked as corrected", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to save line items", variant: "error" });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Delete this invoice? The file will be removed and this cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index] };
    
    if (field === "gst_rate" || field === "qty" || field === "rate") {
      item[field] = Number(value);
      // Recalculate taxable value
      if (field === "qty" || field === "rate") {
        item.taxable_value = item.qty * item.rate;
      }
      // Recalculate GST
      const gstAmount = (item.taxable_value * item.gst_rate) / 100;
      item.cgst = gstAmount / 2;
      item.sgst = gstAmount / 2;
      item.igst = gstAmount;
      item.total = item.taxable_value + gstAmount;
    } else {
      (item as Record<string, unknown>)[field] = value;
    }
    
    newItems[index] = item;
    setLineItems(newItems);
    setHasChanges(true);
  };

  const handleSaveLineItems = () => {
    updateLineItemsMutation.mutate();
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
  const dbLineItems = extractedData?.line_items as Array<Record<string, unknown>> | undefined;
  const totals = extractedData?.totals as Record<string, number> | undefined;

  // Use state lineItems if available, otherwise use from extracted_json
  const displayLineItems = lineItems.length > 0 ? lineItems : (dbLineItems?.map((item, idx) => ({
    id: `item-${idx}`,
    description: item.description as string || "",
    hsn_sac: item.hsn_sac as string || "",
    gst_rate: item.gst_rate as number || 0,
    qty: item.qty as number || 1,
    rate: item.rate as number || 0,
    taxable_value: item.taxable_value as number || 0,
    cgst: item.cgst as number,
    sgst: item.sgst as number,
    igst: item.igst as number,
    total: item.total as number,
    isEditing: false,
  })) || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{invoice.file_name}</h1>
              {invoice.is_corrected && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Corrected
                </span>
              )}
            </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              {hasChanges && (
                <Button 
                  onClick={handleSaveLineItems} 
                  disabled={updateLineItemsMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updateLineItemsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {displayLineItems.length > 0 ? (
                <div className="divide-y">
                  {displayLineItems.map((item, index) => (
                    <div key={item.id || index} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                            placeholder="Description"
                            className="font-medium"
                          />
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">HSN/SAC</Label>
                              <Input
                                value={item.hsn_sac}
                                onChange={(e) => handleLineItemChange(index, "hsn_sac", e.target.value)}
                                placeholder="HSN Code"
                              />
                            </div>
                            <div className="w-24">
                              <Label className="text-xs text-muted-foreground">GST Rate %</Label>
                              <Select
                                value={String(item.gst_rate)}
                                onValueChange={(value) => handleLineItemChange(index, "gst_rate", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {GST_RATES.map((rate) => (
                                    <SelectItem key={rate} value={String(rate)}>
                                      {rate}%
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="w-32 space-y-2 text-right">
                          <div>
                            <Label className="text-xs text-muted-foreground">Rate</Label>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleLineItemChange(index, "rate", e.target.value)}
                              className="text-right"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Qty</Label>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleLineItemChange(index, "qty", e.target.value)}
                              className="text-right"
                            />
                          </div>
                          <div className="font-medium">
                            {formatCurrency(item.taxable_value || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            GST: {formatCurrency(((item.taxable_value || 0) * (item.gst_rate || 0)) / 100)}
                          </div>
                        </div>
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
