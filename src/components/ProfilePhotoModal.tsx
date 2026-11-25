import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Check,
  Circle,
  RectangleHorizontal,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export type ProfileCropShape = 'circle' | 'rectangle';

interface DpViewerLightboxProps {
  isOpen: boolean;
  photoURL: string;
  displayName: string;
  shape?: ProfileCropShape;
  onClose: () => void;
  isUrdu?: boolean;
}

export const DpViewerLightbox: React.FC<DpViewerLightboxProps> = ({
  isOpen,
  photoURL,
  displayName,
  shape = 'rectangle',
  onClose,
  isUrdu = false
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !photoURL || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isUrdu ? 'پروفائل تصویر' : 'Profile Picture'}
      onClick={onClose}
      className="fixed inset-0 z-[120] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg flex flex-col items-center gap-4"
      >
        <div className="w-full flex items-center justify-between text-white px-1">
          <span className="font-display font-bold text-sm truncate">{displayName}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={isUrdu ? 'بند کریں' : 'Close'}
            className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isUrdu ? 'بند کریں' : 'Close'}</span>
          </button>
        </div>

        <div
          className={`relative max-w-full max-h-[76dvh] overflow-hidden border-2 border-white/25 shadow-2xl bg-[#0b3322] ${
            shape === 'circle' ? 'rounded-full aspect-square w-72 sm:w-96' : 'rounded-3xl'
          }`}
        >
          <img
            src={photoURL}
            alt={displayName}
            className={`max-h-[76dvh] max-w-full ${
              shape === 'circle' ? 'w-full h-full object-cover' : 'object-contain'
            }`}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

interface DpCameraCropModalProps {
  isOpen: boolean;
  initialPhotoURL?: string | null;
  initialShape?: ProfileCropShape;
  onClose: () => void;
  onSavePhoto: (croppedDataUrl: string, shape: ProfileCropShape) => void;
  onRemovePhoto?: () => void;
  isUrdu?: boolean;
}

