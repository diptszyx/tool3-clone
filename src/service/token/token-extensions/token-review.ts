import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { toast } from 'sonner';
import { checkExtensionsCompatibility } from '@/utils/token/token-compatibility';
import { checkExtensionRequiredFields } from '@/utils/token/token-validation';
import { useNetwork } from '@/context/NetworkContext';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const PLATFORM_FEE_SOL = 0.0029;
const FEE_RECIPIENT_ADDRESS = '4UWS2QEhNT9hyAnvRikAXtDhvvgJGGT8fHhLzoq5KhEa';

export interface TokenCreationResult {
  mint: string;
  signature: string;
  metadataUri: string;
}
export interface TokenExtensionType {
  id: string;
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
  bgColor: string;
}
export const tokenExtensionsMap: Record<string, TokenExtensionType> = {
  'transfer-fees': {
    id: 'transfer-fees',
    icon: () => null,
    name: 'Transfer Fees',
    description: 'Automatically collect fees for each token transfer transaction',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  'confidential-transfer': {
    id: 'confidential-transfer',
    icon: () => null,
    name: 'Confidential Transfer',
    description: 'Secure transaction information with zero-knowledge proofs',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  'permanent-delegate': {
    id: 'permanent-delegate',
    icon: () => null,
    name: 'Permanent Delegate',
    description: 'Assign a permanent delegate for the token',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  'non-transferable': {
    id: 'non-transferable',
    icon: () => null,
    name: 'Non-Transferable',
    description: 'Create tokens that cannot be transferred',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  'interest-bearing': {
    id: 'interest-bearing',
    icon: () => null,
    name: 'Interest Bearing',
    description: 'Tokens that automatically generate interest over time',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
  'default-account-state': {
    id: 'default-account-state',
    icon: () => null,
    name: 'Default Account State',
    description: 'Set default state for all accounts of this token',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  'mint-close-authority': {
    id: 'mint-close-authority',
    icon: () => null,
    name: 'Mint Close Authority',
    description: 'Authority allowed to close this mint',
    color: 'text-pink-600',
    bgColor: 'bg-pink-600/10',
  },
  'transfer-hook': {
    id: 'transfer-hook',
    icon: () => null,
    name: 'Transfer Hook',
    description: 'Execute custom program logic on every token transfer',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  metadata: {
    id: 'metadata',
    icon: () => null,
    name: 'Token Metadata',
    description: 'Metadata embedded directly in the token (always enabled)',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
  },
};

export interface ExtensionOptions {
  [extensionId: string]: Record<string, string | number>;
}

export interface TokenDataType {
  name: string;
  symbol: string;
  decimals: string;
  supply: string;
  description?: string;
  imageUrl?: string;
  extensionOptions?: ExtensionOptions;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
}

export function useTokenReview(router: { push: (url: string) => void }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();

  const [isLoading, setIsLoading] = useState(true);
  const [tokenType, setTokenType] = useState<'spl' | 'extensions'>('extensions');
  const [tokenData, setTokenData] = useState<TokenDataType | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [createdTokenMint, setCreatedTokenMint] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [metadataUri, setMetadataUri] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('tokenData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.tokenType === 'spl') {
            setTokenType('spl');
          } else {
            setTokenType('extensions');
          }

          setTokenData({
            name: parsedData.name,
            symbol: parsedData.symbol,
            decimals: parsedData.decimals,
            supply: parsedData.supply,
            description: parsedData.description,
            extensionOptions: parsedData.extensionOptions,
            websiteUrl: parsedData.websiteUrl || '',
            twitterUrl: parsedData.twitterUrl || '',
            telegramUrl: parsedData.telegramUrl || '',
            discordUrl: parsedData.discordUrl || '',
          });

          if (parsedData.selectedExtensions && parsedData.tokenType !== 'spl') {
            const extensions = [...parsedData.selectedExtensions];

            const hasMetadataExtension =
              extensions.includes('metadata') || extensions.includes('metadata-pointer');
            if (hasMetadataExtension) {
              if (!extensions.includes('metadata')) {
                extensions.push('metadata');
              }
              if (!extensions.includes('metadata-pointer')) {
                extensions.push('metadata-pointer');
              }
            }

            const compatibility = checkExtensionsCompatibility(extensions);
            if (!compatibility.compatible && compatibility.incompatiblePairs) {
              const incompatibleNames = compatibility.incompatiblePairs
                .map((pair) => {
                  const ext1 = tokenExtensionsMap[pair[0]]?.name || pair[0];
                  const ext2 = tokenExtensionsMap[pair[1]]?.name || pair[1];
                  return `${ext1} and ${ext2}`;
                })
                .join(', ');

              toast.error(
                `Incompatible extensions detected: ${incompatibleNames}. Please go back to the token creation page and adjust.`,
                { duration: 6000 },
              );
            }

            const requiredCheck = checkExtensionRequiredFields(
              extensions,
              parsedData.extensionOptions,
            );
            if (!requiredCheck.valid) {
              const missingFieldsInfo = Object.entries(requiredCheck.missingFields)
                .map(([extId, fields]) => {
                  const extName = tokenExtensionsMap[extId]?.name || extId;
                  return `${extName}: ${fields.join(', ')}`;
                })
                .join('; ');

              toast.error(
                `Missing required information for extensions: ${missingFieldsInfo}. Please go back to the token creation page and complete all fields.`,
                { duration: 6000 },
              );

              setTimeout(() => {
                router.push('/create');
              }, 3000);
            }

            setSelectedExtensions(extensions);
          }

          if (parsedData.imageUrl) {
            setImageUrl(parsedData.imageUrl);
          }

          setIsLoading(false);
        } else {
          router.push('/create');
        }
      }
    };

    loadData();
  }, [router]);

  const handleConfirmCreate = async () => {
    if (!wallet.connected || !connection) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!wallet.publicKey) {
      toast.error('Wallet public key not available');
      return;
    }

    if (!wallet.signTransaction) {
      toast.error('Wallet does not support transaction signing');
      return;
    }

    if (!tokenData) {
      toast.error('Token data not available');
      return;
    }

    const cluster = network === WalletAdapterNetwork.Mainnet ? 'Mainnet' : 'Devnet';

    const updatedExtensions = [...selectedExtensions];
    const hasMetadataExtension =
      updatedExtensions.includes('metadata') || updatedExtensions.includes('metadata-pointer');
    if (hasMetadataExtension) {
      if (!updatedExtensions.includes('metadata')) {
        updatedExtensions.push('metadata');
      }
      if (!updatedExtensions.includes('metadata-pointer')) {
        updatedExtensions.push('metadata-pointer');
      }
    }

    const compatibility = checkExtensionsCompatibility(updatedExtensions);
    if (!compatibility.compatible) {
      const incompatibleNames = compatibility
        .incompatiblePairs!.map((pair) => {
          const ext1 = tokenExtensionsMap[pair[0]]?.name || pair[0];
          const ext2 = tokenExtensionsMap[pair[1]]?.name || pair[1];
          return `${ext1} and ${ext2}`;
        })
        .join(', ');

      toast.error(
        `Cannot create token: The extensions ${incompatibleNames} are not compatible with each other`,
      );
      return;
    }
    const requiredCheck = checkExtensionRequiredFields(
      updatedExtensions,
      tokenData.extensionOptions || {},
    );
    if (!requiredCheck.valid) {
      const missingFieldsInfo = Object.entries(requiredCheck.missingFields)
        .map(([extId, fields]) => {
          const extName = tokenExtensionsMap[extId]?.name || extId;
          return `${extName}: ${fields.join(', ')}`;
        })
        .join('; ');

      toast.error(
        `Cannot create token: Missing required information for extensions - ${missingFieldsInfo}`,
      );
      return;
    }

    setIsCreating(true);
    setCreationError(null);

    try {
      const toastId1 = toast.loading('Preparing token data...');
      const requestData =
        tokenType === 'spl'
          ? {
              walletPublicKey: wallet.publicKey.toString(),
              name: tokenData.name,
              symbol: tokenData.symbol,
              decimals: tokenData.decimals,
              supply: tokenData.supply,
              description: tokenData.description || '',
              imageUrl: imageUrl,
              websiteUrl: tokenData.websiteUrl || '',
              twitterUrl: tokenData.twitterUrl || '',
              telegramUrl: tokenData.telegramUrl || '',
              discordUrl: tokenData.discordUrl || '',
              cluster,
            }
          : {
              walletPublicKey: wallet.publicKey.toString(),
              name: tokenData.name,
              symbol: tokenData.symbol,
              decimals: tokenData.decimals,
              supply: tokenData.supply,
              description: tokenData.description || '',
              imageUrl: imageUrl,
              extensionOptions: tokenData.extensionOptions,
              selectedExtensions: updatedExtensions,
              websiteUrl: tokenData.websiteUrl || '',
              twitterUrl: tokenData.twitterUrl || '',
              telegramUrl: tokenData.telegramUrl || '',
              discordUrl: tokenData.discordUrl || '',
              cluster,
            };

      console.log('TokenReview: Sending request with extensions:', selectedExtensions);
      console.log('TokenReview: Extension options:', tokenData.extensionOptions);

      const response = await fetch(
        tokenType === 'spl' ? '/api/create-spl-token' : '/api/create-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create token transaction');
      }
      const tokenTxData = await response.json();
      toast.dismiss(toastId1);
      if (tokenType === 'spl') {
        const toastId2 = toast.loading('Creating SPL token with Metaplex...');

        try {
          const { Transaction, Keypair, SystemProgram, PublicKey } = await import(
            '@solana/web3.js'
          );
          const {
            createInitializeMintInstruction,
            createMintToInstruction,
            createAssociatedTokenAccountInstruction,
            getAssociatedTokenAddress,
            MINT_SIZE,
            TOKEN_PROGRAM_ID,
            getMinimumBalanceForRentExemptMint,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          } = await import('@solana/spl-token');
          // const { Metaplex } = await import("@metaplex-foundation/js"); // eslint-disable-line @typescript-eslint/no-unused-vars

          if (!wallet.signTransaction) {
            throw new Error('Wallet does not support signing transactions');
          }

          const mintKeypair = Keypair.fromSecretKey(new Uint8Array(tokenTxData.mintKeypair));
          const mint = mintKeypair.publicKey;

          const associatedTokenAccount = await getAssociatedTokenAddress(
            mint,
            wallet.publicKey!,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          );

          const transaction = new Transaction();
          const rentExemptAmount = await getMinimumBalanceForRentExemptMint(connection);

          transaction.add(
            SystemProgram.createAccount({
              fromPubkey: wallet.publicKey!,
              newAccountPubkey: mint,
              space: MINT_SIZE,
              lamports: rentExemptAmount,
              programId: TOKEN_PROGRAM_ID,
            }),
          );

          // Add platform fee transfer (0.0029 SOL)
          try {
            const feeRecipient = new PublicKey(FEE_RECIPIENT_ADDRESS);
            const lamports = Math.round(PLATFORM_FEE_SOL * 1_000_000_000);
            transaction.add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey!,
                toPubkey: feeRecipient,
                lamports,
              }),
            );
          } catch (feeErr) {
            console.warn('Skipping platform fee due to invalid recipient:', feeErr);
          }

          transaction.add(
            createInitializeMintInstruction(
              mint,
              tokenTxData.decimals,
              wallet.publicKey!,
              wallet.publicKey!,
              TOKEN_PROGRAM_ID,
            ),
          );
          transaction.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey!,
              associatedTokenAccount,
              wallet.publicKey!,
              mint,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );

          transaction.add(
            createMintToInstruction(
              mint,
              associatedTokenAccount,
              wallet.publicKey!,
              Number(tokenTxData.mintAmount),
              [],
              TOKEN_PROGRAM_ID,
            ),
          );

          try {
            const MetaplexPackage = await import('@metaplex-foundation/mpl-token-metadata');
            const TOKEN_METADATA_PROGRAM_ID = MetaplexPackage.PROGRAM_ID;

            const metadataData = {
              name: tokenTxData.tokenData.name,
              symbol: tokenTxData.tokenData.symbol,
              uri: tokenTxData.metadataUri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            };

            const [metadataAddress] = PublicKey.findProgramAddressSync(
              [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
              TOKEN_METADATA_PROGRAM_ID,
            );

            if (MetaplexPackage.createCreateMetadataAccountV3Instruction) {
              transaction.add(
                MetaplexPackage.createCreateMetadataAccountV3Instruction(
                  {
                    metadata: metadataAddress,
                    mint: mint,
                    mintAuthority: wallet.publicKey!,
                    payer: wallet.publicKey!,
                    updateAuthority: wallet.publicKey!,
                  },
                  {
                    createMetadataAccountArgsV3: {
                      data: metadataData,
                      isMutable: true,
                      collectionDetails: null,
                    },
                  },
                ),
              );
            } else {
              console.warn('createCreateMetadataAccountV3Instruction not available');
            }
          } catch (metadataError) {
            console.warn('Could not add metadata:', metadataError);
          }

          const latestBlockhash = await connection.getLatestBlockhash('finalized');
          transaction.recentBlockhash = latestBlockhash.blockhash;
          transaction.feePayer = wallet.publicKey!;

          transaction.partialSign(mintKeypair);
          let signature: string;
          if (wallet.signTransaction) {
            const signedTransaction = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
              skipPreflight: false,
              preflightCommitment: 'finalized',
            });

            await connection.confirmTransaction(
              {
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
              },
              'finalized',
            );
          } else {
            throw new Error('Wallet does not support signTransaction');
          }

          setCreatedTokenMint(tokenTxData.mint);
          setTransactionSignature(signature);
          setSuccess(true);
          localStorage.removeItem('tokenData');
          toast.dismiss(toastId2);
          toast.success('SPL Token created successfully!');
          return;
        } catch (splError) {
          console.error('SPL token creation error:', splError);
          toast.dismiss(toastId2);
          toast.error('Failed to create SPL token');
          return;
        }
      } else {
        const transactionBuffer = Buffer.from(tokenTxData.transaction, 'base64');
        const transaction = Transaction.from(transactionBuffer);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey!;

        if (tokenTxData.mintKeypair) {
          const { Keypair } = await import('@solana/web3.js');
          const mintKeypair = Keypair.fromSecretKey(new Uint8Array(tokenTxData.mintKeypair));
          transaction.partialSign(mintKeypair);
        }

        try {
          const feeRecipient = new PublicKey(FEE_RECIPIENT_ADDRESS);
          const lamports = Math.round(PLATFORM_FEE_SOL * 1_000_000_000);
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey!,
              toPubkey: feeRecipient,
              lamports,
            }),
          );
        } catch (feeErr) {
          console.warn('Skipping platform fee due to invalid recipient:', feeErr);
        }

        const signedTransaction = await wallet.signTransaction(transaction);
        const toastId2 = toast.loading('Creating token on blockchain...');

        let signature: string;
        try {
          signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'finalized',
          });

          await connection.confirmTransaction(
            {
              blockhash,
              lastValidBlockHeight,
              signature,
            },
            'finalized',
          );

          console.log('Token creation transaction confirmed:', signature);

          // Double-check transaction was actually finalized
          try {
            const txStatus = await connection.getSignatureStatus(signature);
            console.log('Transaction status:', txStatus);
            if (txStatus.value?.err) {
              throw new Error(
                `Transaction failed with error: ${JSON.stringify(txStatus.value.err)}`,
              );
            }
          } catch (statusError) {
            console.error('Error checking transaction status:', statusError);
          }
        } catch (sendError: unknown) {
          // Handle SendTransactionError specifically
          console.error('Send transaction error:', sendError);

          const err = sendError as { message?: string; getLogs?: () => string[] };

          if (err.message?.includes('already been processed')) {
            throw new Error(
              'Transaction already processed. Please try again with a fresh transaction.',
            );
          } else if (typeof err.getLogs === 'function') {
            const logs = err.getLogs();
            console.error('Transaction logs:', logs);

            // Check for specific error patterns in logs
            const logString = logs.join(' ');
            if (logString.includes('Invalid Mint')) {
              throw new Error('Invalid mint account. The token creation failed. Please try again.');
            } else if (logString.includes('custom program error: 0x2')) {
              throw new Error(
                'Token program error. This may be due to invalid parameters or insufficient funds.',
              );
            }

            throw new Error(`Transaction failed: ${err.message}. Check console for detailed logs.`);
          }
          throw sendError;
        }

        const mintAddress = tokenTxData.mint;
        setCreatedTokenMint(mintAddress);
        setTransactionSignature(signature);
        toast.dismiss(toastId2);

        console.log('Verifying mint account creation...');
        let mintVerified = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!mintVerified && attempts < maxAttempts) {
          try {
            const mintInfo = await connection.getAccountInfo(new PublicKey(mintAddress));
            if (mintInfo) {
              console.log('Mint account verified successfully');
              console.log('Mint owner:', mintInfo.owner.toString());
              console.log('Mint data length:', mintInfo.data.length);
              mintVerified = true;
            } else {
              attempts++;
              console.log(
                `Mint verification attempt ${attempts}/${maxAttempts} failed, retrying...`,
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (verifyError) {
            attempts++;
            console.error(
              `Mint verification attempt ${attempts}/${maxAttempts} error:`,
              verifyError,
            );
            if (attempts >= maxAttempts) {
              throw new Error(
                'Token creation failed: Mint account not found after multiple attempts',
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!mintVerified) {
          throw new Error('Token creation failed: Could not verify mint account creation');
        }

        console.log('Mint account verified successfully, proceeding to mint tokens...');

        // Với Token Extensions flow, cần bước mint riêng
        const toastId3 = toast.loading('Minting tokens to your wallet...');
        const mintRequestData = {
          walletPublicKey: wallet.publicKey.toString(),
          mintAddress: mintAddress,
          amount: tokenData.supply,
          decimals: parseInt(tokenData.decimals),
          useToken2022: tokenTxData.useToken2022,
          cluster,
        };
        const mintResponse = await fetch('/api/create-token/mint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mintRequestData),
        });
        if (!mintResponse.ok) {
          const mintErrorData = await mintResponse.json();
          console.error('Mint API error:', mintErrorData);

          let errorMessage = mintErrorData.error || 'Failed to mint tokens';
          if (errorMessage.includes('does not exist')) {
            errorMessage =
              'Token mint was not created properly. Please try creating the token again.';
          }
          throw new Error(errorMessage);
        }
        const mintTxData = await mintResponse.json();
        const mintTransactionBuffer = Buffer.from(mintTxData.transaction, 'base64');
        const mintTransaction = Transaction.from(mintTransactionBuffer);
        const { blockhash: mintBlockhash, lastValidBlockHeight: mintLastValidBlockHeight } =
          await connection.getLatestBlockhash('finalized');
        mintTransaction.recentBlockhash = mintBlockhash;
        const signedMintTransaction = await wallet.signTransaction(mintTransaction);

        try {
          const mintSignature = await connection.sendRawTransaction(
            signedMintTransaction.serialize(),
            {
              skipPreflight: false,
              preflightCommitment: 'finalized',
            },
          );

          await connection.confirmTransaction(
            {
              blockhash: mintBlockhash,
              lastValidBlockHeight: mintLastValidBlockHeight,
              signature: mintSignature,
            },
            'confirmed',
          );
        } catch (mintError: unknown) {
          console.error('Mint transaction error:', mintError);

          const err = mintError as { message?: string; getLogs?: () => string[] };

          if (err.message?.includes('already been processed')) {
            throw new Error('Mint transaction already processed. Please try again.');
          } else if (
            err.message?.includes('Invalid Mint') ||
            err.message?.includes('custom program error: 0x2')
          ) {
            throw new Error(
              "Invalid mint account detected. This usually means:\n1. The mint account wasn't created properly\n2. Wrong token program is being used\n3. Network congestion caused incomplete transaction\n\nPlease try creating the token again.",
            );
          } else if (typeof err.getLogs === 'function') {
            const logs = err.getLogs();
            console.error('Mint transaction logs:', logs);
            throw new Error(
              `Mint transaction failed: ${err.message}. Check console for detailed logs.`,
            );
          }
          throw mintError;
        }
        toast.dismiss(toastId3);

        toast.success('Token created and minted successfully!');

        setMetadataUri('');
        setSuccess(true);

        localStorage.removeItem('tokenData');
      }
    } catch (error: Error | unknown) {
      console.error('Detailed token creation error:', error);

      let errorMessage = error instanceof Error ? error.message : 'Error creating token';

      if (error instanceof Error && 'code' in error && error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (typeof errorMessage === 'string') {
        if (errorMessage.includes('insufficient funds')) {
          errorMessage =
            'Insufficient funds to complete the transaction. Please add more SOL to your wallet.';
        } else if (
          errorMessage.includes('blockhash') ||
          errorMessage.includes('Blockhash not found') ||
          errorMessage.includes('Transaction simulation failed: Blockhash not found')
        ) {
          errorMessage =
            'Network timeout or blockhash expired. This is common on mainnet during high traffic. Please try again in a few moments.';
        } else if (errorMessage.includes('transaction too large')) {
          errorMessage = 'Transaction size exceeds limit. Try reducing the number of extensions.';
        }
      }

      setCreationError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };
  const handleBack = () => {
    router.push('/create');
  };

  const goToHome = () => {
    router.push('/');
  };
  return {
    isLoading,
    tokenData,
    selectedExtensions,
    isCreating,
    success,
    imageUrl,
    createdTokenMint,
    transactionSignature,
    creationError,
    metadataUri,

    handleConfirmCreate,
    handleBack,
    goToHome,
  };
}
export function getExtensionDetails(
  extId: string,
  options: Record<string, string | number>,
): {
  displayItems?: Array<{ label: string; value: string | number }>;
  address?: string;
  truncatedAddress?: string;
} | null {
  if (extId === 'permanent-delegate' && options?.['delegate-address']) {
    const address = String(options['delegate-address']);
    const truncatedAddress =
      address.length > 20
        ? `${address.substring(0, 10)}...${address.substring(address.length - 6)}`
        : address;

    return { address, truncatedAddress };
  }

  if (extId === 'transfer-fees' && options?.['fee-percentage'] !== undefined) {
    return {
      displayItems: [{ label: 'Fee Rate', value: `${options['fee-percentage']}%` }],
    };
  }

  if (extId === 'interest-bearing' && options?.['interest-rate'] !== undefined) {
    return {
      displayItems: [{ label: 'Annual Rate', value: `${options['interest-rate']}%` }],
    };
  }

  if (extId === 'mint-close-authority' && options?.['close-authority']) {
    const address = String(options['close-authority']);
    const truncatedAddress =
      address.length > 20
        ? `${address.substring(0, 10)}...${address.substring(address.length - 6)}`
        : address;

    return { address, truncatedAddress };
  }

  return null;
}
