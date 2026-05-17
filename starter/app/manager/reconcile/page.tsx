"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
 
export default function ManagerReconcilePage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    fetchReport();
  }, []);
 
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reconcile");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error("Failed to fetch reconciliation report:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };
 
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Reconciliation Report</h1>
          <Link
            href="/manager"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
        <div className="flex items-center space-x-3 py-8">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Generating report...</span>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Reconciliation Report</h1>
          <Link
            href="/manager"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800 font-medium">Error loading report</p>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchReport();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
 
  if (!report) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Reconciliation Report</h1>
          <Link
            href="/manager"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
        <p className="text-center py-8 text-gray-500">
          No report data available
        </p>
      </div>
    );
  }
 
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
 
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "needs_review": return "⚠️";
      case "likely_stale_data": return "🔄";
      case "expected_gap": return "✅";
      default: return "ℹ️";
    }
  };
 
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "needs_review": return "Needs Review";
      case "likely_stale_data": return "Likely Stale Data";
      case "expected_gap": return "Expected Gap";
      default: return category;
    }
  };
 
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">Three-Way Reconciliation Report</h1>
        <Link
          href="/manager"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
 
      {/* Executive Summary */}
      <div className="mb-6 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Reconciliation Summary</h2>
        <p className="text-sm text-gray-600 mb-2">
          Generated at: {formatDate(report.timestamp)}
        </p>
        <div className="grid grid-cols-1 gap-4">
          {/* Needs Review - Show FIRST */}
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <h3 className="font-semibold text-red-800 flex items-center">
              {getCategoryIcon("needs_review")} <span className="ml-2">{getCategoryLabel("needs_review")}</span>
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {report.summary.needs_review} items require human investigation
            </p>
            <p className="text-xs text-red-500 mt-1">
              Systems genuinely disagree - needs manual resolution
            </p>
          </div>
 
          {/* Likely Stale Data */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
            <h3 className="font-semibold text-yellow-800 flex items-center">
              {getCategoryIcon("likely_stale_data")} <span className="ml-2">{getCategoryLabel("likely_stale_data")}</span>
            </h3>
            <p className="text-sm text-yellow-600 mt-1">
              {report.summary.likely_stale_data} items likely due to sync lag
            </p>
            <p className="text-xs text-yellow-500 mt-1">
              Recent changes not yet propagated across all systems
            </p>
          </div>
 
          {/* Expected Gap */}
          <div className="p-4 bg-green-50 border-l-4 border-green-500">
            <h3 className="font-semibold text-green-800 flex items-center">
              {getCategoryIcon("expected_gap")} <span className="ml-2">{getCategoryLabel("expected_gap")}</span>
            </h3>
            <p className="text-sm text-green-600 mt-1">
              {report.summary.expected_gap} items - normal behavior
            </p>
            <p className="text-xs text-green-500 mt-1">
              Differences explained by asset lifecycle state
            </p>
          </div>
        </div>
      </div>
 
      {/* Needs Review Detail */}
      {report.details.needs_review.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {getCategoryIcon("needs_review")} {getCategoryLabel("needs_review")} ({report.details.needs_review.length})
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Systems genuinely disagree in a way requiring human resolution
          </p>
          <div className="space-y-2">
            {report.details.needs_review.slice(0, 3).map((item: any) => (
              <div key={item.asset_tag} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{item.asset_tag}</div>
                  <span className="text-xs text-red-600">Needs Review</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {item.reason}
                  {item.operations && (
                    <>
                      <br />
                      State: {item.operations.state.replace("_", " ")} |
                      Location: {item.operations.location.site} {item.operations.location.rack ? `-${item.operations.location.rack}` : ""} {item.operations.location.ru ? `RU${item.operations.location.ru}` : ""} |
                      Custodian: {item.operations.custodian}
                    </>
                  )}
                </p>
              </div>
            ))}
            {report.details.needs_review.length > 3 && (
              <p className="mt-2 text-sm text-gray-500 text-center italic">
                and {report.details.needs_review.length - 3} more...
              </p>
            )}
          </div>
        </div>
      )}
 
      {/* Likely Stale Data Detail */}
      {report.details.likely_stale_data.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {getCategoryIcon("likely_stale_data")} {getCategoryLabel("likely_stale_data")} ({report.details.likely_stale_data.length})
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Differences likely due to synchronization lag, not real problems
          </p>
          <div className="space-y-2">
            {report.details.likely_stale_data.slice(0, 3).map((item: any) => (
              <div key={item.asset_tag} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{item.asset_tag}</div>
                  <span className="text-xs text-yellow-600">Likely Stale Data</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {item.reason}
                  {item.operations && (
                    <>
                      <br />
                      State: {item.operations.state.replace("_", " ")} |
                      Location: {item.operations.location.site} {item.operations.location.rack ? `-${item.operations.location.rack}` : ""} {item.operations.location.ru ? `RU${item.operations.location.ru}` : ""} |
                      Custodian: {item.operations.custodian}
                    </>
                  )}
                </p>
              </div>
            ))}
            {report.details.likely_stale_data.length > 3 && (
              <p className="mt-2 text-sm text-gray-500 text-center italic">
                and {report.details.likely_stale_data.length - 3} more...
              </p>
            )}
          </div>
        </div>
      )}
 
      {/* Expected Gap Detail */}
      {report.details.expected_gap.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {getCategoryIcon("expected_gap")} {getCategoryLabel("expected_gap")} ({report.details.expected_gap.length})
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Differences explained by normal asset lifecycle behavior
          </p>
          <div className="space-y-2">
            {report.details.expected_gap.slice(0, 3).map((item: any) => (
              <div key={item.asset_tag} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{item.asset_tag}</div>
                  <span className="text-xs text-green-600">Expected Gap</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {item.reason}
                  {item.operations && (
                    <>
                      <br />
                      State: {item.operations.state.replace("_", " ")} |
                      Location: {item.operations.location.site} {item.operations.location.rack ? `-${item.operations.location.rack}` : ""} {item.operations.location.ru ? `RU${item.operations.location.ru}` : ""} |
                      Custodian: {item.operations.custodian}
                    </>
                  )}
                </p>
              </div>
            ))}
            {report.details.expected_gap.length > 3 && (
              <p className="mt-2 text-sm text-gray-500 text-center italic">
                and {report.details.expected_gap.length - 3} more...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}