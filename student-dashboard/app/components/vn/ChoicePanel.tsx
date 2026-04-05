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
    <div className="bg-near-black/95 p-8 rounded-xl">
      <p className="text-parchment font-bold mb-6 text-lg">{prompt}</p>
      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className="
              w-full text-left p-4 rounded-lg border border-warm-grey/30
              bg-warm-white/5 hover:bg-terracotta/20 hover:border-terracotta
              transition-all duration-300 group
            "
          >
            <div className="flex items-start gap-3">
              <span className="text-terracotta font-bold text-sm mt-0.5 group-hover:scale-110 transition-transform">
                {String.fromCharCode(65 + index)}.
              </span>
              <span className="text-parchment text-base flex-1">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
