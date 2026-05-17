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
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-950">Receive Asset</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Scan a tag and press Enter to receive the asset. The screen stays simple and touch-friendly.
        </p>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
          className="w-full rounded-2xl border-2 border-gray-300 px-4 py-4 text-xl focus:border-blue-600 focus:outline-none disabled:bg-gray-100"
        />
        <button
          onClick={() => void handleReceive()}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Receiving..." : "Receive"}
        </button>
        {success ? (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-800">Success</p>
            <p className="mt-2 text-lg font-semibold text-green-950">{success}</p>
            <p className="mt-2 text-base text-green-800">Scan another tag to continue receiving assets.</p>
            <button
              onClick={() => {
                setAssetTag("");
                setSuccess(null);
              }}
              className="mt-4 w-full rounded-2xl bg-green-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-green-700"
            >
              Scan Another
            </button>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-800">Receive failed</p>
            <p className="mt-2 text-lg font-semibold text-red-950">{error}</p>
            <p className="mt-2 text-base text-red-800">Check the tag and try again.</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
