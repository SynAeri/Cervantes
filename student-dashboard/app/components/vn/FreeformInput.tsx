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
    <div className="px-6 md:px-8 pb-6">
      <p className="text-parchment/95 leading-relaxed font-light text-xs md:text-sm mb-6">{prompt}</p>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response here..."
        disabled={isLoading}
        className="
          w-full h-32 p-4 bg-near-black/40 border border-parchment/20
          text-parchment/90 placeholder-parchment/30 resize-none font-light text-xs md:text-sm
          focus:outline-none focus:border-terracotta
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all backdrop-blur-sm
        "
      />

      <div className="flex justify-between items-center mt-4">
        <span className="text-[10px] text-parchment/40 uppercase tracking-widest">
          {response.length} chars
        </span>
        <button
          onClick={handleSubmit}
          disabled={!response.trim() || isLoading}
          className="
            px-6 py-2 bg-terracotta text-parchment
            font-bold text-[10px] uppercase tracking-widest
            hover:bg-terracotta/90 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2
          "
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
              Processing
            </>
          ) : (
            <>
              Submit
              <span className="material-symbols-outlined text-sm">send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
