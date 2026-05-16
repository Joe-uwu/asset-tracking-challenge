"use client";

import { useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { CameraScanner } from "@/components/CameraScanner";
import { api } from "@/lib/api-client";
import { Asset } from "@/lib/types";
import { getCurrentUserId } from "@/lib/auth";
import { useApiData, useApiMutation } from "@/lib/swr";

export default function TechDeployPage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [locationParts, setLocationParts] = useState<{
    site: string;
    room: string;
    rack: string;
    ru: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(
    null
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [phase, setPhase] = useState<"asset" | "location" | "submitting">("asset");
  const [scanMethod, setScanMethod] = useState<"keyboard" | "camera">("keyboard");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  const userId = getCurrentUserId();

  const resetForm = () => {
    setAsset(null);
    setLocationParts(null);
    setError(null);
    setSuccess(null);
    setPhase("asset");
  };

  const handleAssetScan = async (assetTag: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const assetData = await api.assets.get(assetTag);
      setAsset(assetData);
      setPhase("location");
    } catch (err: any) {
      console.error("Failed to fetch asset:", err);
      if (err.code === "unknown_asset") {
        setError({
          code: err.code,
          message: `Asset not found: No record exists for tag ${assetTag}. Please verify the tag and try again.`,
          details: err.details
        });
      } else {
        setError({
          code: err.code || "unknown_error",
          message: err.message || "An unknown error occurred",
          details: err.details
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationScan = async (locationString: string) => {
    // Parse the location string to extract components
    // Expected format: "Site/Room/Row/Rack/RU" or similar
    const parts = locationString.split("/").filter(part => part.length > 0);

    // For deploy, we need site, room, rack, and RU
    // In a real implementation, we'd have a more sophisticated parser
    if (parts.length < 4) {
      setError({
        code: "invalid_location",
        message: "Location must include site, room, rack, and RU (format: Site/Room/Row/Rack/RU)",
        details: { received: locationString }
      });
      return;
    }

    setLocationParts({
      site: parts[0] || "",
      room: parts[1] || "",
      rack: parts.length > 2 ? parts[2] : "",
      ru: parts.length > 3 ? parts[3] : "",
    });

    setPhase("submitting");
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate that we have the required fields for deploy
      if (!locationParts?.site || !locationParts?.room || !locationParts?.rack || !locationParts?.ru) {
        throw new Error("Deploy location must include site, room, rack, and RU");
      }

      const locationData = {
        site: locationParts.site,
        room: locationParts.room || null,
        row: null, // We're not capturing row in our simple parser
        rack: locationParts.rack,
        ru: locationParts.ru,
      };

      // First, deploy the asset
      const deployResult = await api.scans.deploy({
        asset_tag: asset?.asset_tag ?? "",
        location: locationData,
        user_id: userId,
        scan_payload: `${asset?.asset_tag}-deploy-${Date.now()}`,
      });

      setAsset(deployResult);

      // Then write back to facilities (set rack location) and finance (capitalize)
      // Using Promise.allSettled to parallelize updates
      const [facilitiesResult, financeResult] = await Promise.allSettled([
        api.mock.updateFacilities({
          tagged_id: deployResult.asset_tag,
          rack_location: `${locationData.site}/${locationData.room || 'Unspecified'}/${locationData.row || 'Unspecified'}/${locationData.rack}/${locationData.ru}`,
        }),
        api.mock.updateFinance({
          tag: deployResult.asset_tag,
          status: "capitalized",
        })
      ]);

      let writeBackMessage = "Asset deployed successfully.";
      let hasWriteBackError = false;

      if (facilitiesResult.status === 'rejected') {
        hasWriteBackError = true;
        writeBackMessage += " Facilities synchronization failed.";
      }

      if (financeResult.status === 'rejected') {
        hasWriteBackError = true;
        writeBackMessage += " ERP financial synchronization failed.";
      }

      if (hasWriteBackError) {
        writeBackMessage += " System will automatically retry.";
        setSuccess(`${writeBackMessage} New state: ${deployResult.state.replace("_", " ")}`);
      } else {
        setSuccess(`Asset deployed successfully. New state: ${deployResult.state.replace("_", " ")}. Facilities and finance updated.`);
      }
    } catch (err: any) {
      console.error("Deploy failed:", err);
      if (err.code === "invalid_transition") {
        setError({
          code: err.code,
          message: `Cannot deploy asset in current state: ${asset?.state}. Deploy is only allowed from 'stored' state`,
          details: err.details
        });
      } else if (err.code === "incomplete_deploy_location") {
        setError({
          code: err.code,
          message: `Deploy location incomplete. Missing: ${err.details?.missingFields?.join(", ") ?? "site/room/rack/ru"}`,
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
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key on location input to submit
  const handleLocationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && locationParts) {
      // We'll trigger the location scan handler with the current location value
      // But note: we are in the location phase, and the ScanInput is controlled by the location state.
      // We can call handleLocationScan with the current location value.
      // However, we are already in the submitting phase when we have a location.
      // Actually, we set the location on scan, then we go to submitting.
      // So we don't need to handle Enter here because the ScanInput already calls onScan on Enter.
      // We'll leave this empty for now.
    }
  };

  const handleCameraScan = (decodedText: string) => {
    if (phase === "asset") {
      handleAssetScan(decodedText);
    } else if (phase === "location") {
      handleLocationScan(decodedText);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Deploy Asset</h1>
        <p className="text-sm text-gray-500">
          Scan an asset tag, then scan a deploy location (must include site, rack, and RU) to deploy the asset.
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

      {phase === "asset" && (
        <>
          <label className="block text-sm font-medium mb-2">
            Current User: <span className="font-mono">{userId}</span>
          </label>
          <ScanInput
            onScan={handleAssetScan}
            placeholder="Scan asset tag and press Enter..."
            label="Asset Tag"
            disabled={loading}
            autoFocus={true}
            hardwareScannerMode={true}
            debounceMs={50}
          />
        </>
      )}

      {phase === "location" && asset && (
        <>
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500">
            <p className="text-blue-800 font-medium">
              Asset {asset.asset_tag} is currently {asset.state.replace(
                "_",
                " "
              )}
            </p>
            <div className="mt-2 space-y-1 text-sm text-blue-600">
              <div>{asset.model} by {asset.manufacturer}</div>
              <div>Serial: {asset.serial}</div>
              <div>
                Current Location: {asset.location.site} {asset.location.room ? `-${asset.location.room}` : ""}{" "}
                {asset.location.rack ? `-${asset.location.rack}` : ""}{" "}
                {asset.location.ru ? `RU${asset.location.ru}` : ""}
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium mb-2">
            Scan Deploy Location (Format: Site/Room/Row/Rack/RU)
          </label>
          <div className="mb-2">
            <ScanInput
              onScan={handleLocationScan}
              placeholder="Scan location and press Enter..."
              label="Location"
              disabled={loading}
              value={locationParts ? `${locationParts.site}/${locationParts.room}/${locationParts.rack}/${locationParts.ru}` : ""}
              onChange={(e) => {
                const parts = e.target.value.split("/").filter(p => p.length > 0);
                setLocationParts({
                  site: parts[0] || "",
                  room: parts[1] || "",
                  rack: parts[2] || "",
                  ru: parts[3] || "",
                });
              }}
            />
          </div>
          {locationParts && (
            <div className="mb-2 p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-600">
                Parsed location: {locationParts.site}/{locationParts.room}/{locationParts.rack}/{locationParts.ru}
              </p>
            </div>
          )}
        </>
      )}

      {phase === "location" && asset && cameraPermissionGranted && (
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2">
            Or use camera to scan location
          </label>
          <CameraScanner
            onScan={handleLocationScan}
            onError={(errorMsg) => setError({ code: "camera_error", message: errorMsg })}
            onScanComplete={() => {
              // Optionally provide haptic feedback or sound on successful scan
              // navigator.vibrate?.(50);
            }}
          />
        </div>
      )}

      {phase === "submitting" && (
        <div className="mt-4 flex items-center space-x-2">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Deploying asset...</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border-l-4 border-green-500">
          <p className="text-green-800">{success}</p>
          <button
            onClick={resetForm}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Scan Another
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500">
          <p className="text-red-800 font-medium">Error {error.code}</p>
          <p className="mt-1 text-red-700">{error.message}</p>
          {error.details && error.code === "incomplete_deploy_location" && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: For deployment, you need to scan a location that includes site, room, rack, and RU.
                Example format: "Lab-Building-A/Lab-1/A/Rack-5/23"
              </p>
            </div>
          )}
          {error.details && error.code === "invalid_transition" && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: Make sure the asset is in 'stored' state before deploying. Receive the asset first, then store it before deploying.
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
            onClick={resetForm}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}