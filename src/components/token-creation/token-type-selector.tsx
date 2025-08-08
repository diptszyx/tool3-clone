"use client";

import React from "react";

interface TokenTypeSelectorProps {
  tokenType: 'spl' | 'extensions';
  onTokenTypeChange: (type: 'spl' | 'extensions') => void;
}

export const TokenTypeSelector: React.FC<TokenTypeSelectorProps> = ({
  tokenType,
  onTokenTypeChange
}) => {
  return (
    <div className="flex space-x-2 mb-6">
      <button
        type="button"
        onClick={() => onTokenTypeChange('spl')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          tokenType === 'spl'
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        SPL Token
      </button>
      <button
        type="button"
        onClick={() => onTokenTypeChange('extensions')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          tokenType === 'extensions'
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Token Extensions
      </button>
    </div>
  );
};
