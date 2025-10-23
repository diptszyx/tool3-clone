'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManualInputTab from './manual-input-tab';
import FileImportTab from './file-import-tab';

interface ManualImportPanelProps {
  onBack: () => void;
  onAddWallets: (wallets: Array<{ address: string; privateKey: string }>) => void;
}

export default function ManualImportPanel({ onBack, onAddWallets }: ManualImportPanelProps) {
  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual Input</TabsTrigger>
        <TabsTrigger value="file">File Import</TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <ManualInputTab onBack={onBack} onAddWallets={onAddWallets} />
      </TabsContent>

      <TabsContent value="file">
        <FileImportTab onBack={onBack} onAddWallets={onAddWallets} />
      </TabsContent>
    </Tabs>
  );
}
