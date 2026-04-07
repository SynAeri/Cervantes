// Shared TypeScript types for teacher dashboard

export interface Class {
  class_id: string;
  professor_id: string;
  subject: string;
  module: string;
  name: string;
  enrollment: string[];
  arc_id?: string | null;
  status: 'no_arc' | 'draft' | 'generating' | 'published';
}

export interface Arc {
  arc_id: string;
  class_id: string;
  subject: string;
  module: string;
  status: 'draft' | 'generating' | 'published';
  scenes: Scene[];
  created_at: string;
  curriculum_data?: {
    subject: string;
    module: string;
    year_level: string;
    learning_outcomes?: string[];
    common_misconceptions?: {
      misconception: string;
      why_students_think_this: string;
      exposing_scenario?: string;
    }[];
    key_concepts?: string[];
  };
  narrative_arc?: { arc_name: string };
}

export interface Scene {
  scene_id: string;
  scene_number: number;
  scene_type: 'bridge' | 'deep' | 'side_event';
  character: CharacterProfile;
  concept_target: string;
  misconception_target: string;
  exposing_scenario: string;
  content: string;
  learning_outcome?: string;
  setting?: string;
  socratic_angles?: string[];
}

export interface CharacterProfile {
  name: string;
  role: string;
  archetype: string;
  personality: string;
  backstory: string;
  personality_prompt?: string;
}

export interface Student {
  uid: string;
  email: string;
  full_name: string;
  role: 'student';
  student_id: string;
}

export interface Enrollment {
  student_id: string;
  class_id: string;
  subjects: string[];
  extracurriculars: string[];
  enrolled_at: string;
}

export interface ReasoningTrace {
  trace_id: string;
  student_id: string;
  scene_id: string;
  conversation_history: ConversationTurn[];
  initial_answer: string;
  revised_answer: string;
  status: 'mastery' | 'revised_with_scaffolding' | 'critical_gap';
  created_at: string;
}

export interface ConversationTurn {
  role: 'student' | 'character';
  content: string;
  emotion?: string;
}

export interface ClassProgress {
  class_id: string;
  students: StudentProgress[];
  overall_progress: number;
  dimension_averages: Record<string, number>;
}

export interface StudentProgress {
  student_id: string;
  student_name: string;
  progress: number;
  completed_scenes: number;
  total_scenes: number;
  dimension_scores: Record<string, number>;
  status: 'active' | 'flagged' | 'complete';
}
