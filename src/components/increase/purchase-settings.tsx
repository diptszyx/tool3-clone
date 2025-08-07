import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "@/lib/increase/types";

interface PurchaseSettingsProps {
  form: UseFormReturn<FormData>;
  disabled?: boolean;
}

export const PurchaseSettings = ({
  form,
  disabled = false,
}: PurchaseSettingsProps) => {
  const buyAmountMode = form.watch("buyAmountMode");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="buyAmountMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Buy Amount Mode</FormLabel>
              <FormControl>
                <Tabs
                  value={field.value}
                  onValueChange={disabled ? undefined : field.onChange}
                  className="w-full"
                >
                  <TabsList
                    className={`grid w-full grid-cols-2 ${
                      disabled ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <TabsTrigger value="fixed">Fixed Amount</TabsTrigger>
                    <TabsTrigger value="random">Random Amount</TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fixedAmount"
          render={({ field }) => (
            <FormItem className={buyAmountMode === "fixed" ? "" : "hidden"}>
              <FormLabel>Fixed Amount (SOL)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.01"
                  step="0.001"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div
          className={`grid grid-cols-2 gap-4 ${
            buyAmountMode === "random" ? "" : "hidden"
          }`}
        >
          <FormField
            control={form.control}
            name="randomMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Amount (SOL)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.001"
                    step="0.001"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="randomMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Amount (SOL)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.001"
                    step="0.001"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
