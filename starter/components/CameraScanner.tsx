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
  const [isInitializing, setIsInitializing] = useState(true);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const startScanning = useCallback(async () => {
    try {
      setIsInitializing(true);
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        const primaryCamera = devices[0];
        if (!primaryCamera) return;
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
        setIsInitializing(false);
      } else {
        setIsInitializing(false);
        onError?.('No cameras found');
      }
    } catch (err) {
      setIsInitializing(false);
      onError?.(`Error initializing camera: ${err}`);
    }
  }, [onScan, onError, onScanComplete]);

  const stopScanning = useCallback(async () => {
    if (isScanning && html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        setIsScanning(false);
        html5QrcodeRef.current = null;
      } catch (err) {
        onError?.(`Error stopping camera: ${err}`);
      }
    }
    setIsScanning(false);
    setIsInitializing(false);
  }, [isScanning, onError]);

  useEffect(() => {
    void startScanning();
    return () => {
      void stopScanning();
    };
  }, [startScanning, stopScanning]);

  return (
    <div className="relative w-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-300 bg-black">
      <div
        id="reader"
        className="h-[320px] w-full overflow-hidden [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&>video]:bg-black [&>div]:h-full [&>div]:w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 text-sm text-white/90">
        Camera viewfinder
      </div>
      {(!isScanning || isInitializing) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/65">
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
            {isInitializing ? "Starting camera..." : "Camera stopped"}
          </div>
        </div>
      )}
    </div>
  );
}