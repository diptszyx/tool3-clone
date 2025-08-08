import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";
import { connectionDevnet, connectionMainnet } from "@/service/solana/connection";
import { TransferFeeToken, Token } from "solana-token-extension-boost";
import { ClusterType } from "@/types/types";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";


interface MintTokenRequestBody {
  walletPublicKey: string;
  mintAddress: string;
  amount: string | number;
  decimals: number;
  useToken2022?: boolean;
  recipientAddress?: string;
  cluster?: ClusterType;
}

export async function POST(req: NextRequest) {
  try {
    const body: MintTokenRequestBody = await req.json();

    if (!body.walletPublicKey || !body.mintAddress || !body.amount || body.decimals === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const connection = body.cluster === "mainnet" ? connectionMainnet : connectionDevnet;

    let walletPublicKey: PublicKey;
    let mintPublicKey: PublicKey;

    try {
      walletPublicKey = new PublicKey(body.walletPublicKey);
      mintPublicKey = new PublicKey(body.mintAddress);
      /* eslint-disable @typescript-eslint/no-unused-vars */
    } catch (_) {
      /* eslint-enable @typescript-eslint/no-unused-vars */
      return NextResponse.json(
        { error: "Invalid public key format" },
        { status: 400 }
      );
    }


    const amountValue = typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount;
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const mintAmount = BigInt(Math.floor(amountValue * Math.pow(10, body.decimals)));

  
    const recipient = body.recipientAddress
      ? new PublicKey(body.recipientAddress)
      : walletPublicKey;


    let tokenProgram = TOKEN_PROGRAM_ID;
    let mintInfo;

    // Retry logic for mint account check (sometimes takes time to propagate)
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        mintInfo = await connection.getAccountInfo(mintPublicKey, "finalized");
        if (mintInfo) {
          if (mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            tokenProgram = TOKEN_2022_PROGRAM_ID;
          }
          break; // Success, exit retry loop
        } else if (retryCount === maxRetries - 1) {
          throw new Error("Mint account does not exist. Please create the token first.");
        } else {
          console.log(`Mint account not found, retry ${retryCount + 1}/${maxRetries}`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      } catch (error) {
        console.error("Error checking mint program:", error);
        if (retryCount === maxRetries - 1) {
          if (error instanceof Error && error.message.includes("does not exist")) {
            throw error;
          }
          throw new Error("Could not determine token program for mint");
        }
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    let instructions, tokenAccount;

    if (body.useToken2022 || tokenProgram.equals(TOKEN_2022_PROGRAM_ID)) {
      // Use Token Extensions for Token 2022 mints
      const transferFeeConfig = {
        feeBasisPoints: 0,
        maxFee: BigInt(0),
        transferFeeConfigAuthority: walletPublicKey,
        withdrawWithheldAuthority: walletPublicKey
      };

      const token = new TransferFeeToken(
        connection,
        mintPublicKey,
        transferFeeConfig
      );

      const result = await token.createAccountAndMintToInstructions(
        recipient,
        walletPublicKey,
        mintAmount,
        walletPublicKey
      );
      instructions = result.instructions;
      tokenAccount = result.address;
    } else {
      // Use regular SPL Token for standard mints
      const token = new Token(connection, mintPublicKey);
      const result = await token.createAccountAndMintToInstructions(
        recipient,
        walletPublicKey,
        mintAmount,
        walletPublicKey
      );
      instructions = result.instructions;
      tokenAccount = result.address;
    }
    const transaction = new Transaction();
    transaction.recentBlockhash = "11111111111111111111111111111111";
    transaction.feePayer = walletPublicKey;

    instructions.forEach(ix => transaction.add(ix));
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");
    return NextResponse.json({
      success: true,
      transaction: serializedTransaction,
      tokenAccount: tokenAccount.toString()
    });

  } catch (error: unknown) {
    console.error("Mint token error:", error);

    let errorMessage = "Failed to create mint transaction";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("Invalid Mint")) {
        errorMessage = "Invalid mint account. The mint may not exist or may not be properly initialized.";
      } else if (error.message.includes("Could not determine token program")) {
        errorMessage = "Could not determine the correct token program for this mint. Please ensure the mint exists.";
      } else if (error.message.includes("does not exist")) {
        errorMessage = "Mint account does not exist. Please create the token first before minting.";
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 