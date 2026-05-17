"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { ScanInput } from "@/components/ScanInput";

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
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Receive Asset</h1>
      <div className="max-w-xl space-y-4">
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
          className="w-full rounded border border-gray-300 px-4 py-3"
        />
        <button
          onClick={() => void handleReceive()}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Receiving..." : "Receive"}
        </button>
        {success ? <p className="text-green-700">{success}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
