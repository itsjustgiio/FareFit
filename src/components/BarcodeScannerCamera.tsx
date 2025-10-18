/**
 * BarcodeScannerCamera Component
 * Real-time barcode scanning using device camera via react-zxing
 */

import { useZxing } from 'react-zxing';
import { useState, useEffect } from 'react';
import { X, Camera, AlertCircle, Flashlight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerCameraProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export function BarcodeScannerCamera({
  onBarcodeDetected,
  onClose,
  isActive,
}: BarcodeScannerCameraProps) {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const barcode = result.getText();
      console.log('📷 Barcode detected by camera:', barcode);
      console.log('🔢 Barcode length:', barcode.length);
      console.log('📋 Barcode format:', result.getBarcodeFormat());
      setResult(barcode);
      onBarcodeDetected(barcode);
    },
    onDecodeError(error) {
      // This runs constantly while scanning
      setIsScanning(true);
    },
    onError(error: any) {
      console.error('Scanner error:', error);
      if (error?.message?.includes('Permission')) {
        setError('Camera permission denied');
        setHasPermission(false);
      } else if (error?.message?.includes('NotFound')) {
        setError('No camera found on this device');
        setHasPermission(false);
      } else {
        setError('Error accessing camera');
      }
    },
    constraints: {
      video: {
        facingMode: 'environment', // Use back camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    timeBetweenDecodingAttempts: 100, // Try very frequently - every 100ms
    paused: !isActive,
  });

  // Request camera permission on mount
  useEffect(() => {
    if (isActive) {
      console.log('🎥 Starting barcode scanner...');
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then(() => {
          console.log('✅ Camera permission granted');
          setHasPermission(true);
          setError(null);
        })
        .catch((err) => {
          console.error('❌ Camera permission error:', err);
          setHasPermission(false);
          if (err.name === 'NotAllowedError') {
            setError('Camera permission denied. Please enable it in settings.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else {
            setError('Unable to access camera.');
          }
        });
    }
  }, [isActive]);

  // Toggle flashlight/torch
  const toggleTorch = async () => {
    try {
      const videoElement = ref.current;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled } as any],
          });
          setTorchEnabled(!torchEnabled);
          console.log('🔦 Torch toggled:', !torchEnabled);
        }
      }
    } catch (err) {
      console.error('Torch error:', err);
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          {/* Camera View */}
          <div className="relative w-full h-full">
            {error || hasPermission === false ? (
              // Error State
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center max-w-md">
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: '#FFE8E8' }}
                  >
                    <AlertCircle className="w-10 h-10" style={{ color: '#E53E3E' }} />
                  </div>
                  <h3 className="text-xl mb-3 text-white">Camera Access Required</h3>
                  <p className="text-gray-300 mb-6">{error}</p>
                  <div className="space-y-3">
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-lg text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#1C7C54' }}
                    >
                      Close
                    </button>
                    <p className="text-sm text-gray-400">
                      To enable camera: Settings → Privacy → Camera
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Video Feed */}
                <video
                  ref={ref}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Scan Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Dark overlay with transparent center */}
                  <div className="absolute inset-0 bg-black/50" />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-white rounded-xl"
                    style={{
                      width: '85%',
                      maxWidth: '400px',
                      height: '220px',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-xl" />

                    {/* Scanning line animation */}
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-green-400 shadow-lg"
                      style={{
                        boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)',
                      }}
                      animate={{
                        top: ['0%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </div>
                </div>

                {/* Top Bar with Close Button */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">Scan Barcode</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleTorch}
                        className={`p-2 rounded-full transition-colors ${
                          torchEnabled ? 'bg-yellow-500' : 'hover:bg-white/20'
                        }`}
                      >
                        <Flashlight className="w-6 h-6 text-white" />
                      </button>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Instructions */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="text-center">
                    {result ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-green-500 px-6 py-3 rounded-lg inline-block"
                      >
                        <p className="text-white font-medium">
                          ✓ Scanned: {result}
                        </p>
                      </motion.div>
                    ) : (
                      <div className="bg-black/50 px-6 py-3 rounded-lg inline-block backdrop-blur-sm max-w-md">
                        <p className="text-white text-sm mb-1">
                          {isScanning ? '🔍 Actively scanning...' : 'Position barcode in frame'}
                        </p>
                        <p className="text-gray-300 text-xs">
                          {isScanning
                            ? 'Hold steady • Make sure barcode is clear and well-lit'
                            : 'Aim camera at barcode'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
