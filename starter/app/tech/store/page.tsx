"use client";

import { useState } from "react";
import { ScanInput } from "@/components/ScanInput";
import { CameraScanner } from "@/components/CameraScanner";
import { api } from "@/lib/api-client";
import { Asset } from "@/lib/types";
import { getCurrentUserId } from "@/lib/auth";

export default function TechStorePage() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(
    null
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [phase, setPhase] = useState<"asset" | "location" | "submitting">("asset");
  const [scanMethod, setScanMethod] = useState<"keyboard" | "camera">("keyboard");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  const userId = getCurrentUserId();
  const stepLabel = phase === "asset" ? "Step 1 of 2" : "Step 2 of 2";

  const resetForm = () => {
    setAsset(null);
    setLocation(null);
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
    setLocation(locationString);
    setPhase("submitting");
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For storage, we only require the site. We'll set room, row, rack, ru to null.
      // In a more advanced implementation, we could parse a structured location string.
      const locationData = {
        site: locationString,
        room: null,
        row: null,
        rack: null,
        ru: null,
      };

      const result = await api.scans.store({
        asset_tag: asset?.asset_tag ?? "",
        location: locationData,
        user_id: userId,
        scan_payload: `${asset?.asset_tag}-${locationString}-${Date.now()}`,
      });

      setAsset(result);

      // Write-back logic: If storing from in_service, clear the facilities location
      if (asset && asset.state === "in_service") {
        // Remove from facilities by setting rack_location to null
        await api.mock.updateFacilities({
          tagged_id: asset.asset_tag,
          rack_location: null,
        });
        setSuccess(`Asset stored successfully (de-racked). New state: ${result.state.replace("_", " ")}. Facilities updated.`);
      } else {
        setSuccess(`Asset stored successfully. New state: ${result.state.replace("_", " ")}`);
      }
    } catch (err: any) {
      console.error("Store failed:", err);
      if (err.code === "invalid_transition") {
        setError({
          code: err.code,
          message: `Cannot store asset in current state: ${asset?.state}. Store is only allowed from 'received' or 'in_service'. Received assets are newly arrived, stored assets are in inventory.`,
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

  const handleCameraScan = (decodedText: string) => {
    if (phase === "asset") {
      handleAssetScan(decodedText);
    } else if (phase === "location") {
      handleLocationScan(decodedText);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-950">Store Asset</h1>
        <p className="max-w-3xl text-lg text-slate-600">
          Scan the asset, then scan the storage location. The workflow keeps each step large and explicit for fast use.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{stepLabel}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {phase === "asset" ? "Scan the asset tag" : "Scan the storage location"}
            </h2>
            <p className="mt-2 text-base text-slate-600">
              {phase === "asset"
                ? "Start by identifying the asset before moving to storage details."
                : "Confirm the site or storage location to finish the store action."}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-base font-semibold text-slate-700">
            Current user: {userId}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setScanMethod("keyboard")}
            className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold transition ${scanMethod === "keyboard" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
          >
            Keyboard / Scanner
          </button>
          {!cameraPermissionGranted ? (
            <button
              onClick={() => {
                navigator.mediaDevices
                  .getUserMedia({ video: true })
                  .then(() => setCameraPermissionGranted(true))
                  .catch(() => {
                    alert("Camera permission denied. Please enable camera access.");
                  });
              }}
              className="w-full rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700"
            >
              Enable Camera
            </button>
          ) : (
            <button
              onClick={() => setScanMethod("camera")}
              className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold transition ${scanMethod === "camera" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              Camera
            </button>
          )}
          <button
            onClick={resetForm}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </section>

      {phase === "asset" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <ScanInput
            onScan={handleAssetScan}
            placeholder="Scan asset tag and press Enter..."
            label="Asset Tag"
            disabled={loading}
            autoFocus={true}
          />
        </section>
      )}

      {phase === "location" && asset && (
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Asset ready</p>
            <h3 className="mt-2 text-2xl font-bold text-blue-950">{asset.asset_tag}</h3>
            <p className="mt-2 text-lg text-blue-900">
              Currently {asset.state.replace("_", " ")} · {asset.model} by {asset.manufacturer}
            </p>
            <p className="mt-1 text-base text-blue-800">Serial: {asset.serial}</p>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
            <ScanInput
              onScan={handleLocationScan}
              placeholder="Scan storage location and press Enter..."
              label="Location"
              disabled={loading}
              autoFocus={true}
            />
            {location ? <p className="mt-3 text-base text-slate-600">Scanned location: {location}</p> : null}
          </div>

          {cameraPermissionGranted && scanMethod === "camera" ? (
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-base font-semibold text-slate-800">Use the camera instead of the keyboard scanner</p>
              <CameraScanner
                onScan={handleCameraScan}
                onError={(errorMsg) => setError({ code: "camera_error", message: errorMsg })}
                onScanComplete={() => {
                  // Optionally provide haptic feedback or sound on successful scan
                  // navigator.vibrate?.(50);
                }}
              />
            </div>
          ) : null}
        </section>
      )}

      {phase === "submitting" && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg text-slate-700 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Storing asset...</span>
        </div>
      )}

      {success && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-800">Success</p>
          <p className="mt-2 text-lg font-semibold text-green-950">{success}</p>
          <p className="mt-2 text-base text-green-800">Use the button below to start the next scan.</p>
          <button
            onClick={resetForm}
            className="mt-4 w-full rounded-2xl bg-green-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-green-700"
          >
            Scan Another
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-800">Error {error.code}</p>
          <p className="mt-2 text-lg font-semibold text-red-950">{error.message}</p>
          <p className="mt-2 text-base text-red-800">Review the details below and try the step again.</p>
          {error.details && error.code === "invalid_transition" && (
            <div className="mt-4 rounded-2xl bg-yellow-50 p-4">
              <p className="text-base font-medium text-yellow-900">
                Tip: Make sure the asset is in 'received' or 'in_service' state before storing.
              </p>
            </div>
          )}
          {error.details && error.code === "429" && (
            <div className="mt-4 rounded-2xl bg-yellow-50 p-4">
              <p className="text-base font-medium text-yellow-900">
                Tip: The system is experiencing high demand. Please wait a moment and try again.
              </p>
            </div>
          )}
          <button
            onClick={resetForm}
            className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}