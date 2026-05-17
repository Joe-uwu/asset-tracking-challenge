"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";

export default function TechReceivePage() {
  const [assetTag, setAssetTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReceive = async () => {
    const trimmedTag = assetTag.trim();
    if (!trimmedTag) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.scans.receive({
        asset_tag: trimmedTag,
        serial: trimmedTag,
        model: trimmedTag,
        manufacturer: trimmedTag,
        asset_class: "instrument",
        location: {
          site: "",
          room: null,
          row: null,
          rack: null,
          ru: null,
        },
        user_id: "",
        scan_payload: trimmedTag,
      });
      setSuccess(`Received ${trimmedTag}`);
      setAssetTag("");
    } catch (receiveError) {
      console.error("Receive failed:", receiveError);
      setError(
        receiveError instanceof Error
          ? receiveError.message
          : "Failed to receive asset"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7 p-7">
      <div className="rounded-2xl bg-[#0f1724] px-6 py-5 text-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Step 1 of 1</p>
        <h1 className="mt-2 text-3xl font-semibold">Receive Asset</h1>
        <p className="mt-2 max-w-3xl text-base text-slate-300">
          Scan an asset tag and press Enter to register receipt in the operations system.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-7">
        <input
          value={assetTag}
          onChange={(event) => setAssetTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleReceive();
            }
          }}
          disabled={loading}
          placeholder="Scan or type asset tag"
          className="w-full rounded-xl border border-slate-300 px-4 py-4 text-xl [font-family:var(--font-plex-mono)] focus:border-blue-600 focus:outline-none disabled:bg-slate-100"
        />
        <button
          onClick={() => void handleReceive()}
          disabled={loading}
          className="w-full rounded-xl bg-[#2563eb] px-5 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Receiving..." : "Receive"}
        </button>
        {success ? (
          <div className="rounded-xl border border-green-300 bg-green-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-800">Success</p>
            <p className="mt-2 text-lg font-semibold text-green-950 [font-family:var(--font-plex-mono)]">{success}</p>
            <p className="mt-2 text-base text-green-800">Asset recorded. Continue with the next incoming item.</p>
            <button
              onClick={() => {
                setAssetTag("");
                setSuccess(null);
              }}
              className="mt-4 w-full rounded-xl bg-[#2563eb] px-5 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
            >
              Scan Another
            </button>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-800">Receive failed</p>
            <p className="mt-2 text-lg font-semibold text-red-950">{error}</p>
            <p className="mt-2 text-base text-red-800">Verify the asset tag and resubmit the scan.</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 w-full rounded-xl bg-red-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
