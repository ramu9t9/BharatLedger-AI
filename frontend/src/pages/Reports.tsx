import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reports, gst, businesses } from "../api/client";

export default function Reports() {
  const [businessId, setBusinessId] = useState("");
  const { data: bizList } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => businesses.list(),
  });

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ["reports", "pl", businessId],
    queryFn: () => reports.pl(businessId || undefined),
  });

  const { data: liability, isLoading: liabLoading } = useQuery({
    queryKey: ["gst", "liability", businessId],
    queryFn: () => gst.liability(businessId),
    enabled: !!businessId,
  });

  const downloadJson = (name: string, data: object) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadGstr1 = async () => {
    if (!businessId) return;
    const data = await gst.prepareGstr1(businessId);
    downloadJson("gstr1.json", data);
  };

  const handleDownloadGstr3b = async () => {
    if (!businessId) return;
    const data = await gst.prepareGstr3b(businessId);
    downloadJson("gstr3b.json", data);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
        <select
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All</option>
          {bizList?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="font-medium mb-2">P&L</h2>
          {plLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : pl && !("error" in pl) ? (
            <div>
              <p>Total expenses: {pl.total_expenses}</p>
              <p>Net: {pl.net}</p>
            </div>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="font-medium mb-2">GST liability</h2>
          {!businessId ? (
            <p className="text-gray-500">Select a business</p>
          ) : liabLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : liability && !("error" in liability) ? (
            <div>
              <p>Output tax: {liability.output_tax}</p>
              <p>ITC: {liability.itc}</p>
              <p className="font-medium">Tax payable: {liability.tax_payable}</p>
            </div>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="font-medium mb-2">Download GST returns (JSON)</h2>
        <p className="text-sm text-gray-500 mb-2">Select a business above, then download.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownloadGstr1}
            disabled={!businessId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Download GSTR-1 JSON
          </button>
          <button
            type="button"
            onClick={handleDownloadGstr3b}
            disabled={!businessId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Download GSTR-3B JSON
          </button>
        </div>
      </div>
    </div>
  );
}
