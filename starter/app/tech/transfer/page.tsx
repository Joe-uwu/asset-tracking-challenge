"use client";

import { useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { CameraScanner } from "@/components/CameraScanner";
import { api } from "@/lib/api-client";
import { Asset } from "@/lib/types";
import { getCurrentUserId, roleUserId } from "@/lib/auth";
import { useApiData, useApiMutation } from "@/lib/swr";

export default function TechTransferPage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [toCustodian, setToCustodian] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(
    null
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [phase, setPhase] = useState<"asset" | "custodian" | "submitting">("asset");
  const [scanMethod, setScanMethod] = useState<"keyboard" | "camera">("keyboard");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  const userId = getCurrentUserId(); // Current user (the "from" party)

  const resetForm = () => {
    setAsset(null);
    setToCustodian(null);
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
      setPhase("custodian");
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

  const handleCustodianScan = async (badgeString: string) => {
    setToCustodian(badgeString);
    setPhase("submitting");
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate that we're not transferring to ourselves
      if (badgeString === userId) {
        throw new Error("Cannot transfer asset to yourself. Please scan a different badge.");
      }

      // Validate that the asset is in a state that allows transfer
      const transferableStates = ["received", "stored", "in_service"];
      if (!asset || !transferableStates.includes(asset.state)) {
        throw new Error(`Asset cannot be transferred from state: ${asset?.state}. Allowed states: received, stored, in_service`);
      }

      const result = await api.scans.transfer({
        asset_tag: asset?.asset_tag ?? "",
        to_custodian: badgeString,
        user_id: userId, // The "from" custodian (current user)
        scan_payload: `${asset?.asset_tag}-to-${badgeString}-${Date.now()}`,
      });

      setAsset(result);
      const toUserName = roleUserId(badgeString as "tech" | "manager") || badgeString;
      setSuccess(`Asset transferred successfully to ${toUserName}. State remains: ${result.state.replace("_", " ")}`);
    } catch (err: any) {
      console.error("Transfer failed:", err);
      if (err.code === "same_custodian") {
        setError({
          code: err.code,
          message: "Cannot transfer asset to yourself. Please scan a different badge.",
          details: err.details
        });
      } else if (err.code === "invalid_transition") {
        setError({
          code: err.code,
          message: `Cannot transfer asset in current state: ${asset?.state}. Transfer is only allowed from 'received', 'stored', or 'in_service'.`,
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

  const handleCameraScan = (decodedText: string) => {
    if (phase === "asset") {
      handleAssetScan(decodedText);
    } else if (phase === "custodian") {
      handleCustodianScan(decodedText);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Transfer Asset</h1>
        <p className="text-sm text-gray-500">
          Scan an asset tag, then scan the receiving party's badge to transfer custody.
          State remains unchanged during transfer.
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
            Current User (From): <span className="font-mono">{userId}</span>
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

      {phase === "custodian" && asset && (
        <>
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500">
            <p className="text-blue-800 font-medium">
              Asset {asset.asset_tag} is currently {asset.state.replace(
                "_",
                " "
              )} with custodian: {asset.custodian}
            </p>
            <div className="mt-2 space-y-1 text-sm text-blue-600">
              <div>{asset.model} by {asset.manufacturer}</div>
              <div>Serial: {asset.serial}</div>
              <div>
                Location: {asset.location.site} {asset.location.room ? `-${asset.location.room}` : ""}{" "}
                {asset.location.rack ? `-${asset.location.rack}` : ""}{" "}
                {asset.location.ru ? `RU${asset.location.ru}` : ""}
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium mb-2">
            Scan Receiving Party's Badge (User ID)
          </label>
          <p className="text-xs text-gray-500 mb-1">
            Examples: tech-jane, tech-mike, manager-paul
          </p>
          <div className="mb-2">
            <ScanInput
              onScan={handleCustodianScan}
              placeholder="Scan badge and press Enter..."
              label="To Custodian"
              disabled={loading}
            />
          </div>
          {toCustodian && (
            <p className="mt-2 text-sm text-gray-600">
              Scanned badge: {toCustodian}
            </p>
          )}
        </>
      )}

      {phase === "custodian" && asset && cameraPermissionGranted && (
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2">
            Or use camera to scan badge
          </label>
          <CameraScanner
            onScan={handleCustodianScan}
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
          <span className="text-sm text-gray-600">Transferring asset...</span>
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
          {error.details && error.code === "same_custodian" && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: You cannot transfer an asset to yourself. Scan a different person's badge.
              </p>
            </div>
          )}
          {error.details && error.code === "invalid_transition" && (
            <div className="mt-2 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-800 text-sm">
                Tip: Make sure the asset is in 'received', 'stored', or 'in_service' state before transferring.
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