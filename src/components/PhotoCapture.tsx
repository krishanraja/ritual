/**
 * PhotoCapture Component
 * 
 * Handles photo selection, compression, and upload to Supabase storage.
 * Compresses images client-side before upload for better performance.
 * 
 * @created 2025-12-11
 */

import { useState, useRef } from 'react';
import { Camera, X, Loader2, Check, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PhotoCaptureProps {
  coupleId: string;
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Compress image using canvas
const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function PhotoCapture({ coupleId, onUploadComplete, onError, className }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('Image too large. Please select an image under 10MB');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Start upload
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);

    try {
      // Compress image
      setUploadProgress(20);
      const compressedBlob = await compressImage(file);
      setUploadProgress(40);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${coupleId}/${timestamp}.jpg`;

      // Upload to Supabase storage
      setUploadProgress(60);
      const { data, error } = await supabase.storage
        .from('ritual-photos')
        .upload(filename, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ritual-photos')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      setUploadComplete(true);

      console.log('[PhotoCapture] Upload successful:', urlData.publicUrl);
      onUploadComplete(urlData.publicUrl);
    } catch (error) {
      console.error('[PhotoCapture] Upload failed:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.button
            key="capture-button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 rounded-xl bg-primary/5 border-2 border-primary/20 border-dashed hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Add a photo</p>
                <p className="text-xs text-muted-foreground mt-1">Capture this memory</p>
              </div>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />

            {/* Upload overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-white text-sm">Uploading...</p>
              </div>
            )}

            {/* Success overlay */}
            {uploadComplete && !uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            )}

            {/* Remove button */}
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Add another photo button */}
            {uploadComplete && !uploading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-white/90 flex items-center gap-1.5 text-sm font-medium text-foreground hover:bg-white transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                Change
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
