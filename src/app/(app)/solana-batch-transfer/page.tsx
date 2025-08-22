import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Solana Batch Transfer - Tool3",
  description: "Efficiently transfer SOL and SPL tokens in batches with our Solana batch transfer tool. Streamline your token distribution process with advanced batch processing capabilities.",
};

export default function SolanaBatchTransferPage() {
  redirect("/solana-multisender");
}
