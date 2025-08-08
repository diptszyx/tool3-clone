"use client";

import { Button } from "@/components/ui/button";

interface TokenTypeSelectorProps {
  tokenType: 'spl' | 'extensions';
  onTokenTypeChange: (type: 'spl' | 'extensions') => void;
}

export const TokenTypeSelector = ({ tokenType, onTokenTypeChange }: TokenTypeSelectorProps) => {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        type="button"
        variant={tokenType === 'spl' ? 'default' : 'outline'}
        onClick={() => onTokenTypeChange('spl')}
        size="sm"
      >
        SPL Token
      </Button>

      <Button
        type="button"
        variant={tokenType === 'extensions' ? 'default' : 'outline'}
        onClick={() => onTokenTypeChange('extensions')}
        size="sm"
      >
        Token Extensions
      </Button>
    </div>
  );
};