"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Asset } from "@/lib/types";

const PAGE_SIZE = 30;

export default function ManagerPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchAssets = async (nextOffset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/upstream/assets?limit=${PAGE_SIZE}&offset=${nextOffset}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const pageAssets: Asset[] = await response.json();
      setAssets((currentAssets) =>
        append ? [...currentAssets, ...pageAssets] : pageAssets
      );
      setOffset(nextOffset + pageAssets.length);
      setHasMore(pageAssets.length === PAGE_SIZE);
    } catch (fetchError) {
      console.error("Manager page fetch failed:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchAssets(0, false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manager dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Loaded in pages of 30 assets.</p>
        </div>
        <Link href="/manager/reconcile" className="text-sm text-blue-600 hover:underline">
          Three-way reconciliation
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Failed to load assets</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : null}

      {loading && assets.length === 0 ? (
        <div className="flex items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-600">Loading assets...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Asset Tag</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">State</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Custodian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {assets.map((asset) => (
                <tr key={asset.asset_tag} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-700">
                    <Link href={`/manager/assets/${asset.asset_tag}`} className="hover:underline">
                      {asset.asset_tag}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asset.model}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asset.state.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asset.custodian ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => void fetchAssets(offset, true)}
          disabled={loading || loadingMore || !hasMore}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loadingMore ? "Loading..." : hasMore ? "Load more" : "No more assets"}
        </button>
        {loadingMore ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        ) : null}
      </div>
    </div>
  );
}
