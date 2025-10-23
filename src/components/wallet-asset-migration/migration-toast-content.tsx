interface MigrationSuccessProps {
  signature?: string;
  tokensTransferred?: number;
  network?: string;
}

export function SingleMigrationSuccess({ signature }: MigrationSuccessProps) {
  if (!signature) return null;

  const solscanUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;

  return (
    <div className="space-y-1">
      <div className="text-xs font-mono">
        {signature.slice(0, 16)}...{signature.slice(-16)}
      </div>
      <a
        href={solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline text-sm flex items-center gap-1"
      >
        View on Solscan →
      </a>
    </div>
  );
}

interface MultiMigrationSuccessProps {
  signatures: string[];
}

export function MultiMigrationSuccess({ signatures }: MultiMigrationSuccessProps) {
  if (signatures.length === 0) return null;

  return (
    <div className="space-y-1 text-xs">
      <div>{signatures.length} transactions confirmed</div>
      {signatures.slice(0, 3).map((sig, idx) => (
        <a
          key={idx}
          href={`https://solscan.io/tx/${sig}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline block"
        >
          Tx {idx + 1}: {sig.slice(0, 8)}...{sig.slice(-8)} →
        </a>
      ))}
    </div>
  );
}

interface MultiMigrationErrorProps {
  errors: Array<{ wallet: string; error: string }>;
}

export function MultiMigrationError({ errors }: MultiMigrationErrorProps) {
  if (errors.length === 0) return null;

  return (
    <div className="space-y-1 text-xs">
      {errors.slice(0, 3).map((err, idx) => (
        <div key={idx}>
          {err.wallet.slice(0, 8)}...{err.wallet.slice(-8)}: {err.error}
        </div>
      ))}
    </div>
  );
}
