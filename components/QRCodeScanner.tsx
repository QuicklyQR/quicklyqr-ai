'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { QRData, createInitialQRData } from '../lib/qr-utils';

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permission, setPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Request camera permission and setup video stream
  useEffect(() => {
    const setupCamera = async () => {
      try {
        setScanning(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermission(true);
          setError(null);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setPermission(false);
        setError('Camera access denied. Please allow camera access to scan QR codes.');
      }
    };

    setupCamera();

    // Cleanup function to stop all streams when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Start QR code detection when video is ready
  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const detectQRCode = async () => {
      if (!videoRef.current || !canvasRef.current || !context) return;

      try {
        // Only process frames if video is playing and scanner is active
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && scanning) {
          // Set canvas dimensions to match video
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;

          // Draw current video frame to canvas
          context.drawImage(
            videoRef.current,
            0,
            0,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight
          );

          // Get image data for QR code detection
          const imageData = context.getImageData(
            0,
            0,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight
          );

          // Use BarcodeDetector API if available
          if ('BarcodeDetector' in window) {
            try {
              // @ts-ignore - BarcodeDetector is not in TypeScript's lib.dom yet
              const barcodeDetector = new BarcodeDetector({
                formats: ['qr_code'],
              });

              const barcodes = await barcodeDetector.detect(imageData);
              if (barcodes.length > 0) {
                // QR code detected
                setScanning(false);
                onScanSuccess(barcodes[0].rawValue);
                return;
              }
            } catch (err) {
              console.error('Barcode detection error:', err);
            }
          }
        }
      } catch (err) {
        console.error('QR detection error:', err);
      }

      // Continue scanning if no QR code was detected
      if (scanning) {
        animationRef.current = requestAnimationFrame(detectQRCode);
      }
    };

    // Start the detection loop
    detectQRCode();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close scanner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <div className="flex">
              <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
          {permission === false ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <Camera className="mb-2 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Camera access is required to scan QR codes.</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
                onPlay={handleVideoPlay}
              />
              <canvas ref={canvasRef} className="absolute inset-0 hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-lg border-4 border-white border-opacity-50"></div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Position the QR code within the frame to scan</p>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