export const DpCameraCropModal: React.FC<DpCameraCropModalProps> = ({
  isOpen,
  initialPhotoURL,
  initialShape = 'circle',
  onClose,
  onSavePhoto,
  onRemovePhoto,
  isUrdu = false
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(initialPhotoURL || null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const [cropShape, setCropShape] = useState<ProfileCropShape>(initialShape);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const boxWidth = cropShape === 'circle' ? 240 : 288;
  const boxHeight = cropShape === 'circle' ? 240 : 204;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    setSourceImage(initialPhotoURL || null);
    setCropShape(initialShape);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setCameraError(null);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopCamera();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      stopCamera();
    };
  }, [isOpen, initialPhotoURL, initialShape, stopCamera, onClose]);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          isUrdu ? 'اس براؤزر میں کیمرہ دستیاب نہیں ہے۔' : 'Camera is unavailable in this browser.'
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : isUrdu
          ? 'کیمرہ کھولنے کی اجازت نہیں ملی۔ براہ کرم تصویر اپلوڈ کریں۔'
          : 'Could not open camera. Please allow camera access or upload a photo.'
      );
      setCameraActive(false);
    }
  };

  const captureFromCamera = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const w = vid.videoWidth || 640;
    const h = vid.videoHeight || 640;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(vid, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setSourceImage(dataUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setSourceImage(String(reader.result || ''));
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const baseScale = Math.max(
    boxWidth / Math.max(1, naturalSize.w),
    boxHeight / Math.max(1, naturalSize.h)
  );
  const totalScale = baseScale * zoom;
  const dispW = naturalSize.w * totalScale;
  const dispH = naturalSize.h * totalScale;

  const clampOffset = useCallback(
    (nx: number, ny: number, targetZoom = zoom, shape = cropShape) => {
      const bw = shape === 'circle' ? 240 : 288;
      const bh = shape === 'circle' ? 240 : 204;
      const bScale = Math.max(bw / Math.max(1, naturalSize.w), bh / Math.max(1, naturalSize.h));
      const dw = naturalSize.w * bScale * targetZoom;
      const dh = naturalSize.h * bScale * targetZoom;
      const maxX = Math.max(0, (dw - bw) / 2);
      const maxY = Math.max(0, (dh - bh) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, nx)),
        y: Math.min(maxY, Math.max(-maxY, ny))
      };
    },
    [zoom, cropShape, naturalSize.w, naturalSize.h]
  );

  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, cropShape));
  }, [zoom, cropShape, naturalSize, clampOffset]);

  const handleSaveCropped = async () => {
    if (!sourceImage) return;
    setSaving(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = sourceImage;
      });

      const outW = cropShape === 'circle' ? 320 : 384;
      const outH = cropShape === 'circle' ? 320 : 272;
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const outScaleX = outW / boxWidth;
      const outScaleY = outH / boxHeight;
      const drawW = dispW * outScaleX;
      const drawH = dispH * outScaleY;
      const drawX = outW / 2 + offset.x * outScaleX - drawW / 2;
      const drawY = outH / 2 + offset.y * outScaleY - drawH / 2;

      ctx.fillStyle = '#0b3322';
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.86);
      onSavePhoto(croppedUrl, cropShape);
      onClose();
    } catch {
      // Fallback: if crossOrigin blocks canvas export on remote photo, keep original
      onSavePhoto(sourceImage, cropShape);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isUrdu ? 'پروفائل تصویر کیمرہ اور کراپ' : 'Profile Photo & Crop'}
      onClick={() => {
        stopCamera();
        onClose();
      }}
      className="fixed inset-0 z-[120] bg-[#13281c]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#faf8f2] border border-[#cbdcd0] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="px-5 py-4 bg-[#14532d] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <h2 className="font-display text-sm sm:text-base font-extrabold truncate">
              {isUrdu ? 'پروفائل تصویر اور کراپ' : 'Profile Photo & Crop'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label={isUrdu ? 'بند کریں' : 'Close'}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Source Switcher: Camera or Upload */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void startCamera(facingMode)}
              className={`min-h-[42px] px-3 py-2 rounded-xl border font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                cameraActive
                  ? 'bg-[#14532d] text-white border-[#14532d]'
                  : 'bg-white hover:bg-[#edf5ef] border-[#cbdcd0] text-[#13281c]'
              }`}
            >
              <Camera className="w-4 h-4 text-[#f59e0b]" />
              <span>{isUrdu ? 'کیمرہ کھولیں' : 'Take Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-[#edf5ef] border border-[#cbdcd0] text-[#13281c] font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 text-[#166534]" />
              <span>{isUrdu ? 'گیلری سے اپلوڈ' : 'Upload Photo'}</span>
            </button>
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] text-xs font-semibold">
              {cameraError}
            </div>
          )}

          {/* Live Camera Viewport */}
          {cameraActive ? (
            <div className="rounded-2xl bg-[#13281c] border border-[#cbdcd0] overflow-hidden relative flex flex-col items-center">
              <div className="relative w-full h-72 flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className={`border-2 border-white/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ${
                      cropShape === 'circle' ? 'w-52 h-52 rounded-full' : 'w-64 h-44 rounded-2xl'
                    }`}
                  />
                </div>
              </div>

              <div className="w-full p-3 bg-[#0b3322] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = facingMode === 'user' ? 'environment' : 'user';
                    setFacingMode(nextMode);
                    void startCamera(nextMode);
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'کیمرہ بدلیں' : 'Flip'}</span>
                </button>

                <button
                  type="button"
                  onClick={captureFromCamera}
                  className="min-h-[40px] px-5 py-1.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isUrdu ? 'تصویر کھینچیں' : 'Capture'}</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : sourceImage ? (
            /* Preview & Interactive Cropper */
            <div className="space-y-3.5">
              {/* Shape Picker: Circle vs Rectangle */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#3d5947]">
                  {isUrdu ? 'فریم کی شکل:' : 'Crop Frame:'}
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#edf5ef] border border-[#cbdcd0]">
                  <button
                    type="button"
                    onClick={() => setCropShape('circle')}
                    className={`min-h-[32px] px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                      cropShape === 'circle'
                        ? 'bg-[#14532d] text-white'
                        : 'text-[#3d5947] hover:text-[#13281c]'
                    }`}
                  >
                    <Circle className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'گول (Circle)' : 'Circle'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropShape('rectangle')}
                    className={`min-h-[32px] px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                      cropShape === 'rectangle'
                        ? 'bg-[#14532d] text-white'
                        : 'text-[#3d5947] hover:text-[#13281c]'
                    }`}
                  >
                    <RectangleHorizontal className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'مستطیل (Rectangle)' : 'Rectangle'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Draggable Crop Viewport */}
              <div className="w-full py-3 rounded-2xl bg-[#13281c] flex flex-col items-center justify-center gap-2 select-none">
                <div
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    dragStateRef.current = {
                      active: true,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: offset.x,
                      origY: offset.y
                    };
                  }}
                  onPointerMove={(e) => {
                    if (!dragStateRef.current.active) return;
                    const dx = e.clientX - dragStateRef.current.startX;
                    const dy = e.clientY - dragStateRef.current.startY;
                    setOffset(
                      clampOffset(
                        dragStateRef.current.origX + dx,
                        dragStateRef.current.origY + dy
                      )
                    );
                  }}
                  onPointerUp={() => {
                    dragStateRef.current.active = false;
                  }}
                  onPointerCancel={() => {
                    dragStateRef.current.active = false;
                  }}
                  style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
                  className={`relative overflow-hidden border-2 border-[#fde68a] shadow-xl bg-[#0b3322] cursor-grab active:cursor-grabbing touch-none ${
                    cropShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                  }`}
                >
                  <img
                    src={sourceImage}
                    alt="Crop preview"
                    draggable={false}
                    onLoad={(e) => {
                      const imgEl = e.currentTarget;
                      setNaturalSize({
                        w: imgEl.naturalWidth || 1,
                        h: imgEl.naturalHeight || 1
                      });
                    }}
                    style={{
                      width: `${dispW}px`,
                      height: `${dispH}px`,
                      left: `calc(50% + ${offset.x}px)`,
                      top: `calc(50% + ${offset.y}px)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className="absolute max-w-none max-h-none pointer-events-none select-none"
                  />
                </div>
                <span className="text-[10px] font-mono text-[#d1fae5]/85">
                  {isUrdu ? 'تصویر سیٹ کرنے کے لیے کھینچیں اور زوم کریں' : 'Drag photo to position · Use slider to zoom'}
                </span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white border border-[#cbdcd0]">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, Number((z - 0.15).toFixed(2))))}
                  aria-label="Zoom out"
                  className="p-1.5 rounded-lg hover:bg-[#edf5ef] text-[#3d5947] cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Crop zoom"
                  className="flex-1 accent-[#14532d] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
                  aria-label="Zoom in"
                  className="p-1.5 rounded-lg hover:bg-[#edf5ef] text-[#3d5947] cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  title="Reset crop"
                  className="p-1.5 rounded-lg hover:bg-[#edf5ef] text-[#3d5947] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-[#cbdcd0] bg-white text-center space-y-2">
              <Camera className="w-9 h-9 text-[#14532d] mx-auto opacity-80" />
              <div className="font-bold text-[#13281c]">
                {isUrdu ? 'پروفائل تصویر منتخب کریں' : 'Choose or Take a Profile Picture'}
              </div>
              <p className="text-[11px] text-[#5b7463]">
                {isUrdu
                  ? 'کیمرے سے تصویر کھینچیں یا گیلری سے منتخب کر کے گول یا مستطیل فریم میں کراپ کریں۔'
                  : 'Capture from camera or upload from your device, then preview and crop as a circle or rectangle.'}
              </p>
            </div>
          )}

          {/* Save / Remove Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {onRemovePhoto && initialPhotoURL ? (
              <button
                type="button"
                onClick={() => {
                  onRemovePhoto();
                  onClose();
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'تصویر ہٹائیں' : 'Remove'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#cbdcd0] text-[#3d5947] font-bold cursor-pointer"
              >
                {isUrdu ? 'منسوخ' : 'Cancel'}
              </button>

              {sourceImage && !cameraActive && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveCropped()}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#14532d] hover:bg-[#0f3d21] text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUrdu ? 'تصویر محفوظ کریں' : 'Save Photo'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
