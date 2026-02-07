import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoices, type Invoice } from "../api/client";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoices.get(id!),
    enabled: !!id,
  });

  const processMutation = useMutation({
    mutationFn: () => invoices.process(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoice", id] }),
  });

  if (!id) return null;
  if (isLoading || !inv) return <p className="text-gray-500">Loading…</p>;

  const ext = (inv.extracted_json || {}) as Record<string, unknown>;
  const vendor = (ext.vendor as Record<string, string>) || {};
  const invoiceInfo = (ext.invoice as Record<string, string>) || {};
  const lineItems = (ext.line_items as Record<string, unknown>[]) || [];
  const totals = (ext.totals as Record<string, number>) || {};

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/invoices")}
        className="text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to list
      </button>
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-semibold">{inv.file_name || inv.id}</h1>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded text-sm bg-gray-100">{inv.status}</span>
          {inv.status === "UPLOADED" && (
            <button
              type="button"
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {processMutation.isPending ? "Processing…" : "Process"}
            </button>
          )}
        </div>
      </div>
      {inv.error_message && (
        <p className="text-red-600 text-sm mb-4">{inv.error_message}</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="font-medium mb-2">Vendor</h2>
          <p>{vendor.name || "—"}</p>
          <p className="text-sm text-gray-500">{vendor.gstin || ""}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="font-medium mb-2">Invoice</h2>
          <p>Number: {invoiceInfo.number || "—"}</p>
          <p>Date: {invoiceInfo.date || "—"}</p>
        </div>
      </div>
      {totals.grand_total != null && (
        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="font-medium mb-2">Totals</h2>
          <p>Taxable: {totals.taxable_value}</p>
          <p>GST: {totals.gst_total}</p>
          <p className="font-semibold">Grand total: {totals.grand_total}</p>
        </div>
      )}
      {lineItems.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <h2 className="px-4 py-3 border-b border-gray-200 font-medium">Line items</h2>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Description</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Qty</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Rate</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">GST %</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item: Record<string, unknown>, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-2">{String(item.description ?? "—")}</td>
                  <td className="px-4 py-2">{Number(item.qty ?? 0)}</td>
                  <td className="px-4 py-2">{Number(item.unit_price ?? 0)}</td>
                  <td className="px-4 py-2">{Number(item.gst_rate ?? 0)}%</td>
                  <td className="px-4 py-2">{Number(item.total ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
