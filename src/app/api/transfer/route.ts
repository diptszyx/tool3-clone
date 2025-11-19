import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getMint,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createTransferInstruction,
} from '@solana/spl-token';
import { connectionMainnet } from '@/service/solana/connection';
import { getTokenFeeFromUsd } from '@/service/jupiter/calculate-fee';
import { getTokenProgram } from '@/lib/helper';
import { adminKeypair } from '@/config';
import { calculateTransferFee } from '@/utils/ata-checker';
import { isWhitelisted } from '@/utils/whitelist';
import { isFeatureFreeServer } from '@/lib/invite-codes/check-server';

interface TransferRequestBody {
  walletPublicKey: string;
  tokenAmount: number;
  receiverWalletPublicKey: string;
  tokenMint: string;
  inviteCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TransferRequestBody = await req.json();
    return await prepareTransaction(body);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to process transfer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

async function prepareTransaction(body: TransferRequestBody) {
  const senderPublicKey = new PublicKey(body.walletPublicKey);
  const receiverPublicKey = new PublicKey(body.receiverWalletPublicKey);
  const tokenMint = new PublicKey(body.tokenMint);

  const isWhitelistedUser = isWhitelisted(body.walletPublicKey);
  const hasInviteAccess = await isFeatureFreeServer('Gasless Transfer', body.inviteCode);
  const isFeeExempt = isWhitelistedUser || hasInviteAccess;

  const mintInfo = await getMint(connectionMainnet, tokenMint);
  const decimals = mintInfo.decimals;
  const tokenProgram = await getTokenProgram(mintInfo.address);

  const senderTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    senderPublicKey,
    false,
    tokenProgram,
  );
  const receiverTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    receiverPublicKey,
    false,
    tokenProgram,
  );
  const feeTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    adminKeypair.publicKey,
    false,
    tokenProgram,
  );

  let feeAmount = 0;
  const netAmount = Math.round(parseFloat(body.tokenAmount.toString()) * Math.pow(10, decimals));
  let totalAmount = netAmount;

  if (!isFeeExempt) {
    const feeUsdt = await calculateTransferFee(body.receiverWalletPublicKey, body.tokenMint);
    const feeInTokens = await getTokenFeeFromUsd(body.tokenMint, feeUsdt);
    feeAmount = Math.round(feeInTokens * Math.pow(10, decimals));
    totalAmount = netAmount + feeAmount;
  }

  try {
    const senderAccount = await getAccount(
      connectionMainnet,
      senderTokenAccount,
      'confirmed',
      tokenProgram,
    );

    if (!isFeeExempt && senderAccount.amount < BigInt(totalAmount)) {
      const reducedFeeAmount = Math.round(feeAmount * 0.98);
      const reducedTotal = netAmount + reducedFeeAmount;

      if (senderAccount.amount >= BigInt(reducedTotal)) {
        feeAmount = reducedFeeAmount;
        totalAmount = reducedTotal;
      } else {
        return NextResponse.json(
          {
            error: 'Token price has changed. Please try again.',
            required: totalAmount.toString(),
            available: senderAccount.amount.toString(),
          },
          { status: 400 },
        );
      }
    } else if (isFeeExempt && senderAccount.amount < BigInt(netAmount)) {
      return NextResponse.json(
        {
          error: 'Insufficient token balance',
          required: netAmount.toString(),
          available: senderAccount.amount.toString(),
        },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Sender token account not found' }, { status: 400 });
  }

  const transaction = new Transaction();

  try {
    await getAccount(connectionMainnet, receiverTokenAccount, 'confirmed', tokenProgram);
  } catch {
    const createReceiverAccountIx = createAssociatedTokenAccountInstruction(
      adminKeypair.publicKey,
      receiverTokenAccount,
      receiverPublicKey,
      tokenMint,
      tokenProgram,
    );
    transaction.add(createReceiverAccountIx);
  }

  if (!isFeeExempt && feeAmount > 0) {
    try {
      await getAccount(connectionMainnet, feeTokenAccount, 'confirmed', tokenProgram);
    } catch {
      const createFeeAccountIx = createAssociatedTokenAccountInstruction(
        adminKeypair.publicKey,
        feeTokenAccount,
        adminKeypair.publicKey,
        tokenMint,
        tokenProgram,
      );
      transaction.add(createFeeAccountIx);
    }

    const feeTransferIx = createTransferInstruction(
      senderTokenAccount,
      feeTokenAccount,
      senderPublicKey,
      feeAmount,
      [],
      tokenProgram,
    );
    transaction.add(feeTransferIx);
  }

  const netTransferIx = createTransferInstruction(
    senderTokenAccount,
    receiverTokenAccount,
    senderPublicKey,
    netAmount,
    [],
    tokenProgram,
  );
  transaction.add(netTransferIx);

  const { blockhash } = await connectionMainnet.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = adminKeypair.publicKey;
  transaction.partialSign(adminKeypair);

  const serializedTransaction = transaction
    .serialize({ requireAllSignatures: false })
    .toString('base64');

  return NextResponse.json({
    success: true,
    transaction: serializedTransaction,
    feeApplied: !isFeeExempt,
    feeAmount: !isFeeExempt ? feeAmount.toString() : '0',
  });
}
