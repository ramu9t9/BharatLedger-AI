import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { businesses, invoices } from "../api/client";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [businessId, setBusinessId] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: bizList, isLoading: bizLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => businesses.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file || !businessId) throw new Error("Select business and file");
      return invoices.upload(businessId, file);
    },
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate(`/invoices/${inv.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Upload invoice</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          >
            <option value="">Select business</option>
            {bizList?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {bizLoading && <p className="text-sm text-gray-500 mt-1">Loading businesses…</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File (image or PDF)</label>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        {uploadMutation.error && (
          <p className="text-sm text-red-600">{uploadMutation.error.message}</p>
        )}
        <button
          type="submit"
          disabled={!file || !businessId || uploadMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploadMutation.isPending ? "Uploading & processing…" : "Upload"}
        </button>
      </form>
      {!bizList?.length && !bizLoading && (
        <p className="mt-4 text-sm text-gray-600">
          <Link to="/businesses/new" className="text-blue-600 hover:underline">Create a business</Link> first to upload invoices.
        </p>
      )}
    </div>
  );
}
