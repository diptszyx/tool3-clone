import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/lib//increase/types';

interface DEXSelectorProps {
  form: UseFormReturn<FormData>;
  disabled?: boolean;
}

export const DEXSelector = ({ form, disabled = false }: DEXSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DEX</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="dexType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Tabs
                  value={field.value}
                  onValueChange={disabled ? undefined : field.onChange}
                  className="w-full"
                >
                  <TabsList
                    className={`grid grid-flow-col auto-cols-max gap-2 overflow-x-auto scrollbar-hide px-1 ${
                      disabled ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <TabsTrigger
                      value="Raydium,Meteora,Orca+V2"
                      className="min-w-[250px] lg:min-w-[300px] truncate text-sm"
                    >
                      Jup / Raydium / Meteora / Orca
                    </TabsTrigger>
                    <TabsTrigger
                      value="Raydium Launchlab"
                      className="min-w-[140px] truncate text-sm"
                    >
                      Raydium Launchpad
                    </TabsTrigger>
                    <TabsTrigger value="Pump.fun" className="min-w-[100px] text-sm">
                      Pump
                    </TabsTrigger>
                    <TabsTrigger value="Pump.fun Amm" className="min-w-[150px] text-sm">
                      PumpSwap (AMM)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
