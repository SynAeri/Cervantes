// Student progress table showing reasoning trace performance across rubric dimensions
// Color-coded: #3B827E (mastery), #D4A347 (misconception), #9E3B3B (critical gap)

'use client';

import { useState } from 'react';

interface StudentProgress {
  student_id: string;
  student_name: string;
  progress: number;
  dimensions: Record<string, number>;
  arc_status: 'complete' | 'in_progress' | 'flagged' | 'not_started';
  scenes_completed: number;
  total_scenes: number;
  last_active?: string;
}

interface StudentProgressTableProps {
  students: StudentProgress[];
  dimensionNames: string[];
}

export function StudentProgressTable({ students, dimensionNames }: StudentProgressTableProps) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-mastery bg-mastery/10';
      case 'in_progress':
        return 'text-misconception bg-misconception/10';
      case 'flagged':
        return 'text-critical bg-critical/10';
      default:
        return 'text-tertiary bg-warm-grey/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      case 'flagged':
        return 'Flagged';
      default:
        return 'Not Started';
    }
  };

  const getDimensionColor = (score: number) => {
    if (score >= 80) return 'text-mastery bg-mastery/10';
    if (score >= 50) return 'text-misconception bg-misconception/10';
    return 'text-critical bg-critical/10';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-mastery';
    if (progress >= 50) return 'bg-misconception';
    return 'bg-critical';
  };

  if (students.length === 0) {
    return (
      <div className="bg-warm-white rounded-xl border border-warm-grey p-12 text-center">
        <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
          group_off
        </span>
        <p className="text-[13px] text-tertiary">No student data available</p>
        <p className="text-[11px] text-tertiary/70 mt-2">Students will appear here after enrolling in the class</p>
      </div>
    );
  }

  return (
    <div className="bg-warm-white rounded-xl border border-warm-grey overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-parchment border-b border-warm-grey">
            <tr>
              <th className="text-left px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                Student
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                Progress
              </th>
              {dimensionNames.map((dim) => (
                <th key={dim} className="text-center px-4 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  {dim}
                </th>
              ))}
              <th className="text-center px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.student_id}
                className="border-b border-warm-grey hover:bg-parchment/50 transition-colors cursor-pointer"
                onClick={() => setExpandedStudent(expandedStudent === student.student_id ? null : student.student_id)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta font-bold text-[11px]">
                      {student.student_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-primary">{student.student_name}</p>
                      <p className="text-[10px] text-tertiary/70">{student.student_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[100px]">
                      <div className="w-full h-2 bg-warm-grey/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(student.progress)} transition-all duration-500`}
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-primary min-w-[40px]">
                      {student.progress}%
                    </span>
                  </div>
                </td>
                {dimensionNames.map((dim) => {
                  const score = student.dimensions[dim] || 0;
                  return (
                    <td key={dim} className="px-4 py-4 text-center">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded ${getDimensionColor(score)}`}>
                        {score}%
                      </span>
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest ${getStatusColor(student.arc_status)}`}>
                      {getStatusLabel(student.arc_status)}
                    </span>
                    {student.arc_status === 'in_progress' && (
                      <span className="text-[10px] text-tertiary/70">
                        Scene {student.scenes_completed}/{student.total_scenes}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
