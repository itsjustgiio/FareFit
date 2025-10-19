/**
 * Nutrition Label Camera Component
 * Captures photos of nutrition labels for OCR analysis
 */

import { useRef, useState, useEffect } from 'react';
import { X, Camera, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NutritionLabelCameraProps {
  onPhotoCapture: (imageBase64: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export function NutritionLabelCamera({
  onPhotoCapture,
  onClose,
  isActive,
}: NutritionLabelCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start camera when active
  useEffect(() => {
    if (isActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setError(null);
      console.log('✅ Camera started for nutrition label capture');
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please enable it in settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageBase64);

    console.log('📸 Photo captured');
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      stopCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
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
          <div className="relative w-full h-full">
            {error ? (
              // Error State
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center max-w-md">
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: '#FFE8E8' }}
                  >
                    <X className="w-10 h-10" style={{ color: '#E53E3E' }} />
                  </div>
                  <h3 className="text-xl mb-3 text-white">Camera Access Required</h3>
                  <p className="text-gray-300 mb-6">{error}</p>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-lg text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#1C7C54' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              // Preview State
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured nutrition label"
                  className="w-full h-full object-contain bg-black"
                />

                {/* Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 bg-gradient-to-t from-black via-black/95 to-transparent">
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="max-w-md mx-auto space-y-3"
                  >
                    <p className="text-center text-white text-sm font-semibold">
                      Is the nutrition label readable?
                    </p>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={handleRetake}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 border-2"
                        style={{
                          backgroundColor: '#FF3B30',
                          borderColor: '#FFF',
                          color: '#FFF',
                          boxShadow: '0 4px 20px rgba(255, 59, 48, 0.6)',
                        }}
                      >
                        <RotateCcw className="w-5 h-5" />
                        Retake
                      </motion.button>
                      <motion.button
                        onClick={handleConfirm}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 border-2"
                        style={{
                          backgroundColor: '#34C759',
                          borderColor: '#FFF',
                          color: '#FFF',
                          boxShadow: '0 4px 20px rgba(52, 199, 89, 0.6)',
                        }}
                      >
                        <Check className="w-5 h-5" />
                        Use Photo
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Top Close Button */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors ml-auto block"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              // Camera View
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-black/50" />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-white rounded-xl"
                    style={{
                      width: '85%',
                      maxWidth: '500px',
                      height: '65%',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-xl" />
                  </div>
                </div>

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">Nutrition Label</span>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Bottom Instructions & Capture Button */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="text-center mb-6">
                    <p className="text-white text-sm mb-2">
                      Align the nutrition facts label within the frame
                    </p>
                    <p className="text-gray-300 text-xs">
                      Make sure the text is clear and well-lit
                    </p>
                  </div>

                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-all mx-auto block"
                  >
                    <div className="w-16 h-16 rounded-full bg-white m-auto" />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
