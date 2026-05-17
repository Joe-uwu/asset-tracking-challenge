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
    return <div className="p-7 text-sm text-slate-600">Generating report...</div>;
  }

  if (error) {
    return (
      <div className="space-y-5 p-7">
        <div className="flex items-start justify-between gap-4 rounded-xl bg-[#0f1724] px-6 py-5 text-slate-100">
          <h1 className="text-2xl font-semibold">Reconciliation Report</h1>
          <Link href="/manager" className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 hover:bg-slate-700">
            Back to dashboard
          </Link>
        </div>
        <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-900">
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
      color: "#ef4444",
      toneClassName: "border-red-200 bg-red-50 text-red-950",
    },
    {
      key: "likely_stale_data",
      title: "Likely Stale Data",
      count: report.summary.likely_stale_data,
      items: report.details.likely_stale_data,
      color: "#eab308",
      toneClassName: "border-yellow-200 bg-yellow-50 text-yellow-950",
    },
    {
      key: "expected_gap",
      title: "Expected Gap",
      count: report.summary.expected_gap,
      items: report.details.expected_gap,
      color: "#22c55e",
      toneClassName: "border-green-200 bg-green-50 text-green-950",
    },
  ];

  const totalItems = sections.reduce((sum, section) => sum + section.count, 0);
  const chartRadius = 42;
  const chartCircumference = 2 * Math.PI * chartRadius;
  let chartOffset = 0;

  return (
    <div className="space-y-6 p-7">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#0f1724] px-6 py-5 text-slate-100 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Manager operations</p>
          <h1 className="mt-2 text-3xl font-semibold">Reconciliation Report</h1>
          <p className="mt-2 text-sm text-slate-300">Generated at {new Date(report.timestamp).toLocaleString()}</p>
        </div>
        <Link
          href="/manager"
          className="inline-flex items-center justify-center rounded-xl border border-slate-500 bg-slate-800 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:bg-slate-700"
        >
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Outcome mix</p>
            <h2 className="text-2xl font-semibold text-slate-950">Three-way reconciliation at a glance</h2>
            <p className="max-w-2xl text-base text-slate-600">
              Red items need review, yellow items may be stale because the operations fetch is capped,
              and green items represent the expected gap.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <svg viewBox="0 0 128 128" className="h-56 w-56" role="img" aria-label="Reconciliation donut chart">
              <circle cx="64" cy="64" r={chartRadius} fill="none" stroke="#e2e8f0" strokeWidth="18" />
              {sections.map((section) => {
                if (section.count === 0 || totalItems === 0) {
                  return null;
                }

                const segmentLength = (section.count / totalItems) * chartCircumference;
                const segment = (
                  <circle
                    key={section.key}
                    cx="64"
                    cy="64"
                    r={chartRadius}
                    fill="none"
                    stroke={section.color}
                    strokeWidth="18"
                    strokeDasharray={`${segmentLength} ${chartCircumference - segmentLength}`}
                    strokeDashoffset={-chartOffset}
                    strokeLinecap="butt"
                    transform="rotate(-90 64 64)"
                  />
                );

                chartOffset += segmentLength;
                return segment;
              })}
              <text x="64" y="60" textAnchor="middle" className="fill-slate-950 text-3xl font-bold">
                {totalItems}
              </text>
              <text x="64" y="78" textAnchor="middle" className="fill-slate-500 text-sm font-semibold uppercase tracking-[0.16em]">
                Total
              </text>
            </svg>

            <div className="grid w-full gap-3 sm:grid-cols-3">
              {sections.map((section) => (
                <div key={section.key} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{section.title}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{section.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {sections.map((section) => (
          <details key={section.key} className={`group rounded-xl border ${section.toneClassName}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{section.title}</p>
                <p className="mt-1 text-xl font-semibold">{section.count} items</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Tap to expand
              </div>
            </summary>
            <div className="border-t border-current/10 px-5 py-4">
              {section.items.length > 0 ? (
                <ul className="grid gap-3">
                  {section.items.map((item) => (
                    <li key={`${section.key}-${item.asset_tag}`} className="rounded-lg bg-white/80 p-4">
                      <div className="text-base font-semibold text-slate-950 [font-family:var(--font-plex-mono)]">{item.asset_tag}</div>
                      <div className="mt-1 text-base text-slate-700">{item.reason}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-slate-700">No items in this category.</p>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
