// Demo page for Activity Timeline component
// Shows example timeline with various activity types

'use client';

import { ActivityTimeline, TimelineActivity } from '../../components/ActivityTimeline';
import { Sidebar } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';

// Mock data for demonstration
const mockActivities: TimelineActivity[] = [
  {
    id: '1',
    type: 'trace_evaluated',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    studentName: 'Emma Watson',
    studentId: 'student_10234567',
    title: 'Scene 3 Evaluation - Critical Gap',
    description: 'Student struggled with understanding supply and demand equilibrium. Multiple scaffolding attempts were made but core concepts remain unclear. Immediate teacher intervention recommended.',
    status: 'critical_gap',
    metadata: {
      sceneNumber: 3,
      sceneName: 'Market Forces',
      concept: 'Supply & Demand Equilibrium',
      misconception: 'Confusing equilibrium price with average price',
    }
  },
  {
    id: '2',
    type: 'scene_completed',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
    studentName: 'James Chen',
    studentId: 'student_10234568',
    title: 'Scene 2 Completed',
    description: 'Student completed the scene after successful dialogue with the AI character. Demonstrated good understanding of opportunity cost.',
    status: 'mastery',
    metadata: {
      sceneNumber: 2,
      sceneName: 'Opportunity Cost Dilemma',
      concept: 'Opportunity Cost',
      progress: 33,
    }
  },
  {
    id: '3',
    type: 'trace_evaluated',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
    studentName: 'Sarah Johnson',
    studentId: 'student_10234569',
    title: 'Scene 1 Evaluation - Revised with Scaffolding',
    description: 'Student initially struggled with the concept but successfully revised their understanding after AI guidance. Final answer demonstrated solid grasp of key principles.',
    status: 'revised_with_scaffolding',
    metadata: {
      sceneNumber: 1,
      sceneName: 'Introduction to Economics',
      concept: 'Scarcity',
      misconception: 'Thinking scarcity only applies to money',
    }
  },
  {
    id: '4',
    type: 'arc_started',
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago
    studentName: 'Michael Park',
    studentId: 'student_10234570',
    title: 'Started Economics Arc',
    description: 'Student began the Microeconomics Fundamentals assessment arc.',
    status: 'info',
  },
  {
    id: '5',
    type: 'flag',
    timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(), // 3 hours ago
    studentName: 'Emma Watson',
    studentId: 'student_10234567',
    title: 'Student Flagged - Pattern of Confusion',
    description: 'CurricuLLM detected repeated misconceptions about price mechanisms across multiple scenes. Student may need additional resources on market dynamics.',
    status: 'warning',
    metadata: {
      concept: 'Price Mechanisms',
    }
  },
  {
    id: '6',
    type: 'curricullm_note',
    timestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString(), // 5 hours ago
    title: 'Curriculum Analysis Complete',
    description: 'CurricuLLM completed analysis of the ECON101 module. Identified 8 key concepts and 12 common misconceptions for assessment design.',
    status: 'info',
  },
  {
    id: '7',
    type: 'arc_completed',
    timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(), // 1 day ago
    studentName: 'Olivia Martinez',
    studentId: 'student_10234571',
    title: 'Completed Economics Arc',
    description: 'Student successfully completed all scenes in the Microeconomics Fundamentals arc with strong performance across all dimensions.',
    status: 'mastery',
    metadata: {
      progress: 100,
    }
  },
];

export default function TimelineDemoPage() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">
            Activity Timeline Demo
          </h1>
          <p className="text-[14px] text-tertiary">
            Vertical timeline showing student activities, LLM evaluations, and system events
          </p>
        </div>

        {/* Main Timeline */}
        <div className="max-w-4xl">
          <ActivityTimeline activities={mockActivities} maxHeight="800px" />
        </div>

        {/* Component Info */}
        <div className="max-w-4xl mt-8 bg-warm-white rounded-xl border border-warm-grey p-6">
          <h2 className="text-[14px] font-extrabold uppercase tracking-widest text-primary mb-4">
            Component Features
          </h2>

          <ul className="space-y-2 text-[13px] text-body">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-terracotta text-sm mt-0.5">check_circle</span>
              <span><strong>Expandable cards:</strong> Click any activity to expand and view metadata</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-terracotta text-sm mt-0.5">check_circle</span>
              <span><strong>Status color coding:</strong> Visual distinction for mastery, scaffolding, critical gaps, warnings, and info</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-terracotta text-sm mt-0.5">check_circle</span>
              <span><strong>Scrollable container:</strong> Handles large activity lists with smooth scrolling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-terracotta text-sm mt-0.5">check_circle</span>
              <span><strong>Real-time timestamps:</strong> Relative time display (e.g., "5m ago", "2h ago")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-terracotta text-sm mt-0.5">check_circle</span>
              <span><strong>Multiple activity types:</strong> Scene completions, LLM evaluations, arc events, flags, CurricuLLM notes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-terracotta text-sm mt-0.5">check_circle</span>
              <span><strong>Student attribution:</strong> Shows student avatar and name for student-specific activities</span>
            </li>
          </ul>
        </div>

        {/* Usage Example */}
        <div className="max-w-4xl mt-8 bg-near-black rounded-xl border border-warm-grey p-6">
          <h2 className="text-[14px] font-extrabold uppercase tracking-widest text-parchment mb-4">
            Usage Example
          </h2>

          <pre className="text-[11px] text-wheat-gold font-mono overflow-x-auto">
{`import { StudentActivityPanel } from '@/components/StudentActivityPanel';

// For a specific student
<StudentActivityPanel
  studentId="student_10234567"
  studentName="Emma Watson"
  maxHeight="600px"
/>

// Or use the base component with custom data
import { ActivityTimeline } from '@/components/ActivityTimeline';

<ActivityTimeline
  activities={activities}
  maxHeight="500px"
/>`}
          </pre>
        </div>
      </main>
    </div>
  );
}
