// Expandable student row component with animations

'use client';

import { useState } from 'react';

interface StudentRowProps {
  student: {
    name: string;
    progress: number;
    scores: number[];
    email?: string;
    lastActive?: string;
    submissions?: number;
  };
}

export function StudentRow({ student }: StudentRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-parchment/50 transition-colors group cursor-pointer border-b border-warm-grey"
      >
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`material-symbols-outlined text-[16px] text-tertiary transition-transform duration-300 ${
                expanded ? 'rotate-90' : ''
              }`}
            >
              chevron_right
            </span>
            <p className="text-[14px] font-bold text-primary">{student.name}</p>
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-primary w-8">{student.progress}%</span>
            <div className="flex-1 h-1 max-w-[80px] bg-warm-grey rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  student.progress >= 80 ? 'bg-mastery' : student.progress >= 50 ? 'bg-misconception' : 'bg-critical'
                }`}
                style={{ width: `${student.progress}%` }}
              ></div>
            </div>
          </div>
        </td>
        {student.scores.map((score, idx) => (
          <td key={idx} className="px-6 py-5 text-center">
            <span
              className={`text-[12px] font-bold ${
                score >= 80 ? 'text-mastery' : score >= 50 ? 'text-misconception' : 'text-critical'
              }`}
            >
              {score}%
            </span>
          </td>
        ))}
      </tr>

      {expanded && (
        <tr className="bg-parchment/50 animate-in fade-in slide-in-from-top-2 duration-300 border-b border-warm-grey">
          <td colSpan={6} className="px-6 py-6">
            <div className="grid grid-cols-3 gap-6 max-w-4xl">
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Contact
                </p>
                <p className="text-[13px] text-primary">{student.email || `${student.name.toLowerCase().replace(' ', '.')}@university.edu`}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Last Active
                </p>
                <p className="text-[13px] text-primary">{student.lastActive || '2 days ago'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Submissions
                </p>
                <p className="text-[13px] text-primary">{student.submissions || 12} / 15</p>
              </div>
              <div className="col-span-3 pt-4 border-t border-warm-grey">
                <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-3">
                  Recent Activity
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="material-symbols-outlined text-mastery text-base">check_circle</span>
                    <span className="text-body">Completed Macro Essay</span>
                    <span className="text-tertiary/60 ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="material-symbols-outlined text-wheat-gold text-base">schedule</span>
                    <span className="text-body">Started Micro Quiz</span>
                    <span className="text-tertiary/60 ml-auto">1d ago</span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
