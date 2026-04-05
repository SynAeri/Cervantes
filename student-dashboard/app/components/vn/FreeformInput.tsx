// FreeformInput component for open-ended responses
// Textarea with submit button for student reasoning

'use client';

import { useState } from 'react';

interface FreeformInputProps {
  prompt: string;
  onSubmit: (response: string) => void;
  isLoading?: boolean;
}

export function FreeformInput({ prompt, onSubmit, isLoading }: FreeformInputProps) {
  const [response, setResponse] = useState('');

  const handleSubmit = () => {
    if (response.trim()) {
      onSubmit(response);
      setResponse('');
    }
  };

  return (
    <div className="bg-near-black/95 p-8 rounded-xl">
      <p className="text-parchment font-bold mb-6 text-lg">{prompt}</p>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response here..."
        disabled={isLoading}
        className="
          w-full h-32 p-4 rounded-lg bg-warm-white/5 border border-warm-grey/30
          text-parchment placeholder-tertiary/50 resize-none
          focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
        "
      />

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-tertiary/50">
          {response.length} characters
        </span>
        <button
          onClick={handleSubmit}
          disabled={!response.trim() || isLoading}
          className="
            px-8 py-3 bg-terracotta text-parchment rounded-lg
            font-bold text-sm uppercase tracking-wider
            hover:bg-terracotta/90 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2
          "
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
              Processing...
            </>
          ) : (
            <>
              Submit
              <span className="material-symbols-outlined text-lg">send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
