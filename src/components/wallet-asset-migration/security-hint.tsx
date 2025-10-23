import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SecurityHint() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-help">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Security Reminders</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-amber-900">Important</h4>
            <ul className="text-sm space-y-1">
              <li>• Always verify wallet addresses</li>
              <li>• Keep private keys secure</li>
              <li>• Test with small amounts first</li>
              <li>• Ensure sufficient SOL for fees</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
