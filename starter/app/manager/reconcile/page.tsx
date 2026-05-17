"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReconcileItem = {
  asset_tag: string;
  reason: string;
};

type ReconcileReport = {
  timestamp: string;
  summary: {
    needs_review: number;
    likely_stale_data: number;
    expected_gap: number;
  };
  details: {
    needs_review: ReconcileItem[];
    likely_stale_data: ReconcileItem[];
    expected_gap: ReconcileItem[];
  };
};

export default function ManagerReconcilePage() {
  const [report, setReport] = useState<ReconcileReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 30000);

    const loadReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/reconcile", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to generate report: ${response.status}`);
        }

        const data = (await response.json()) as ReconcileReport;
        setReport(data);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          setError("Request timed out after 30 seconds.");
        } else {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to generate report"
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    void loadReport();

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return <div className="p-6">Generating report...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">Reconciliation Report</h1>
          <Link href="/manager" className="text-sm text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!report) {
    return <div className="p-6">No report data available.</div>;
  }

  const sections = [
    {
      key: "needs_review",
      title: "Needs Review",
      count: report.summary.needs_review,
      items: report.details.needs_review,
      className: "border-red-200 bg-red-50 text-red-900",
    },
    {
      key: "likely_stale_data",
      title: "Likely Stale Data",
      count: report.summary.likely_stale_data,
      items: report.details.likely_stale_data,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    },
    {
      key: "expected_gap",
      title: "Expected Gap",
      count: report.summary.expected_gap,
      items: report.details.expected_gap,
      className: "border-green-200 bg-green-50 text-green-900",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">Reconciliation Report</h1>
        <Link href="/manager" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>

      <p className="mb-6 text-sm text-gray-500">Generated at {new Date(report.timestamp).toLocaleString()}</p>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.key} className={`rounded border p-4 ${section.className}`}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <span className="text-sm font-medium">{section.count}</span>
            </div>
            {section.items.length > 0 ? (
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={`${section.key}-${item.asset_tag}`} className="rounded bg-white/70 p-3">
                    <div className="font-medium">{item.asset_tag}</div>
                    <div className="text-sm">{item.reason}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No items in this category.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
