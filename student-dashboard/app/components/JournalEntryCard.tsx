// JournalEntryCard - displays a single reasoning trace entry
// Shows scene info, initial answer, pushback, and final answer

'use client';

interface JournalEntryCardProps {
  entry: {
    trace_id: string;
    scene_id: string;
    initial_answer: string;
    revised_answer: string;
    status: 'mastery' | 'revised_with_scaffolding' | 'critical_gap';
    created_at: string;
    conversation_history?: any[];
  };
}

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const statusColors = {
    mastery: 'bg-mastery/10 border-mastery text-mastery',
    revised_with_scaffolding: 'bg-misconception/10 border-misconception text-misconception',
    critical_gap: 'bg-critical/10 border-critical text-critical',
  };

  const statusLabels = {
    mastery: 'Mastery',
    revised_with_scaffolding: 'Revised with Scaffolding',
    critical_gap: 'Critical Gap',
  };

  return (
    <div className="bg-parchment p-6 rounded-xl border border-warm-grey">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Scene {entry.scene_id}</p>
          <p className="text-[11px] text-tertiary/70">
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`text-[8px] font-extrabold px-2.5 py-1 rounded-full tracking-widest border ${statusColors[entry.status]}`}>
          {statusLabels[entry.status].toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-tertiary font-bold uppercase mb-2">Initial Response</p>
          <p className="text-[13px] text-primary leading-relaxed">{entry.initial_answer}</p>
        </div>

        {entry.conversation_history && entry.conversation_history.length > 2 && (
          <div>
            <p className="text-[10px] text-tertiary font-bold uppercase mb-2">
              Dialogue ({entry.conversation_history.length - 2} exchanges)
            </p>
            <p className="text-[11px] text-tertiary/70 italic">
              Character provided pushback and scaffolding
            </p>
          </div>
        )}

        {entry.revised_answer !== entry.initial_answer && (
          <div>
            <p className="text-[10px] text-tertiary font-bold uppercase mb-2">Final Response</p>
            <p className="text-[13px] text-primary leading-relaxed">{entry.revised_answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
