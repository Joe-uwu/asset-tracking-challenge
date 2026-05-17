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
      <div className="flex items-center justify-center p-4">
        <button
          onClick={startScanning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Camera Scan
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px]">
      <div id="reader" className="w-full h-full" />
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