import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { invoices } from "../api/client";

export default function Dashboard() {
  const { data: invoiceList, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoices.list(),
  });

  const count = invoiceList?.length ?? 0;
  const recent = invoiceList?.slice(0, 5) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total invoices</p>
          <p className="text-2xl font-semibold">{isLoading ? "…" : count}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <Link to="/invoices/upload" className="text-blue-600 hover:underline font-medium">
            Upload invoice
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-200 font-medium">Recent invoices</h2>
        {isLoading ? (
          <p className="p-4 text-gray-500">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="p-4 text-gray-500">No invoices yet. Upload one to get started.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recent.map((inv) => (
              <li key={inv.id}>
                <Link
                  to={`/invoices/${inv.id}`}
                  className="block px-4 py-3 hover:bg-gray-50 flex justify-between"
                >
                  <span>{inv.file_name || inv.id}</span>
                  <span className="text-sm text-gray-500">{inv.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
