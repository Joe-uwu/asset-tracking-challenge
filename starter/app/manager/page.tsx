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

const stateBadgeClasses: Record<string, string> = {
  in_service: "border-green-200 bg-green-100 text-green-800",
  stored: "border-yellow-200 bg-yellow-100 text-yellow-800",
  received: "border-blue-200 bg-blue-100 text-blue-800",
  disposed: "border-gray-200 bg-gray-100 text-gray-700",
  rma_pending: "border-red-200 bg-red-100 text-red-800",
};

const formatStateLabel = (state: string) => state.replace(/_/g, " ");

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
      const response = await fetch(`/api/upstream/assets?limit=${PAGE_SIZE}&offset=${nextOffset}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const pageAssets: AssetRow[] = await response.json();
      setAssets((currentAssets) => (append ? [...currentAssets, ...pageAssets] : pageAssets));
      setOffset(nextOffset + pageAssets.length);
      setHasMore(pageAssets.length === PAGE_SIZE);
    } catch (fetchError) {
      console.error("Failed to load assets:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "An unknown error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchAssets(0, false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Manager dashboard</h1>
          <p className="mt-2 text-lg text-slate-600">Showing 30 assets per page.</p>
        </div>
        <Link
          href="/manager/reconcile"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Three-way reconciliation
        </Link>
      </div>

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div> : null}

      {loading && assets.length === 0 ? (
        <div className="flex items-center gap-3 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-lg text-slate-600">Loading assets...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.15em] text-slate-600">Asset Tag</th>
                <th className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.15em] text-slate-600">State</th>
                <th className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.15em] text-slate-600">Custodian</th>
                <th className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.15em] text-slate-600">Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.asset_tag} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 text-sm font-semibold text-blue-700">
                    <Link href={`/manager/assets/${asset.asset_tag}`} className="hover:underline">
                      {asset.asset_tag}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${stateBadgeClasses[asset.state] ?? "border-slate-200 bg-slate-100 text-slate-700"}`}
                    >
                      {formatStateLabel(asset.state)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{asset.custodian ?? "-"}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{asset.location?.site ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <button
          onClick={() => void fetchAssets(offset, true)}
          disabled={loading || loadingMore || !hasMore}
          className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loadingMore ? "Loading..." : hasMore ? "Load More" : "No more assets"}
        </button>
      </div>
    </div>
  );
}