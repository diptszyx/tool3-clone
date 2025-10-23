'use client';

import { Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SecurityHint() {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 cursor-help select-none">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground hover:text-foreground transition">
              Security Notice
            </span>
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          className="max-w-[400px] p-4 space-y-3 text-xs text-muted-foreground"
        >
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Security & Privacy</p>
            <p>
              Your wallet data is stored securely on your device (IndexedDB). Nothing is sent to any
              server.
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground">Password-Based Encryption</p>
            <p>
              Your private keys are encrypted with AES-256-GCM.{' '}
              <strong className="text-foreground">
                We cannot recover your password if you forget it.
              </strong>
            </p>
          </div>

          <div>
            <p className="font-medium text-destructive">Backup Reminder</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Always export and save your backup file.</li>
              <li>Data is lost if browser data is cleared.</li>
              <li>Back up again after adding wallets.</li>
            </ul>
          </div>

          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-center text-muted-foreground">
              Client-side only. You are responsible for your master password and backups.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
