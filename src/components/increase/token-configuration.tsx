import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { TokenInfo, FormData } from "@/lib/increase/types";
import { useRPCValidation } from "@/hooks/increase/useRPCValidation";

interface TokenConfigurationProps {
  selectedToken: TokenInfo | null;
  onSelectToken: () => void;
  form: UseFormReturn<FormData>;
  disabled?: boolean;
}

export const TokenConfiguration = ({
  selectedToken,
  onSelectToken,
  form,
  disabled = false,
}: TokenConfigurationProps) => {
  const rpcUrl = form.watch("rpcUrl");
  const { status: rpcStatus, isChecking } = useRPCValidation(rpcUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 h-11">
              <Image
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt="SOL"
                width={24}
                height={24}
                className="rounded-full"
              />
              SOL
            </div>
          </div>

          <div className="col-span-4">
            <button
              type="button"
              onClick={onSelectToken}
              disabled={disabled}
              className={`w-full flex items-center gap-2 p-3 border rounded-lg h-11 ${
                disabled
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {selectedToken ? (
                <>
                  <Image
                    src={selectedToken.icon}
                    alt={selectedToken.symbol}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="font-medium truncate">
                    {selectedToken.symbol}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Select token</span>
              )}
            </button>
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="rpcUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter RPC URL (optional)"
                        className="h-11 pr-24"
                        disabled={disabled}
                        {...field}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        {isChecking && (
                          <Clock className="h-4 w-4 text-gray-400 animate-spin" />
                        )}
                        {rpcStatus && !isChecking && (
                          <>
                            {rpcStatus.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-xs font-mono ${
                                rpcStatus.isValid
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {rpcStatus.isValid
                                ? `${rpcStatus.latency}ms`
                                : "Error"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
