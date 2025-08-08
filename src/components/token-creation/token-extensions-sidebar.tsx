"use client";

import { useState } from "react";
import { Info, ChevronRight, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { tokenExtensions, TextOptionType, SliderOptionType, TokenExtensionType } from "@/service/token/token-extensions/token-creation";
import { useIsMobile } from "@/hooks/use-mobile";

interface TokenData {
  extensionOptions?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

interface ValidationErrors {
  [extensionId: string]: Record<string, string>;
}

interface TokenExtensionsSidebarProps {
  selectedExtensions: string[];
  tokenData: TokenData;
  validationErrors: ValidationErrors;
  onToggleExtension: (extId: string, extensions: TokenExtensionType[]) => void;
  onUpdateExtensionOption: (extId: string, optionId: string, value: string | number) => void;
}

export const TokenExtensionsSidebar = ({
  selectedExtensions,
  tokenData,
  validationErrors,
  onToggleExtension,
  onUpdateExtensionOption
  
}: TokenExtensionsSidebarProps) => {
  const isMobile = useIsMobile();
  const [openExtensions, setOpenExtensions] = useState<Record<string, boolean>>({});

  const toggleExtensionOpen = (extId: string) => {
    setOpenExtensions(prev => ({
      ...prev,
      [extId]: !prev[extId]
    }));
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="sticky top-4">
        <div className={`pt-2 px-1 pb-1 ${!isMobile && "border-gear"}`}>
          <h3 className="text-lg text-center font-medium mb-4">Token Extensions</h3>
          <div className="space-y-3 max-h-[min(624px,_calc(100vh-224px))] overflow-y-auto">
            {tokenExtensions.map((extension) => {
              const isSelected = selectedExtensions.includes(extension.id);
              const isExpanded = openExtensions[extension.id] || false;
              const hasError = isSelected && validationErrors[extension.id] && Object.keys(validationErrors[extension.id]).length > 0;
              const hasOptions = extension.options && extension.options.length > 0;

              return (
                <div
                  key={extension.id}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all duration-200",
                    isSelected
                      ? hasError
                        ? "border-red-500 bg-red-50/5"
                        : `border-${extension.color} bg-${extension.bgColor}/20`
                      : "border-gray-200 bg-white hover:bg-gray-50",
                    extension.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 cursor-pointer",
                      isSelected && isExpanded && "border-b border-gray-200"
                    )}
                    onClick={() => {
                      if (!extension.disabled) {
                        if (!isSelected) {
                          onToggleExtension(extension.id, tokenExtensions);
                          toggleExtensionOpen(extension.id);
                        } else {
                          toggleExtensionOpen(extension.id);
                        }
                      } else {
                        toast.error(`Extension not available: ${extension.disabledReason}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {extension.icon && <extension.icon className={`w-5 h-5 ${extension.color}`} />}
                        <span className="font-medium">{extension.name}</span>
                        {hasError && (
                          <span className="text-xs text-red-500 px-2 py-0.5 bg-red-50 rounded">Required fields missing</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isSelected && hasOptions && (
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 text-gray-500 transition-transform",
                              isExpanded && "transform rotate-90"
                            )}
                          />
                        )}
                        <div className="flex-shrink-0 ml-2">
                          {isSelected ? (
                            <div
                              className="w-5 h-5 border rounded-sm bg-purple-600 flex items-center justify-center cursor-pointer"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onToggleExtension(extension.id, tokenExtensions);
                              }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div
                              className="w-5 h-5 border rounded-sm border-gray-300 hover:border-purple-500 cursor-pointer"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onToggleExtension(extension.id, tokenExtensions);
                                toggleExtensionOpen(extension.id);
                              }}
                            ></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{extension.description}</p>
                  </div>

                  {isSelected && isExpanded && hasOptions && (
                    <div className="p-4 bg-white">
                      {extension.id === "transfer-fees" ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {extension.options.filter(opt => opt.id === "fee-percentage").map(option => {
                              const optionValue = tokenData.extensionOptions?.[extension.id]?.[option.id];
                              const error = validationErrors[extension.id]?.[option.id];
                              const sliderOption = option as SliderOptionType;

                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                      {option.label}: {(optionValue as number) || sliderOption.defaultValue}%
                                    </label>
                                    {error && <span className="text-xs text-red-500">{error}</span>}
                                  </div>
                                  <input
                                    type="range"
                                    min={sliderOption.min}
                                    max={sliderOption.max}
                                    step={sliderOption.step}
                                    value={(optionValue as number) || sliderOption.defaultValue}
                                    onChange={(e) => onUpdateExtensionOption(extension.id, option.id, parseFloat(e.target.value))}
                                    className="w-full"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {extension.options.filter(opt => opt.id !== "fee-percentage").map(option => {
                              const optionValue = tokenData.extensionOptions?.[extension.id]?.[option.id];
                              const error = validationErrors[extension.id]?.[option.id];
                              const textOption = option as TextOptionType;

                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                      {option.label}{textOption.required ? ' *' : ''}
                                    </label>
                                    {error && <span className="text-xs text-red-500">{error}</span>}
                                  </div>
                                  <Input
                                    type="text"
                                    placeholder={textOption.placeholder}
                                    value={(optionValue as string) || ''}
                                    onChange={(e) => onUpdateExtensionOption(extension.id, option.id, e.target.value)}
                                    className={cn(error && "border-red-500")}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-gray-50 p-3 rounded-md mt-2">
                            <div className="flex items-start">
                              <Info className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                              <p className="text-xs text-gray-600">
                                Transfer fees are calculated as a percentage each time tokens are transferred.
                                When users transfer tokens, fees are automatically deducted and sent to the
                                configured Fee Receiver address.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {extension.options.map(option => {
                            const optionValue = tokenData.extensionOptions?.[extension.id]?.[option.id];
                            const error = validationErrors[extension.id]?.[option.id];

                            if (option.type === 'text') {
                              const textOption = option as TextOptionType;
                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                      {option.label}{textOption.required ? ' *' : ''}
                                    </label>
                                    {error && <span className="text-xs text-red-500">{error}</span>}
                                  </div>
                                  <Input
                                    type="text"
                                    placeholder={textOption.placeholder}
                                    value={(optionValue as string) || ''}
                                    onChange={(e) => onUpdateExtensionOption(extension.id, option.id, e.target.value)}
                                    className={cn(error && "border-red-500")}
                                  />
                                </div>
                              );
                            }

                            if (option.type === 'slider') {
                              const sliderOption = option as SliderOptionType;
                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                      {option.label}: {(optionValue as number) || sliderOption.defaultValue}{option.id === 'fee-percentage' ? '%' : ''}
                                    </label>
                                    {error && <span className="text-xs text-red-500">{error}</span>}
                                  </div>
                                  <input
                                    type="range"
                                    min={sliderOption.min}
                                    max={sliderOption.max}
                                    step={sliderOption.step}
                                    value={(optionValue as number) || sliderOption.defaultValue}
                                    onChange={(e) => onUpdateExtensionOption(extension.id, option.id, parseFloat(e.target.value))}
                                    className="w-full"
                                  />
                                </div>
                              );
                            }

                            if (option.type === 'select') {
                              return (
                                <div key={option.id} className="space-y-1">
                                  <label className="text-sm font-medium">
                                    {option.label}
                                  </label>
                                  <select
                                    value={(optionValue as string) || option.defaultValue}
                                    onChange={(e) => onUpdateExtensionOption(extension.id, option.id, e.target.value)}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {option.options.map(opt => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  {error && <span className="text-xs text-red-500">{error}</span>}
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};