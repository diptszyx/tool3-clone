"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useTokenCreation, tokenExtensions } from "@/service/token/token-extensions/token-creation";
import { useSPLTokenCreation, SPLTokenData } from "@/service/token/spl-token/spl-token-creation";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";


import { TokenTypeSelector } from "@/components/token-creation/token-type-selector";
import { TokenBasicFields } from "@/components/token-creation/token-basic-fields";
import { SocialLinksFields } from "@/components/token-creation/social-links-fields";
import { TokenExtensionsSidebar } from "@/components/token-creation/token-extensions-sidebar";

// Type for extensions token data
type ExtensionsTokenData = {
  name: string;
  symbol: string;
  decimals: string;
  supply: string;
  description: string;
  image: File | null;
  imageUrl: string;
  extensionOptions: Record<string, Record<string, string | number | undefined>>;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  discordUrl: string;
};

export const TokenCreationForm = () => {
  const isMobile = useIsMobile();

  // Token type state
  const [tokenType, setTokenType] = useState<'spl' | 'extensions'>('spl');

  const {
    selectedExtensions,
    uploadingImage: extensionsUploadingImage,
    formErrors: extensionsFormErrors,
    tokenData: extensionsTokenData,
    validationErrors,
    handleImageUpload: extensionsHandleImageUpload,
    toggleExtension,
    updateExtensionOption,
    handleCreateToken: extensionsHandleCreateToken,
    setTokenData: extensionsSetTokenData
  } = useTokenCreation();

  // SPL Token hooks
  const {
    uploadingImage: splUploadingImage,
    formErrors: splFormErrors,
    tokenData: splTokenData,
    handleImageUpload: splHandleImageUpload,
    handleCreateToken: splHandleCreateToken,
    setTokenData: splSetTokenData
  } = useSPLTokenCreation();

  // Derived state based on token type
  const uploadingImage = tokenType === 'spl' ? splUploadingImage : extensionsUploadingImage;
  const formErrors = tokenType === 'spl' ? splFormErrors : extensionsFormErrors;
  const tokenData = tokenType === 'spl' ? splTokenData : extensionsTokenData;
  const handleImageUpload = tokenType === 'spl' ? splHandleImageUpload : extensionsHandleImageUpload;
  const handleCreateToken = tokenType === 'spl' ? splHandleCreateToken : extensionsHandleCreateToken;
  const setTokenData = tokenType === 'spl' ? splSetTokenData : extensionsSetTokenData;

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const initializedRef = useRef<boolean>(false);

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

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
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
  }, [form, setTokenData]);

  useEffect(() => {
    if (!initializedRef.current) {
    initializeTokenData();
      initializedRef.current = true;
    }
  }, [initializeTokenData]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (tokenType === 'spl') {
        splSetTokenData((previousData: SPLTokenData) => {
          const nextData = {
            ...previousData,
            name: value.name || "",
            symbol: value.symbol || "",
            decimals: value.decimals || "9",
            supply: value.supply || "1000000",
            description: value.description || "",
            websiteUrl: value.websiteUrl || "",
            twitterUrl: value.twitterUrl || "",
            telegramUrl: value.telegramUrl || "",
            discordUrl: value.discordUrl || "",
          };

          // Tránh set state khi dữ liệu không thay đổi để ngăn vòng lặp render
          const isShallowEqual = (
            previous: SPLTokenData,
            next: SPLTokenData
          ) => {
            return (
              previous.name === next.name &&
              previous.symbol === next.symbol &&
              previous.decimals === next.decimals &&
              previous.supply === next.supply &&
              previous.description === next.description &&
              previous.websiteUrl === next.websiteUrl &&
              previous.twitterUrl === next.twitterUrl &&
              previous.telegramUrl === next.telegramUrl &&
              previous.discordUrl === next.discordUrl
            );
          };

          if (isShallowEqual(previousData, nextData)) {
            return previousData;
          }

          return nextData;
        });
      } else {
        extensionsSetTokenData((previousData: ExtensionsTokenData) => {
          const nextData = {
            ...previousData,
            name: value.name || "",
            symbol: value.symbol || "",
            decimals: value.decimals || "9",
            supply: value.supply || "1000000",
            description: value.description || "",
            websiteUrl: value.websiteUrl || "",
            twitterUrl: value.twitterUrl || "",
            telegramUrl: value.telegramUrl || "",
            discordUrl: value.discordUrl || "",
          };

          // Tránh set state khi dữ liệu không thay đổi để ngăn vòng lặp render
          const isShallowEqual = (
            previous: ExtensionsTokenData,
            next: ExtensionsTokenData
          ) => {
            return (
              previous.name === next.name &&
              previous.symbol === next.symbol &&
              previous.decimals === next.decimals &&
              previous.supply === next.supply &&
              previous.description === next.description &&
              previous.websiteUrl === next.websiteUrl &&
              previous.twitterUrl === next.twitterUrl &&
              previous.telegramUrl === next.telegramUrl &&
              previous.discordUrl === next.discordUrl
            );
          };

          if (isShallowEqual(previousData, nextData)) {
            return previousData;
          }

          return nextData;
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, tokenType, splSetTokenData, extensionsSetTokenData]);

  // Keep imageUrl in sync between SPL and Extensions flows so switching does not lose the uploaded image
  useEffect(() => {
    if (extensionsTokenData.imageUrl && !splTokenData.imageUrl) {
      splSetTokenData(prev => ({ ...prev, imageUrl: extensionsTokenData.imageUrl }));
    } else if (splTokenData.imageUrl && !extensionsTokenData.imageUrl) {
      extensionsSetTokenData(prev => ({ ...prev, imageUrl: splTokenData.imageUrl }));
    }
  }, [extensionsTokenData.imageUrl, splTokenData.imageUrl, splSetTokenData, extensionsSetTokenData]);

  // Ensure the preview is shown based on whichever image URL is currently active
  useEffect(() => {
    const currentUrl = tokenType === 'spl' ? splTokenData.imageUrl : extensionsTokenData.imageUrl;
    if (!imagePreview && currentUrl) {
      setImagePreview(currentUrl);
    }
  }, [tokenType, splTokenData.imageUrl, extensionsTokenData.imageUrl, imagePreview]);


  const onSubmit = () => {
    if (tokenType === 'spl') {
      // SPL tokens always require metadata
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

      <TokenTypeSelector
        tokenType={tokenType}
        onTokenTypeChange={setTokenType}
      />

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
        formErrors={formErrors as Record<string, string | undefined>}
        onImageUpload={handleImageUpload}
      />

                  <SocialLinksFields form={form} />

                  <Button type="submit" className="w-full cursor-pointer">Continue to Review</Button>
                </form>
              </Form>
            </div>
          </div>

          {tokenType === 'extensions' ? (
            <TokenExtensionsSidebar
              selectedExtensions={selectedExtensions}
              tokenData={extensionsTokenData}
              validationErrors={validationErrors}
              onToggleExtension={(extensionId: string) => toggleExtension(extensionId, tokenExtensions)}
              onUpdateExtensionOption={updateExtensionOption}
            />
          ) : (
          <div className="space-y-4 mb-8">
            <div className="sticky top-4">
              <div className={`pt-2 px-1 pb-1 ${!isMobile && "border-gear"}`}>
                  <h3 className="text-lg text-center font-medium mb-4">SPL Token</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Metaplex Metadata Program</h4>
                        <p className="text-sm text-gray-700">
                          SPL tokens use the Metaplex Metadata Program to store token information.
                          This is the standard approach for most tokens on Solana and provides
                          compatibility with wallets, exchanges, and DeFi protocols.
                        </p>
                        <ul className="mt-2 text-sm text--700 list-disc list-inside space-y-1">
                          <li>Standard token format</li>
                          <li>Wide ecosystem compatibility</li>
                          <li>Metadata stored in separate account</li>
                          <li>Lower transaction costs</li>
                        </ul>
                                  </div>
                                </div>
                              </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 