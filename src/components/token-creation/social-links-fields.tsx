'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface TokenFormData {
  name?: string;
  symbol?: string;
  decimals: string;
  supply: string;
  description?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
}

interface SocialLinksFieldsProps {
  form: UseFormReturn<TokenFormData>;
}

export const SocialLinksFields: React.FC<SocialLinksFieldsProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Social Links (Optional)</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="twitterUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter URL</FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="telegramUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram URL</FormLabel>
              <FormControl>
                <Input placeholder="https://t.me/username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="discordUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discord URL</FormLabel>
              <FormControl>
                <Input type="string" placeholder="https://discord.gg/invite" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
