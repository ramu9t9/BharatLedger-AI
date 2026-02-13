import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropzone } from "@/components/FileDropzone";
import { StatusBadge } from "@/components/StatusBadge";
import { invoiceApi, businessApi } from "@/api/client";
import { toast } from "@/components/ui/toast";

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedBusiness = searchParams.get("business_id");
  
  const [selectedBusiness, setSelectedBusiness] = useState(preselectedBusiness || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    status: "success" | "error";
    invoiceId?: string;
    message: string;
  } | null>(null);

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.getAll,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ businessId, file }: { businessId: string; file: File }) => {
      const result = await invoiceApi.upload(businessId, file);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setUploadResult({
        status: "success",
        invoiceId: data.id,
        message: "Invoice uploaded and processing started",
      });
      toast({ title: "Invoice uploaded successfully", variant: "success" });
    },
    onError: (error) => {
      setUploadResult({
        status: "error",
        message: error instanceof Error ? error.message : "Upload failed",
      });
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedBusiness) return;

    uploadMutation.mutate({ businessId: selectedBusiness, file: selectedFile });
  }, [selectedFile, selectedBusiness, uploadMutation]);

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
  };

  // Auto-select first business if none selected
  useEffect(() => {
    if (!selectedBusiness && businesses && businesses.length > 0) {
      setSelectedBusiness(businesses[0].id);
    }
  }, [businesses, selectedBusiness]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Invoice</h1>
        <p className="text-muted-foreground">Upload an invoice to extract data with AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Business</CardTitle>
          <CardDescription>Choose which business this invoice belongs to</CardDescription>
        </CardHeader>
        <CardContent>
          {businessesLoading ? (
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          ) : businesses && businesses.length > 0 ? (
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger>
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name} {business.gstin && `(${business.gstin})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No businesses found</p>
              <Button variant="outline" className="mt-2" onClick={() => navigate("/businesses/new")}>
                Create Business
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice</CardTitle>
          <CardDescription>Supported formats: PDF, PNG, JPG (max 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <FileDropzone
            onFileSelect={handleFileSelect}
            isUploading={uploadMutation.isPending}
          />
        </CardContent>
      </Card>

      {selectedFile && selectedBusiness && (
        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="flex-1"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload & Process"
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={uploadMutation.isPending}>
            Reset
          </Button>
        </div>
      )}

      {uploadResult && (
        <Card className={uploadResult.status === "success" ? "border-green-500" : "border-red-500"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {uploadResult.status === "success" ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">{uploadResult.message}</p>
                {uploadResult.invoiceId && (
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => navigate(`/invoices/${uploadResult.invoiceId}`)}
                  >
                    View Invoice →
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
