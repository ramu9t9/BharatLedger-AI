import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businesses } from "../api/client";

export default function CreateBusiness() {
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: () => businesses.create({ name, gstin: gstin || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      navigate("/invoices/upload");
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Add business</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (optional)</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="e.g. 29AABCU9603R1ZM"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}
