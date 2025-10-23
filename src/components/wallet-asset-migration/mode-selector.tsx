'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet2, Wallet } from 'lucide-react';

interface ModeSelectorProps {
  mode: 'multi' | 'single';
  onModeChange: (mode: 'multi' | 'single') => void;
}

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(v) => onModeChange(v as 'multi' | 'single')}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="multi" className="flex items-center gap-2">
          <Wallet2 className="h-4 w-4" />
          Multi-Wallet
        </TabsTrigger>
        <TabsTrigger value="single" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Single Wallet
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
