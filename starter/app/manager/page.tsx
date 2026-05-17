"use client";

import Link from "next/link";
import { useApiData } from "@/lib/swr";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Asset } from "@/lib/types";

type ReconciliationData = {
  timestamp: string;
  summary: {
    in_sync: number;
    missing_from_finance: number;
    missing_from_facilities: number;
    only_in_operations: number;
    only_in_facilities: number;
    only_in_finance: number;
  };
  details: {
    in_sync: Array<{ asset_tag: string }>;
    missing_from_finance: Array<{ asset_tag: string }>;
    missing_from_facilities: Array<{ asset_tag: string }>;
    only_in_operations: Array<{ asset_tag: string }>;
    only_in_facilities: Array<{ asset_tag: string }>;
    only_in_finance: Array<{ asset_tag: string }>;
  };
};

export default function ManagerLandingPage() {
  const { data: reconciliation, isLoading, error } = useApiData<ReconciliationData>(
    "/api/reconcile"
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse initial filters and page from URL
  const [filters, setFilters] = useState<{
    state?: string;
    site?: string;
    custodian?: string;
    page: number;
  }>({
    state: searchParams.get("state") || undefined,
    site: searchParams.get("site") || undefined,
    custodian: searchParams.get("custodian") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
  });

  const limit = 30;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.state) params.set("state", filters.state);
    if (filters.site) params.set("site", filters.site);
    if (filters.custodian) params.set("custodian", filters.custodian);
    params.set("page", filters.page.toString());
    const newPath = `${window.location.pathname}?${params.toString()}`;
    router.push(newPath);
  }, [filters.state, filters.site, filters.custodian, filters.page, router]);

  // Fetch assets with filters (all matching assets) and then paginate client-side
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoadingAssets(true);
      try {
        const queryParams = new URLSearchParams({
          state: filters.state ?? "",
          site: filters.site ?? "",
          custodian: filters.custodian ?? "",
        });

        const response = await fetch(`/api/upstream/assets?${queryParams}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch assets: ${response.status}`);
        }

        const allAssets: Asset[] = await response.json();
        setTotalAssets(allAssets.length);
        setTotalPages(Math.ceil(allAssets.length / limit));

        // Slice for current page
        const startIndex = (filters.page - 1) * limit;
        const endIndex = startIndex + limit;
        setAssets(allAssets.slice(startIndex, endIndex));
      } catch (error) {
        console.error("Error fetching assets:", error);
        // In a real app, we might want to show an error state
      } finally {
        setIsLoadingAssets(false);
      }
    };

    if (reconciliation) {
      fetchAssets();
    }
  }, [reconciliation, filters.state, filters.site, filters.custodian, filters.page, limit]);

  // Helper functions for pagination
  const prevPage = () => {
    if (filters.page > 1) {
      setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const nextPage = () => {
    if (filters.page < totalPages) {
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Manager dashboard</h1>
          <Link
            href="/manager/reconcile"
            className="text-sm text-blue-600 hover:underline"
          >
            Three-way reconciliation
          </Link>
        </div>
        <div className="flex items-center space-x-3 py-8">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Manager dashboard</h1>
          <Link
            href="/manager/reconcile"
            className="text-sm text-blue-600 hover:underline"
          >
            Three-way reconciliation
          </Link>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800 font-medium">Error loading dashboard</p>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => {
              // Trigger refetch
              // Note: SWR automatically retries, but we can trigger a refetch by changing the key if needed
              // We'll just rely on SWR's retry mechanism for now.
            }}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reconciliation) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Manager dashboard</h1>
          <Link
            href="/manager/reconcile"
            className="text-sm text-blue-600 hover:underline"
          >
            Three-way reconciliation
          </Link>
        </div>
        <p className="text-center py-8 text-gray-500">
          No data available
        </p>
      </div>
    );
  }

  // Calculate KPIs for the executive snapshot
  const totalActiveDrift =
    reconciliation.summary.missing_from_finance +
    reconciliation.summary.missing_from_facilities;
  const missingCapitalization = reconciliation.summary.missing_from_finance;
  const phantomItems = reconciliation.summary.only_in_facilities;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">Manager dashboard</h1>
        <Link
          href="/manager/reconcile"
          className="text-sm text-blue-600 hover:underline"
        >
          Three-way reconciliation
        </Link>
      </div>

      {/* Executive Anomaly Snapshot */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Executive Anomaly Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800">Total Active Drift</h3>
            <p className="text-3xl font-bold text-red-600">{totalActiveDrift}</p>
            <p className="text-sm text-gray-500">
              Assets missing from Finance or Facilities
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800">Missing Capitalization</h3>
            <p className="text-3xl font-bold text-amber-600">{missingCapitalization}</p>
            <p className="text-sm text-gray-500">
              Assets needing ERP financial synchronization
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800">Phantom Items in Facilities</h3>
            <p className="text-3xl font-bold text-teal-600">{phantomItems}</p>
            <p className="text-sm text-gray-500">
              Assets in Facilities but not in Operations
            </p>
          </div>
        </div>
      </div>

      {/* Asset List with Pagination and Filters */}
      <div className="mb-6">
        {/* Filter Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <select
              value={filters.state ?? ""}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  state: e.target.value || undefined,
                  page: 1, // Reset to first page when filter changes
                }));
              }}
              className="border rounded px-3 py-2 w-48"
            >
              <option value="">All States</option>
              <option value="received">Received</option>
              <option value="stored">Stored</option>
              <option value="in_service">In Service</option>
              <option value="rma_pending">RMA Pending</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Site</label>
            <input
              type="text"
              value={filters.site ?? ""}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  site: e.target.value || undefined,
                  page: 1,
                }));
              }}
              placeholder="Filter by site"
              className="border rounded px-3 py-2 w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custodian</label>
            <input
              type="text"
              value={filters.custodian ?? ""}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  custodian: e.target.value || undefined,
                  page: 1,
                }));
              }}
              placeholder="Filter by custodian"
              className="border rounded px-3 py-2 w-48"
            />
          </div>
        </div>

        {/* Asset List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Asset List ({totalAssets} assets)
          </h2>

          {isLoadingAssets ? (
            <div className="flex items-center space-x-3 py-8">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading assets...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No assets found matching the current filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <Link
                  key={asset.asset_tag}
                  href={`/manager/assets/${asset.asset_tag}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{asset.asset_tag}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {asset.model} by {asset.manufacturer}
                      </p>
                      <p className="text-sm text-gray-500">
                        {asset.state.replace("_", " ")} • {asset.location.site}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {asset.custodian}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {filters.page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={filters.page === 1}
                  className={`px-3 py-1 rounded ${
                    filters.page === 1
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={filters.page === totalPages}
                  className={`px-3 py-1 rounded ${
                    filters.page === totalPages
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}