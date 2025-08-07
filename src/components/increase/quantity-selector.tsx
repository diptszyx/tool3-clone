import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { FormData, QUANTITY_OPTIONS } from "@/lib/increase/types";

interface QuantitySelectorProps {
  form: UseFormReturn<FormData>;
  disabled?: boolean;
}

export const QuantitySelector = ({
  form,
  disabled = false,
}: QuantitySelectorProps) => {
  const customQuantity = form.watch("customQuantity");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Increase Wallet(↑MAKERS) Buy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {QUANTITY_OPTIONS.map((qty) => (
                      <Button
                        key={qty}
                        variant={field.value === qty ? "default" : "outline"}
                        size="sm"
                        type="button"
                        disabled={disabled || !!customQuantity}
                        onClick={() => field.onChange(qty)}
                        className={
                          field.value === qty
                            ? "bg-black hover:bg-gray-600"
                            : ""
                        }
                      >
                        {qty}
                      </Button>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customQuantity"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Custom quantity"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
