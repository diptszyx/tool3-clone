'use client';

import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function SecurityHint() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        Security Reminder
      </button>

      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg z-10">
          <p className="text-sm text-foreground">
            Always backup your wallets regularly and store your password securely. Never share your
            private keys with anyone.
          </p>
        </div>
      )}
    </div>
  );
}
