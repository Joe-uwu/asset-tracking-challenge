"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AssetRow = {
  asset_tag: string;
  state: string;
  custodian?: string | null;
  location?: {
    site?: string | null;
  } | null;
};

const PAGE_SIZE = 30;

export default function ManagerPage() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchAssets = async (nextOffset: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/upstream/assets?limit=${PAGE_SIZE}&offset=${nextOffset}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const pageAssets: AssetRow[] = await response.json();
      setAssets((currentAssets) =>
        append ? [...currentAssets, ...pageAssets] : pageAssets
      );
      setOffset(nextOffset + pageAssets.length);
      setHasMore(pageAssets.length === PAGE_SIZE);
    } catch (fetchError) {
      console.error("Failed to load assets:", fetchError);
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manager dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Showing 30 assets per page.</p>
        </div>
        <Link href="/manager/reconcile" className="text-sm text-blue-600 hover:underline">
          Three-way reconciliation
        </Link>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {loading && assets.length === 0 ? (
        <div className="flex items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">Loading assets...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Asset Tag</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">State</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Custodian</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((asset) => (
                <tr key={asset.asset_tag} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-blue-700">
                    <Link href={`/manager/assets/${asset.asset_tag}`} className="hover:underline">
                      {asset.asset_tag}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asset.state}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asset.custodian ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asset.location?.site ?? "-"}</td>
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
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loadingMore ? "Loading..." : hasMore ? "Load More" : "No more assets"}
        </button>
      </div>
    </div>
  );
}
