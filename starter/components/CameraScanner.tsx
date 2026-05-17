'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isStarting, setIsStarting] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cancelledRef = useRef(false);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await scanner.stop();
      } catch (error) {
        // Ignore stop errors during teardown.
      }

      try {
        await scanner.clear();
      } catch (error) {
        // Ignore clear errors during teardown.
      }
    }

    setIsScanning(false);
    setIsStarting(false);
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    const startCamera = async () => {
      try {
        setIsStarting(true);

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

        if (cancelledRef.current) {
          return;
        }

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          setIsStarting(false);
          onError?.('No cameras found');
          return;
        }

        const primaryCamera = cameras[0];
        if (!primaryCamera) {
          setIsStarting(false);
          onError?.('No cameras found');
          return;
        }

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          primaryCamera.id,
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText: string) => {
            onScan(decodedText);
            onScanComplete?.();
          },
          (errorMessage: string) => {
            onError?.(`QR Code scanning error: ${errorMessage}`);
          }
        );

        if (!cancelledRef.current) {
          setIsScanning(true);
          setIsStarting(false);
        } else {
          await stopCamera();
        }
      } catch (error) {
        if (!cancelledRef.current) {
          setIsScanning(false);
          setIsStarting(false);
          onError?.(`Error initializing camera: ${error}`);
        }
      }
    };

    void startCamera();

    return () => {
      cancelledRef.current = true;
      void stopCamera();
    };
  }, [onError, onScan, onScanComplete, stopCamera]);

  return (
    <div className="relative w-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-300 bg-black">
      <div
        id="qr-reader"
        className="h-[320px] w-full overflow-hidden bg-black [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&>video]:bg-black [&>div]:h-full [&>div]:w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 text-sm text-white/90">
        Camera viewfinder
      </div>
      {isStarting && !isScanning ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
            Starting camera...
          </div>
        </div>
      ) : null}
    </div>
  );
}