'use client';

import { useRef } from 'react';
import { Control } from 'react-hook-form';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { TokenFormValues } from './types';

interface TokenBasicFieldsProps {
  control: Control<TokenFormValues>;
  tokenType: 'spl' | 'extensions';
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  uploadingImage: boolean;
  formErrors: Record<string, string | undefined>;
  onImageUpload: (file: File) => void;
}

export const TokenBasicFields = ({
  control,
  tokenType,
  imagePreview,
  setImagePreview,
  uploadingImage,
  formErrors,
  onImageUpload,
}: TokenBasicFieldsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (typeof onImageUpload === 'function') {
        onImageUpload(file);
      } else {
        console.error('onImageUpload chưa được định nghĩa hoặc không phải là function');
      }
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current && !uploadingImage) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Name {tokenType === 'spl' ? '*' : ''}</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Moon Token"
                  {...field}
                  className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Symbol {tokenType === 'spl' ? '*' : ''}</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. MOON"
                  {...field}
                  className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="decimals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decimals</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  {...field}
                  className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="supply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Supply</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. 1000000"
                  {...field}
                  className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Token Description (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="A brief description of your token"
                {...field}
                className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel>Token Image {tokenType === 'spl' ? '*' : ''}</FormLabel>
        <div className="flex items-start gap-4">
          <div
            className="w-24 h-24 border border-gear-gray rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={handleImageClick}
          >
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Token preview"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="relative">
              <Input
                type="file"
                id="token-image"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="mb-2 focus:border-purple-500 focus:ring-purple-500"
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-600 rounded-full border-t-transparent"></div>
                    <span className="text-sm text-purple-600">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Upload a square image (recommended size: 256x256 pixels)
            </p>
            {formErrors.image && <p className="text-sm text-red-500 mt-1">{formErrors.image}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
