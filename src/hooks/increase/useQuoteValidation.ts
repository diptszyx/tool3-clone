import { useState, useCallback } from "react";
import { getJupiterQuote } from "@/service/jupiter/swap";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "sonner";
import { QuoteStatus, getDexDisplayName } from "@/lib/increase/types";

export const useQuoteValidation = () => {
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>({
    isValid: false,
    isChecking: false,
  });

  const validateQuote = useCallback(
    async (tokenMint: string, dexType: string) => {
      setQuoteStatus({ isValid: false, isChecking: true });

      try {
        const SOL_MINT = "So11111111111111111111111111111111111111112";
        const testAmount = Math.round(0.001 * LAMPORTS_PER_SOL);

        let dexes: string[] | undefined;
        let allowFallback = false;

        if (dexType === "Raydium,Meteora,Orca+V2") {
          allowFallback = true;
          dexes = dexType.split(",").map((d) => d.trim());
        } else {
          dexes = [dexType];
        }

        try {
          const quote = await getJupiterQuote(
            SOL_MINT,
            tokenMint,
            testAmount,
            undefined,
            dexes
          );

          if (quote?.routePlan?.length > 0) {
            setQuoteStatus({ isValid: true, isChecking: false });
          } else {
            throw new Error("No route found");
          }
        } catch {
          if (allowFallback) {
            const fallbackQuote = await getJupiterQuote(
              SOL_MINT,
              tokenMint,
              testAmount,
              undefined,
              undefined
            );

            if (fallbackQuote?.routePlan?.length > 0) {
              setQuoteStatus({ isValid: true, isChecking: false });
            } else {
              throw new Error("No fallback route");
            }
          } else {
            const dexName = getDexDisplayName(dexType);
            toast.message("Incompatible DEX selected. Please choose another.");
            setQuoteStatus({
              isValid: false,
              isChecking: false,
              error: `No route available for ${dexName}`,
            });
          }
        }
      } catch {
        setQuoteStatus({
          isValid: false,
          isChecking: false,
          error: "Failed to check quote",
        });
      }
    },
    []
  );

  return { quoteStatus, validateQuote };
};
