import { useState, useEffect } from "react";
import { checkRPCSpeed } from "@/lib/increase/rpc";
import { RPCStatus } from "@/lib/increase/types";

export const useRPCValidation = (rpcUrl?: string) => {
  const [status, setStatus] = useState<RPCStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!rpcUrl?.trim()) {
      setStatus(null);
      return;
    }

    setIsChecking(true);
    const timeoutId = setTimeout(async () => {
      try {
        const rpcStatus = await checkRPCSpeed(rpcUrl);
        setStatus(rpcStatus);
      } catch {
        setStatus({ isValid: false, latency: 0, error: "Connection failed" });
      } finally {
        setIsChecking(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [rpcUrl]);

  return { status, isChecking };
};
