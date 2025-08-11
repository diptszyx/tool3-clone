import { useState } from "react";
import { toast } from "sonner";
import { uploadImageAndGetUrl } from "@/utils/pinata";
import { validateBasicTokenData } from "@/utils/token/token-validation";

export interface SPLTokenData {
  name: string;
  symbol: string;
  decimals: string;
  supply: string;
  description: string;
  image: File | null;
  imageUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  discordUrl: string;
}

export interface SPLTokenFormErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  supply?: string;
  image?: string;
}

export function useSPLTokenCreation() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState<SPLTokenFormErrors>({});
  const [tokenData, setTokenData] = useState<SPLTokenData>({
    name: "",
    symbol: "",
    decimals: "9",
    supply: "1000000",
    description: "",
    image: null,
    imageUrl: "",
    websiteUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    discordUrl: "",
  });

  const handleImageUpload = async (file: File) => {
    if (!file || !(file instanceof File)) {
      toast.error("No valid file selected");
      return;
    }

    setUploadingImage(true);

    try {
      const imageUrl = await uploadImageAndGetUrl(file, `spl-token-${tokenData.name.toLowerCase()}`);    
      setTokenData(prev => ({
        ...prev,
        image: file,
        imageUrl: imageUrl
      }));
      if (formErrors.image) {
        setFormErrors({...formErrors, image: undefined});
      }

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setFormErrors({...formErrors, image: "Could not upload image, please try again"});
    } finally {
      setUploadingImage(false);
    }
  };

  const validateTokenData = (): boolean => {
    // SPL tokens always require metadata (name, symbol, image)
    const basicValidation = validateBasicTokenData({
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      supply: tokenData.supply,
      imageUrl: tokenData.imageUrl
    }, true); // Always require metadata for SPL tokens
    
    setFormErrors(basicValidation.errors);
    return basicValidation.isValid;
  };

  const handleCreateToken = async () => {
    if (!validateTokenData()) {
      toast.error("Please fix the validation errors");
      return;
    }

    // Save data to localStorage and redirect to review page
    if (typeof window !== 'undefined') {
      const dataToSave = {
        tokenType: 'spl',
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        supply: tokenData.supply,
        description: tokenData.description,
        imageUrl: tokenData.imageUrl,
        websiteUrl: tokenData.websiteUrl,
        twitterUrl: tokenData.twitterUrl,
        telegramUrl: tokenData.telegramUrl,
        discordUrl: tokenData.discordUrl
      };
      localStorage.setItem('tokenData', JSON.stringify(dataToSave));
      
      const currentUrl = new URL(window.location.href);
      const cluster = currentUrl.searchParams.get('cluster');
      const redirectUrl = cluster ? `/create/review?cluster=${cluster}` : '/create/review';
      
      window.location.href = redirectUrl;
    }
  };

  return {
    uploadingImage,
    formErrors,
    tokenData,
    handleImageUpload,
    handleCreateToken,
    setTokenData,
    validateTokenData
  };
}
