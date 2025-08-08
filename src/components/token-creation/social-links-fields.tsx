"use client";

import { Control } from "react-hook-form";
import type { TokenFormValues } from "./types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface SocialLinksFieldsProps {
  control: Control<TokenFormValues>;
}

export const SocialLinksFields = ({ control }: SocialLinksFieldsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Social Links (Optional)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="twitterUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter URL</FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/username" {...field} className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="telegramUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram URL</FormLabel>
              <FormControl>
                <Input placeholder="https://t.me/groupname" {...field} className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="discordUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discord URL</FormLabel>
              <FormControl>
                <Input placeholder="https://discord.gg/invite" {...field} className="w-[calc(100%-8px)] border-gear-gray !h-[28px] ml-1 mt-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};