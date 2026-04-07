// Journal page - displays arc journal for a student
// Shows complete conversation history across all scenes

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../lib/api';

export default function JournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [journalData, setJournalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get studentId and arcId from URL or localStorage
  const studentId = searchParams.get('studentId') || localStorage.getItem('currentStudentId') || '';
  const arcId = searchParams.get('arcId') || localStorage.getItem('currentArcId') || '';

  useEffect(() => {
    const fetchJournal = async () => {
      if (!studentId || !arcId) {
        setError('Missing student ID or arc ID. Please return to the scene or arc page.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.arcJournal.get(studentId, arcId);
        setJournalData(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load journal:', err);
        // If 404, journal might not exist yet
        if (err.status === 404) {
          setError('No journal found for this arc. Complete some scenes first!');
        } else {
          setError(err.message || 'Failed to load journal');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchJournal();
  }, [studentId, arcId]);

  const entries = journalData?.entries || [];

  return (
    <div className="min-h-screen bg-near-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-wheat-gold">auto_stories</span>
            <h1 className="text-3xl font-bold text-parchment tracking-tight">
              Arc Journal
            </h1>
          </div>
          <p className="text-parchment/60 text-sm">
            Complete conversation history across all scenes in this arc
          </p>
          {journalData?.status === 'completed' && (
            <div className="mt-4 inline-block px-4 py-2 bg-wheat-gold/20 border border-wheat-gold/40 rounded-lg">
              <span className="text-wheat-gold text-sm font-medium">✓ Arc Completed</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-terracotta border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-near-black border border-parchment/20 rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-critical mb-4 block">error</span>
            <p className="text-parchment font-bold mb-2">Error loading journal</p>
            <p className="text-parchment/60 text-sm mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-terracotta text-parchment font-bold rounded transition-colors hover:bg-terracotta/80"
            >
              Go Home
            </button>
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-3 bg-near-black/50 border border-parchment/10 rounded-xl p-6 max-h-[70vh] overflow-y-auto">
            {entries.map((entry: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  entry.role === 'student'
                    ? 'bg-terracotta/10 border-l-4 border-terracotta'
                    : entry.role === 'character'
                    ? 'bg-wheat-gold/10 border-l-4 border-wheat-gold'
                    : 'bg-parchment/5 border-l-4 border-parchment/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-parchment/40">Scene {entry.scene_order}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-parchment/80">
                    {entry.role === 'student' ? 'You' : entry.role === 'character' ? entry.character_id || 'Character' : 'Narration'}
                  </span>
                  {entry.emotion_tag && (
                    <span className="text-xs text-wheat-gold/60 italic">({entry.emotion_tag})</span>
                  )}
                </div>
                <p className="text-parchment/90 text-xs leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-near-black border border-parchment/20 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-parchment/30 mb-4 block">
              auto_stories
            </span>
            <p className="text-parchment/60 text-sm">
              No journal entries yet. Complete scenes to build your arc journal.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-parchment/10 text-parchment/80 font-medium rounded transition-colors hover:bg-parchment/20"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
