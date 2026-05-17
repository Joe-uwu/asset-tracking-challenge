'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  onScanComplete?: () => void;
}

export function CameraScanner({
  onScan,
  onError,
  onScanComplete,
}: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const startScanning = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        const primaryCamera = devices[0];
        if (!primaryCamera) return;
        setCameraId(primaryCamera.id);
        const config = { fps: 10, qrbox: 250 };
        html5QrcodeRef.current = new Html5Qrcode("reader");
        await html5QrcodeRef.current.start(
          primaryCamera.id,
          config,
          (decodedText: string) => {
            onScan(decodedText);
            onScanComplete?.();
          },
          (error: string) => {
            onError?.(`QR Code scanning error: ${error}`);
          }
        );
        setIsScanning(true);
      } else {
        onError?.('No cameras found');
      }
    } catch (err) {
      onError?.(`Error initializing camera: ${err}`);
    }
  }, [onScan, onError, onScanComplete]);

  const stopScanning = useCallback(async () => {
    if (isScanning && html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        setIsScanning(false);
        setCameraId(null);
        html5QrcodeRef.current = null;
      } catch (err) {
        onError?.(`Error stopping camera: ${err}`);
      }
    }
  }, [isScanning, onError]);

  useEffect(() => {
    if (cameraId) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [cameraId, startScanning, stopScanning]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  if (!isScanning) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <button
          onClick={startScanning}
          className="w-full rounded-xl bg-[#2563eb] px-5 py-4 text-lg font-semibold text-white hover:bg-blue-700"
        >
          Start Camera Scan
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-300 bg-slate-950">
      <div id="reader" className="h-[320px] w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&>div]:h-full [&>div]:w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-4 py-3 text-sm text-white/90">
        Camera viewfinder
      </div>
      {!isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <p>Initializing camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}