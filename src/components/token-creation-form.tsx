"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useTokenCreation } from "@/service/token/token-extensions/token-creation";
import { useIsMobile } from "@/hooks/use-mobile";
import { TokenTypeSelector } from "./token-creation/token-type-selector";
import { TokenBasicFields } from "./token-creation/token-basic-fields";
import { SocialLinksFields } from "./token-creation/social-links-fields";
import { TokenExtensionsSidebar } from "./token-creation/token-extensions-sidebar";
import React from "react";
import type { TokenFormValues } from "./token-creation/types";

export const TokenCreationForm = () => {
  const isMobile = useIsMobile();
  const {
    selectedExtensions,
    uploadingImage,
    formErrors,
    tokenData,
    validationErrors,
    handleImageUpload,
    toggleExtension,
    updateExtensionOption,
    handleCreateToken,
    setTokenData
  } = useTokenCreation();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<'spl' | 'extensions'>('spl');
  const initializedRef = useRef(false);

  const formSchema = z.object({
    name: z.string().optional(),
    symbol: z.string().max(10, { message: "Token symbol must not exceed 10 characters" }).optional(),
    decimals: z.string().refine(val => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 9;
    }, { message: "Decimals must be a number between 0-9" }),
    supply: z.string().refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, { message: "Supply must be greater than 0" }),
    description: z.string().optional(),
    websiteUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    twitterUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    telegramUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    discordUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal(""))
  });

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: "9",
      supply: "1000000",
      description: "",
      websiteUrl: "",
      twitterUrl: "",
      telegramUrl: "",
      discordUrl: ""
    },
  });

  const initializeTokenData = useCallback(() => {
    if (initializedRef.current) return;
    
    setTokenData({
      name: "",
      symbol: "",
      decimals: "9",
      supply: "1000000",
      description: "",
      image: null,
      imageUrl: "",
      extensionOptions: {},
      websiteUrl: "",
      twitterUrl: "",
      telegramUrl: "",
      discordUrl: ""
    });

    form.reset({
      name: "",
      symbol: "",
      decimals: "9",
      supply: "1000000",
      description: "",
      websiteUrl: "",
      twitterUrl: "",
      telegramUrl: "",
      discordUrl: ""
    });
    
    initializedRef.current = true;
  }, [form, setTokenData]);

  useEffect(() => {
    initializeTokenData();
  }, [initializeTokenData]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const prevTokenData = JSON.stringify(tokenData);
      const newTokenData = JSON.stringify({
        ...tokenData,
        name: value.name || "",
        symbol: value.symbol || "",
        decimals: value.decimals || "9",
        supply: value.supply || "1000000",
        description: value.description || "",
        websiteUrl: value.websiteUrl || "",
        twitterUrl: value.twitterUrl || "",
        telegramUrl: value.telegramUrl || "",
        discordUrl: value.discordUrl || "",
      });

      if (prevTokenData !== newTokenData) {
        setTokenData(prev => ({
          ...prev,
        name: value.name || "",
        symbol: value.symbol || "",
        decimals: value.decimals || "9",
        supply: value.supply || "1000000",
        description: value.description || "",
        websiteUrl: value.websiteUrl || "",
        twitterUrl: value.twitterUrl || "",
        telegramUrl: value.telegramUrl || "",
        discordUrl: value.discordUrl || "",
      }));
      }
    });

    return () => subscription.unsubscribe();
  }, [form, setTokenData, tokenData]);

  const handleTokenTypeChange = (type: 'spl' | 'extensions') => {
    setTokenType(type);
    // Save token type to localStorage for later use
    setTokenData(prev => ({
      ...prev,
      tokenType: type
    }));
  };

  const onSubmit = () => {
    if (tokenType === 'spl') {
      // SPL Token validation
      if (!form.getValues('name')) {
        form.setError('name', { type: 'manual', message: 'Token name is required for SPL tokens' });
        return;
      }

      if (!form.getValues('symbol')) {
        form.setError('symbol', { type: 'manual', message: 'Token symbol is required for SPL tokens' });
        return;
      }

      if (!imagePreview && !tokenData.imageUrl) {
        toast.error("Please upload a token image for SPL tokens");
        return;
      }
    } else {
      // Token Extensions validation
    const hasMetadataExtension = selectedExtensions.includes("metadata") || selectedExtensions.includes("metadata-pointer");

    if (hasMetadataExtension) {
      if (!form.getValues('name')) {
        form.setError('name', { type: 'manual', message: 'Token name is required' });
        return;
      }

      if (!form.getValues('symbol')) {
        form.setError('symbol', { type: 'manual', message: 'Token symbol is required' });
        return;
      }

      if (!imagePreview && !tokenData.imageUrl) {
        toast.error("Please upload a token image");
        return;
        }
      }
    }

    handleCreateToken();
  };

  return (
    <div className={`md:p-3 mx-auto my-2`}>
      <h1 className="text-2xl font-bold text-gray-900 sm:mb-6 flex items-center justify-center">
        Create Token
      </h1>
      
      {/* Token Type Selector - đặt bên trên bảng nhập thông tin */}
      <div className="flex justify-center mb-6">
        <TokenTypeSelector 
          tokenType={tokenType}
          onTokenTypeChange={handleTokenTypeChange}
        />
      </div>

      <div className="pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className={`pt-6 px-1 pb-2 ${!isMobile && "border-gear"}`}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${!isMobile && "max-h-[calc(100vh-200px)] overflow-y-auto px-2"}`}>

                  <TokenBasicFields
                    control={form.control}
                    tokenType={tokenType}
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
                    uploadingImage={uploadingImage}
                    formErrors={formErrors}
                    onImageUpload={handleImageUpload}
                  />

                  <SocialLinksFields control={form.control} />

                  <Button type="submit" className="w-full cursor-pointer">Continue to Review</Button>
                </form>
              </Form>
            </div>
          </div>

          {tokenType === 'extensions' && (
            <div>
              <TokenExtensionsSidebar
                selectedExtensions={selectedExtensions}
                tokenData={tokenData}
                validationErrors={validationErrors}
                onToggleExtension={toggleExtension}
                onUpdateExtensionOption={updateExtensionOption}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 