// ChoicePanel component for multi-choice interactions
// Displays clickable options as buttons

'use client';

interface ChoicePanelProps {
  prompt: string;
  options: string[];
  onSelect: (choice: string) => void;
}

export function ChoicePanel({ prompt, options, onSelect }: ChoicePanelProps) {
  return (
    <div className="w-full max-w-3xl bg-near-black/90 backdrop-blur-md border border-parchment/30 p-8 rounded-lg">
      <p className="text-parchment/95 leading-relaxed font-normal text-base md:text-lg mb-8 text-center">{prompt}</p>
      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className="
              w-full text-left px-6 py-4 border-2 border-parchment/30
              bg-near-black/60 hover:bg-terracotta/20 hover:border-terracotta
              transition-all duration-200 group backdrop-blur-sm rounded
            "
          >
            <div className="flex items-start gap-4">
              <span className="text-terracotta font-bold text-lg mt-0.5 group-hover:scale-110 transition-transform">
                {String.fromCharCode(65 + index)}.
              </span>
              <span className="text-parchment/95 text-base md:text-lg flex-1 font-normal">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
