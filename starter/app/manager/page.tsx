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
  in_service: "border-green-200/90 bg-green-50 text-green-700",
  stored: "border-yellow-200/90 bg-yellow-50 text-yellow-700",
  received: "border-blue-200/90 bg-blue-50 text-blue-700",
  disposed: "border-slate-300 bg-slate-50 text-slate-600",
  rma_pending: "border-red-200/90 bg-red-50 text-red-700",
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
    <div className="space-y-6 p-7">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#0f1724] px-6 py-5 text-slate-100 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Manager operations</p>
          <h1 className="mt-2 text-3xl font-semibold">Asset Inventory</h1>
          <p className="mt-2 text-base text-slate-300">Data-dense asset view with live state tracking.</p>
        </div>
        <Link
          href="/manager/reconcile"
          className="inline-flex items-center justify-center rounded-xl border border-slate-500 bg-slate-800 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:bg-slate-700"
        >
          Three-way reconciliation
        </Link>
      </div>

      {error ? <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-900">{error}</div> : null}

      {loading && assets.length === 0 ? (
        <div className="flex items-center gap-3 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-lg text-slate-600">Loading assets...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <span className="inline-flex items-center gap-2">Asset Tag <span className="text-slate-400">↕</span></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <span className="inline-flex items-center gap-2">State <span className="text-slate-400">↕</span></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <span className="inline-flex items-center gap-2">Custodian <span className="text-slate-400">↕</span></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <span className="inline-flex items-center gap-2">Site <span className="text-slate-400">↕</span></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.asset_tag} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-blue-700 [font-family:var(--font-plex-mono)]">
                    <Link href={`/manager/assets/${asset.asset_tag}`} className="hover:text-blue-800 hover:underline">
                      {asset.asset_tag}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${stateBadgeClasses[asset.state] ?? "border-slate-300 bg-slate-50 text-slate-600"}`}
                    >
                      {formatStateLabel(asset.state)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{asset.custodian ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{asset.location?.site ?? "-"}</td>
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
          className="w-full rounded-xl bg-[#2563eb] px-5 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loadingMore ? "Loading..." : hasMore ? "Load More" : "No more assets"}
        </button>
      </div>
    </div>
  );
}