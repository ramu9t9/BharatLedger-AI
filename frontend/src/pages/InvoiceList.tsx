import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { invoices } from "../api/client";

export default function InvoiceList() {
  const { data: list, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoices.list(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          to="/invoices/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload
        </Link>
      </div>
      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : !list?.length ? (
        <p className="text-gray-500">No invoices. Upload one to get started.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">File</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                      {inv.file_name || inv.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
