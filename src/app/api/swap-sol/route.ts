import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getMint,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createTransferInstruction,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import { connectionMainnet } from '@/service/solana/connection';
import { getTokenProgram } from '@/lib/helper';
import {
  getJupiterQuote,
  getJupiterSwapInstructions,
  createInstructionFromJupiter,
} from '@/service/jupiter/swap';
import { adminKeypair } from '@/config';
import { getTokenFeeFromUsd } from '@/service/jupiter/calculate-fee';
import { isWhitelisted } from '@/utils/whitelist';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface SwapRequestBody {
  walletPublicKey: string;
  inputTokenMint: string;
  inputAmount: number;
  slippageBps?: number;
  inviteCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SwapRequestBody = await req.json();
    return await prepareSwapTransaction(body);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to process swap',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

async function prepareSwapTransaction(body: SwapRequestBody) {
  try {
    const userPublicKey = new PublicKey(body.walletPublicKey);
    const inputTokenMint = new PublicKey(body.inputTokenMint);
    const outputTokenMint = new PublicKey(SOL_MINT);

    const isWhitelistedUser = isWhitelisted(body.walletPublicKey);
    const hasInviteAccess = await isFeatureFreeServer('Swap to SOL', body.inviteCode);
    const isFeeExempt = isWhitelistedUser || hasInviteAccess;

    const inputMintInfo = await getMint(connectionMainnet, inputTokenMint);
    const outputMintInfo = await getMint(connectionMainnet, outputTokenMint);

    const inputTokenProgram = await getTokenProgram(inputMintInfo.address);
    const outputTokenProgram = await getTokenProgram(outputMintInfo.address);

    const inputAmountInLamports = Math.round(
      body.inputAmount * Math.pow(10, inputMintInfo.decimals),
    );

    let feeAmount = 0;
    let totalRequiredAmount = inputAmountInLamports;

    if (!isFeeExempt) {
      const feeTokenAmount = await getTokenFeeFromUsd(body.inputTokenMint, 0.25);
      feeAmount = Math.round(feeTokenAmount * Math.pow(10, inputMintInfo.decimals));
      totalRequiredAmount = inputAmountInLamports + feeAmount;
    }

    const userInputTokenAccount = await getAssociatedTokenAddress(
      inputTokenMint,
      userPublicKey,
      false,
      inputTokenProgram,
    );

    try {
      const userAccount = await getAccount(
        connectionMainnet,
        userInputTokenAccount,
        'confirmed',
        inputTokenProgram,
      );

      if (!isFeeExempt && userAccount.amount < BigInt(totalRequiredAmount)) {
        const reducedFeeAmount = Math.round(feeAmount * 0.98);
        const reducedTotal = inputAmountInLamports + reducedFeeAmount;

        if (userAccount.amount >= BigInt(reducedTotal)) {
          feeAmount = reducedFeeAmount;
          totalRequiredAmount = reducedTotal;
        } else {
          return NextResponse.json(
            {
              error: 'Token price has changed. Please try again.',
              required: totalRequiredAmount.toString(),
              available: userAccount.amount.toString(),
            },
            { status: 400 },
          );
        }
      } else if (isFeeExempt && userAccount.amount < BigInt(inputAmountInLamports)) {
        return NextResponse.json(
          {
            error: 'Insufficient token balance',
            required: inputAmountInLamports.toString(),
            available: userAccount.amount.toString(),
          },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json({ error: 'User input token account not found' }, { status: 400 });
    }

    const quote = await getJupiterQuote(body.inputTokenMint, SOL_MINT, inputAmountInLamports);

    const swapInstructionsResponse = await getJupiterSwapInstructions({
      userPublicKey: body.walletPublicKey,
      quoteResponse: quote,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: { maxLamports: 1000000, priorityLevel: 'medium' },
      },
      dynamicComputeUnitLimit: false,
    });

    const swapInstructions = [];

    const userOutputTokenAccount = await getAssociatedTokenAddress(
      outputTokenMint,
      userPublicKey,
      false,
      outputTokenProgram,
    );

    try {
      await getAccount(connectionMainnet, userOutputTokenAccount, 'confirmed', outputTokenProgram);
    } catch {
      const createOutputAccountIx = createAssociatedTokenAccountInstruction(
        adminKeypair.publicKey,
        userOutputTokenAccount,
        userPublicKey,
        outputTokenMint,
        outputTokenProgram,
      );
      swapInstructions.push(createOutputAccountIx);
    }

    if (!isFeeExempt && feeAmount > 0) {
      const feeTokenAccount = await getAssociatedTokenAddress(
        inputTokenMint,
        adminKeypair.publicKey,
        false,
        inputTokenProgram,
      );

      try {
        await getAccount(connectionMainnet, feeTokenAccount, 'confirmed', inputTokenProgram);
      } catch {
        const createFeeAccountIx = createAssociatedTokenAccountInstruction(
          adminKeypair.publicKey,
          feeTokenAccount,
          adminKeypair.publicKey,
          inputTokenMint,
          inputTokenProgram,
        );
        swapInstructions.push(createFeeAccountIx);
      }

      const feeTransferIx = createTransferInstruction(
        userInputTokenAccount,
        feeTokenAccount,
        userPublicKey,
        feeAmount,
        [],
        inputTokenProgram,
      );
      swapInstructions.push(feeTransferIx);
    }

    const swapIx = createInstructionFromJupiter(swapInstructionsResponse.swapInstruction);
    swapInstructions.push(swapIx);

    const { blockhash } = await connectionMainnet.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: adminKeypair.publicKey,
      recentBlockhash: blockhash,
      instructions: swapInstructions,
    }).compileToV0Message();

    const swapTransaction = new VersionedTransaction(messageV0);
    swapTransaction.sign([adminKeypair]);

    const unwrapInstructions = [
      createCloseAccountInstruction(
        userOutputTokenAccount,
        userPublicKey,
        userPublicKey,
        [],
        outputTokenProgram,
      ),
    ];

    const { blockhash: unwrapBlockhash } = await connectionMainnet.getLatestBlockhash();
    const unwrapMessageV0 = new TransactionMessage({
      payerKey: adminKeypair.publicKey,
      recentBlockhash: unwrapBlockhash,
      instructions: unwrapInstructions,
    }).compileToV0Message();

    const unwrapTransaction = new VersionedTransaction(unwrapMessageV0);
    unwrapTransaction.sign([adminKeypair]);

    return NextResponse.json({
      success: true,
      swapTransaction: Buffer.from(swapTransaction.serialize()).toString('base64'),
      unwrapTransaction: Buffer.from(unwrapTransaction.serialize()).toString('base64'),
      feeApplied: !isFeeExempt,
      feeAmount: !isFeeExempt ? feeAmount.toString() : '0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed during transaction preparation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
