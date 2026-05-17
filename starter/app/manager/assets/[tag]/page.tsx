import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Asset, Event } from "@/lib/types";

export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssetData();
  }, [tag]);

  const fetchAssetData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetData, eventsData] = await Promise.all([
        api.assets.get(tag),
        api.assets.history(tag),
      ]);
      setAsset(assetData);
      setEvents(eventsData);
    } catch (err: any) {
      console.error("Failed to fetch asset data:", err);
      if (err.status === 404) {
        notFound();
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Loading asset {tag}...</h1>
          <Link
            href="/manager"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to asset list
          </Link>
        </div>
        <p className="mt-4">Fetching asset details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Asset {tag}</h1>
          <Link
            href="/manager"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to asset list
          </Link>
        </div>
        <p className="mt-4 text-red-500">Error: {error}</p>
        <button
          onClick={() => {
            fetchAssetData();
          }}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Asset {tag}</h1>
          <Link
            href="/manager"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to asset list
          </Link>
        </div>
        <p className="mt-4">Asset not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">Asset {asset.asset_tag}</h1>
        <Link
          href="/manager"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to asset list
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Asset Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Tag:</span> {asset.asset_tag}
            </div>
            <div>
              <span className="font-medium">Serial:</span> {asset.serial}
            </div>
            <div>
              <span className="font-medium">Model:</span> {asset.model}
            </div>
            <div>
              <span className="font-medium">Manufacturer:</span>
              {asset.manufacturer}
            </div>
            <div>
              <span className="font-medium">Class:</span>
              {asset.asset_class.replace("_", " ").toLowerCase()}
            </div>
            <div>
              <span className="font-medium">State:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                asset.state === "in_service"
                  ? "bg-green-100 text-green-800"
                  : asset.state === "stored"
                  ? "bg-blue-100 text-blue-800"
                  : asset.state === "received"
                  ? "bg-yellow-100 text-yellow-800"
                  : asset.state === "rma_pending"
                  ? "bg-orange-100 text-orange-800"
                  : asset.state === "disposed"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {asset.state.replace("_", " ").toLowerCase()}
              </span>
            </div>
            <div>
              <span className="font-medium">Custodian:</span>
              {asset.custodian || "Unassigned"}
            </div>
            <div>
              <span className="font-medium">Location:</span>{" "}
              {asset.location.site}{" "}
              {asset.location.room ? `-${asset.location.room}` : ""}{" "}
              {asset.location.rack ? `-${asset.location.rack}` : ""}{" "}
              {asset.location.ru ? `RU${asset.location.ru}` : ""}
            </div>
            {asset.procurement_note && (
              <div className="mt-2">
                <span className="font-medium">Procurement Note:</span>{" "}
                {asset.procurement_note}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Timestamps</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(asset.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{" "}
              {new Date(asset.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {events.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Event History ({events.length})
          </h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border-l-4 border-gray-200 pl-4 mb-4"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">
                    {event.event_type
                      .replace("_", " ")
                      .toLowerCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {event.from_state
                    ? `${event.from_state
                        .replace("_", " ")
                        .toLowerCase()} → `
                    : ""}
                  {event.to_state.replace("_", " ").toLowerCase()}
                </p>
                {event.to_location && (
                  <div className="mt-1 text-xs text-gray-600">
                    Moved to: {event.to_location.site}{" "}
                    {event.to_location.room ? `-${event.to_location.room}` : ""}{" "}
                    {event.to_location.rack ? `-${event.to_location.rack}` : ""}{" "}
                    {event.to_location.ru ? `RU${event.to_location.ru}` : ""}
                  </div>
                )}
                {event.from_location && (
                  <div className="mt-1 text-xs text-gray-600">
                    From: {event.from_location.site}{" "}
                    {event.from_location.room ? `-${event.from_location.room}` : ""}{" "}
                    {event.from_location.rack ? `-${event.from_location.rack}` : ""}{" "}
                    {event.from_location.ru ? `RU${event.from_location.ru}` : ""}
                  </div>
                )}
                {event.user_id && (
                  <div className="mt-1 text-xs text-gray-600">
                    User: {event.user_id}
                  </div>
                )}
                {event.scan_payload && (
                  <div className="mt-1 text-xs text-gray-600 break-words">
                    Scan: {event.scan_payload}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center py-8 text-gray-500">
          No event history for this asset.
        </p>
      )}
    </div>
  );
}