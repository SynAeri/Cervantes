// Journal page - displays all reasoning traces for a student
// Shows chronological history of scene completions and reasoning

'use client';

import { useJournal } from '../hooks/useJournal';
import { JournalEntryCard } from '../components/JournalEntryCard';

export default function JournalPage() {
  const studentId = 'student_demo'; // TODO: Get from auth context
  const { data: entries, isLoading, error } = useJournal(studentId);

  return (
    <div className="min-h-screen bg-parchment p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">
            Your Reasoning Journal
          </h1>
          <p className="text-[14px] text-tertiary">
            A record of your learning journey through assessment scenes
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-warm-white p-6 rounded-xl border border-warm-grey h-48 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-warm-white p-8 rounded-xl border border-warm-grey text-center">
            <p className="text-terracotta font-bold">Error loading journal</p>
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-6">
            {entries.map((entry: any) => (
              <JournalEntryCard key={entry.trace_id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="bg-warm-white p-12 rounded-xl border border-warm-grey text-center">
            <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
              auto_stories
            </span>
            <p className="text-tertiary text-sm">
              No journal entries yet. Complete scenes to build your reasoning journal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
