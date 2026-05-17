"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { api } from "@/lib/api-client";
import { Asset } from "@/lib/types";

export default function BarcodesPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [showQty, setShowQty] = useState(10);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get a sample of assets for barcode generation
      // We'll get some interesting cases: different states, etc.
      const allAssets = await api.assets.list();

      // Select a diverse sample for demonstration
      const states = ["received", "stored", "in_service", "rma_pending", "disposed"];
      const selected: Asset[] = [];

      // Try to get at least one from each state
      for (const state of states) {
        const stateAssets = allAssets.filter(a => a.state === state);
        if (stateAssets.length > 0) {
          // Add up to 2 from each state
          const toAdd = stateAssets.slice(0, 2);
          selected.push(...toAdd);
        }
      }

      // If we don't have enough, add more from received state
      if (selected.length < showQty) {
        const receivedAssets = allAssets.filter(a => a.state === "received");
        const needed = showQty - selected.length;
        selected.push(...receivedAssets.slice(0, needed));
      }

      setAssets(selected.slice(0, showQty));
    } catch (err: any) {
      console.error("Failed to fetch assets for barcodes:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBarcodes = () => {
    setSelectedAssets(assets);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Barcode Generator</h1>
        <p className="mb-4">Loading sample assets...</p>
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Fetching assets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Barcode Generator</h1>
        <p className="mb-4 text-red-500">Error: {error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchAssets();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Barcode Generator</h1>
      <p className="mb-6 text-sm text-gray-600">
        Generate scannable QR codes for asset tags and locations.
        These can be printed and used with barcode scanners or phone cameras.
      </p>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        <div className="flex flex-wrap items-start gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Number of assets:</label>
            <select
              value={showQty}
              onChange={(e) => {
                setShowQty(parseInt(e.target.value));
                fetchAssets();
              }}
              className="border px-3 py-2 rounded"
            >
              <option value={5}>5 assets</option>
              <option value={10}>10 assets</option>
              <option value={15}>15 assets</option>
              <option value={20}>20 assets</option>
            </select>
          </div>
          <div>
            <button
              onClick={handleGenerateBarcodes}
              disabled={loading || assets.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Generate Barcodes
            </button>
          </div>
          <button
            onClick={() => {
              window.print();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print This Page
          </button>
        </div>
      </div>

      {selectedAssets.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Asset Barcodes ({selectedAssets.length})
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Scan these QR codes with a smartphone or barcode scanner to simulate
            scanning an asset tag.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedAssets.map((asset) => (
              <div key={asset.asset_tag} className="border rounded-lg p-4">
                <div className="mb-2">
                  <div className="font-medium text-center">{asset.asset_tag}</div>
                  <div className="text-xs text-gray-500 text-center">
                    {asset.state.replace("_", " ")}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <QRCode
                    value={asset.asset_tag}
                    size={120}
                    level="Q"
                  />
                </div>
                <div className="mt-2 text-xs text-center text-gray-600">
                  (Asset Tag)
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Location Barcodes Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Location Barcodes</h2>
        <p className="mb-4 text-sm text-gray-600">
          Generate barcodes for common location formats used in the system.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            "Lab-Building-A/Lab-1/A/Rack-5/10",
            "Lab-Building-B/Lab-3/B/Rack-12/25",
            "Lab-Building-C/Lab-2/C/Rack-8/15",
            "Lab-Building-D/Storage/S1/Rack-01/01",
            "Lab-Building-E/Lab-4/D/Rack-20/30"
          ].map((location, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="mb-2">
                <div className="font-small text-center break-all">{location}</div>
              </div>
              <div className="flex items-center justify-center">
                <QRCode
                  value={location}
                  size={100}
                  level="Q"
                />
              </div>
              <div className="mt-1 text-xs text-center text-gray-600">
                (Location)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User/Badge Barcodes Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">User/Badge Barcodes</h2>
        <p className="mb-4 text-sm text-gray-600">
          Generate barcodes for user IDs used in the transfer workflow.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            "tech-jane",
            "tech-mike",
            "manager-paul",
            "tech-alex",
            "manager-sarah"
          ].map((userId, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="mb-2">
                <div className="font-medium text-center">{userId}</div>
              </div>
              <div className="flex items-center justify-center">
                <QRCode
                  value={userId}
                  size={100}
                  level="Q"
                />
              </div>
              <div className="mt-1 text-xs text-center text-gray-600">
                (User ID)
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How to Use</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Print this page or save as PDF
          </li>
          <li>
            Cut out the barcodes and tape them to assets, locations, or ID cards
          </li>
          <li>
            Use a USB/Bluetooth barcode scanner or smartphone camera to scan them
          </li>
          <li>
            The scanner will input the value (asset tag, location, or user ID)
            just like typing it followed by Enter
          </li>
        </ol>
        <p className="mt-4 text-sm text-gray-500">
          <strong>Tip:</strong> For best results, print at 100% size and ensure good contrast
          between the black and white modules.
        </p>
      </div>
    </div>
  );
}