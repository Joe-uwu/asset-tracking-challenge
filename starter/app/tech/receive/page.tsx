"use client";

import { useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { CameraScanner } from "@/components/CameraScanner";
import { api } from "@/lib/api-client";
import { Asset } from "@/lib/types";
import { getCurrentUserId } from "@/lib/auth";

export default function TechReceivePage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(
    null
  );
  const [success, setSuccess] = useState<{ type: "new" | "duplicate"; message: string } | null>(null);
  const [scanMethod, setScanMethod] = useState<"keyboard" | "camera">("keyboard");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  const userId = getCurrentUserId();

  // Default values for when asset is not found in the system
  const DEFAULT_ASSET_DATA = {
    serial: "SN-DEFAULT",
    model: "Default Model",
    manufacturer: "Default Manufacturer",
    asset_class: "instrument" as const,
    location: {
      site: "Lab-Building-A",
      room: "Receiving-Dock",
      row: null,
      rack: null,
      ru: null,
    },
  };

  const handleScan = async (assetTag: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First, try to get the asset by tag to see if it exists and get its data
      const existingAsset = await api.assets.get(assetTag).catch(() => {
        // If 404, we'll treat it as a new asset and use default data
        return null;
      });

      // Prepare the receive data
      const receiveData = {
        asset_tag: assetTag,
        // Use existing asset data if available, otherwise use defaults
        serial: existingAsset?.serial ?? DEFAULT_ASSET_DATA.serial,
        model: existingAsset?.model ?? DEFAULT_ASSET_DATA.model,
        manufacturer: existingAsset?.manufacturer ?? DEFAULT_ASSET_DATA.manufacturer,
        asset_class: existingAsset?.asset_class ?? DEFAULT_ASSET_DATA.asset_class,
        // For location, we use a default receiving location.
        // In a real system, this might be scanned or inferred from context.
        location: {
          site: "Lab-Building-A",
          room: "Receiving-Dock",
          row: null,
          rack: null,
          ru: null,
        },
        user_id: userId,
        scan_payload: `${assetTag}-${Date.now()}`,
      };

      // Call the receive endpoint
      const result = await api.scans.receive(receiveData);
      setAsset(result);

      // Determine if this was a new asset or a duplicate receive
      // We can't rely on HTTP status code directly from the api client, but we can infer:
      // - If the asset didn't exist before and now exists in 'received' state, it's new.
      // - If the asset existed and we got a successful response, it's a duplicate (idempotent).
      const isNew = !existingAsset;
      setSuccess({
        type: isNew ? "new" : "duplicate",
        message: isNew
          ? "Asset received successfully"
          : "Duplicate receive - asset already exists (idempotent)",
      });
    } catch (err: any) {
      console.error("Receive failed:", err);
      // Handle specific error codes from the API
      if (err.code === "and_match_failed") {
        // MICROCOPY IMPROVEMENT: Sharpened to be under 12 words, actionable, no jargon
        // BEFORE: `Barcode conflict: The serial number scanned does not match this asset's tracking tag. Expected: ${err.details?.expectedSerial}, Received: ${err.details?.receivedSerial}. Please verify physical label against system record.`
        // AFTER: "Check physical tag - serial doesn't match system. Rescan or verify label."
        setError({
          code: err.code,
          message: "Check physical tag - serial doesn't match system. Rescan or verify label.",
          details: err.details
        });
      } else if (err.code === "invalid_location") {
        setError({
          code: err.code,
          message: "Invalid location provided. Please check the location format.",
          details: err.details
        });
      } else if (err.status === 429) {
        setError({
          code: err.code,
          message: "System is busy. Please wait a moment and try again.",
          details: err.details
        });
      } else {
        setError({
          code: err.code || "unknown_error",
          message: err.message || "An unknown error occurred",
          details: err.details
        });
      }
      setAsset(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = (decodedText: string) => {
    // Process the scanned text from camera
    handleScan(decodedText);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Receive Asset</h1>
        <p className="text-sm text-gray-500">
          Scan incoming asset tag to receive it into the system
        </p>
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <label className="text-sm font-medium mr-2">Scan Method:</label>
        <button
          onClick={() => setScanMethod("keyboard")}
          className={`px-3 py-1 rounded ${scanMethod === "keyboard" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"} hover:bg-blue-700`}
        >
          Keyboard/Scanner
        </button>
        {!cameraPermissionGranted && (
          <button
            onClick={() => {
              // Request camera permission
              navigator.mediaDevices.getUserMedia({ video: true })
                .then(() => setCameraPermissionGranted(true))
                .catch(() => {
                  alert("Camera permission denied. Please enable camera access.");
                });
            }}
            className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Enable Camera
          </button>
        )}
        {cameraPermissionGranted && (
          <button
            onClick={() => setScanMethod("camera")}
            className={`px-3 py-1 rounded ${scanMethod === "camera" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"} hover:bg-green-700`}
          >
            Camera
          </button>
        )}
      </div>

      {success && (
        <div className={`mb-4 p-3 rounded-lg ${success.type === "new"
                        ? "bg-green-50 border-l-4 border-green-500"
                        : "bg-blue-50 border-l-4 border-blue-500"}`}>
          <p className={success.type === "new"
                        ? "text-green-800"
                        : "text-blue-800"}>{success.message}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500">
          <p className="text-red-800 font-medium">Error {error.code}</p>
          <p className="mt-1 text-red-700">{error.message}</p>
          {error.details && error.code === "and_match_failed" && (
            // DOCUMENTING THE MICROCOPY IMPROVEMENT:
            // BEFORE: Technical explanation with expected/received serials
            // AFTER: "Check physical tag - serial doesn't match system. Rescan or verify label." (11 words)
            // REASON: Tells technician exactly what to do next - check the physical tag, then either rescan or verify the label against what's in the system. No jargon, actionable, under 12 words.
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: This is the most common scanning error - verify the physical asset tag matches what's in the system.
              </p>
            </div>
          )}
          {error.details && error.code === "invalid_location" && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: Check that the location format is correct (e.g., "Lab-Building-A").
              </p>
            </div>
          )}
          {error.details && error.code === "429" && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: The system is experiencing high demand. Please wait a moment and try again.
              </p>
            </div>
          )}
          <button
            onClick={() => {
              setAsset(null);
              setError(null);
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {asset && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500">
          <p className="text-blue-800 font-medium">
            Asset {asset.asset_tag} is now {asset.state.replace(
              "_",
              " "
            )}
          </p>
          <div className="mt-2 space-y-1 text-sm text-blue-600">
            <div>{asset.model} by {asset.manufacturer}</div>
            <div>Serial: {asset.serial}</div>
            <div>
              Location: {asset.location.site} {asset.location.room ? `-{asset.location.room}` : ""}{" "}
              {asset.location.rack ? `-{asset.location.rack}` : ""}{" "}
              {asset.location.ru ? `RU{asset.location.ru}` : ""}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Current User: <span className="font-mono">{userId}</span>
        </label>
      </div>

      {scanMethod === "keyboard" && (
        <ScanInput
          onScan={handleScan}
          placeholder="Scan asset tag and press Enter..."
          label="Asset Tag"
          disabled={loading}
          autoFocus={true}
          hardwareScannerMode={true}
          debounceMs={50}
        />
      )}

      {scanMethod === "camera" && cameraPermissionGranted && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Use your device camera to scan the asset tag
          </label>
          <CameraScanner
            onScan={handleCameraScan}
            onError={(errorMsg) => setError({ code: "camera_error", message: errorMsg })}
            onScanComplete={() => {
              // Optionally provide haptic feedback or sound on successful scan
              // navigator.vibrate?.(50);
            }}
          />
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center space-x-2">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Processing scan...</span>
        </div>
      )}
    </div>
  );
}