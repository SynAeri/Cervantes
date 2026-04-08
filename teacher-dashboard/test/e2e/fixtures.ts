// Shared Playwright fixtures: mock API routes for E2E tests
// Intercepts backend API calls and returns mock data so tests don't need a running backend

import { test as base, Page } from '@playwright/test';

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockClasses = [
  {
    class_id: 'ECON101',
    professor_id: 'prof-1',
    subject: 'Economics',
    module: 'Microeconomics',
    name: 'ECON 101 — Intro to Economics',
    enrollment: ['student-1', 'student-2', 'student-3'],
    arc_id: 'arc-1',
    status: 'published',
  },
  {
    class_id: 'SDD202',
    professor_id: 'prof-1',
    subject: 'Software Development',
    module: 'Agile Methods',
    name: 'SDD 202 — Software Design',
    enrollment: ['student-4', 'student-5'],
    arc_id: null,
    status: 'no_arc',
  },
];

const mockStudents = [
  {
    student_id: 'student-1',
    student_name: 'Alice Chen',
    email: 'alice@test.edu',
    progress: 75,
    dimensions: { 'Critical Thinking': 0.8, 'Problem Solving': 0.65, 'Communication': 0.7 },
    arc_status: 'in_progress',
    scenes_completed: 3,
    total_scenes: 5,
    last_active: '2026-04-07T10:00:00Z',
    enrollment: { enrolled_at: '2026-01-15T00:00:00Z', extracurriculars: [], subjects: ['Economics'] },
  },
  {
    student_id: 'student-2',
    student_name: 'Bob Martinez',
    email: 'bob@test.edu',
    progress: 40,
    dimensions: { 'Critical Thinking': 0.5, 'Problem Solving': 0.45, 'Communication': 0.6 },
    arc_status: 'in_progress',
    scenes_completed: 2,
    total_scenes: 5,
    last_active: '2026-04-06T14:30:00Z',
    enrollment: { enrolled_at: '2026-01-15T00:00:00Z', extracurriculars: [], subjects: ['Economics'] },
  },
  {
    student_id: 'student-3',
    student_name: 'Cara Johnson',
    email: 'cara@test.edu',
    progress: 100,
    dimensions: { 'Critical Thinking': 0.9, 'Problem Solving': 0.85, 'Communication': 0.95 },
    arc_status: 'complete',
    scenes_completed: 5,
    total_scenes: 5,
    last_active: '2026-04-08T08:00:00Z',
    enrollment: { enrolled_at: '2026-01-15T00:00:00Z', extracurriculars: [], subjects: ['Economics'] },
  },
];

const mockArcs = [
  {
    arc_id: 'arc-1',
    class_id: 'ECON101',
    subject: 'Economics',
    module: 'Microeconomics',
    status: 'published',
    scenes: [
      { scene_id: 's1', scene_number: 1, scene_type: 'bridge', concept_target: 'Supply & Demand', misconception_target: '', exposing_scenario: '', content: '', character: { name: 'Marco', role: 'merchant', archetype: 'mentor', personality: 'wise', backstory: '' } },
      { scene_id: 's2', scene_number: 2, scene_type: 'deep', concept_target: 'Elasticity', misconception_target: '', exposing_scenario: '', content: '', character: { name: 'Marco', role: 'merchant', archetype: 'mentor', personality: 'wise', backstory: '' } },
      { scene_id: 's3', scene_number: 3, scene_type: 'side_event', concept_target: 'Market Failure', misconception_target: '', exposing_scenario: '', content: '', character: { name: 'Marco', role: 'merchant', archetype: 'mentor', personality: 'wise', backstory: '' } },
    ],
    created_at: '2026-04-01T00:00:00Z',
    curriculum_data: {
      subject: 'Economics',
      module: 'Microeconomics',
      year_level: 'Year 11',
      learning_outcomes: ['Understand supply and demand', 'Analyse elasticity'],
      key_concepts: ['Supply', 'Demand', 'Elasticity', 'Market Failure'],
    },
  },
];

const mockReasoningTraces = [
  {
    trace_id: 'trace-1',
    student_id: 'student-1',
    scene_id: 's1',
    conversation_history: [
      { role: 'character', content: 'What determines the price of goods in a market?' },
      { role: 'student', content: 'The seller decides the price.' },
    ],
    initial_answer: 'The seller decides the price.',
    revised_answer: 'Supply and demand interact to set the market price.',
    status: 'revised_with_scaffolding',
    created_at: '2026-04-05T10:00:00Z',
  },
];

// ── Route setup ──────────────────────────────────────────────────────────────

async function mockApiRoutes(page: Page) {
  // Single handler that dispatches based on URL path
  await page.route('**/api/**', (route) => {
    const url = route.request().url();

    // Don't intercept Next.js internal routes
    if (url.includes('localhost:3000')) {
      return route.continue();
    }

    const path = new URL(url).pathname;
    const respond = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // Class endpoints
    if (path === '/api/class') return respond(mockClasses);
    if (path === '/api/class/ECON101') return respond(mockClasses[0]);
    if (path === '/api/class/SDD202') return respond(mockClasses[1]);
    if (path.startsWith('/api/class/INVALID')) return respond({ detail: 'Class not found' }, 404);

    // Student endpoints
    if (path === '/api/students/class/ECON101') return respond(mockStudents);
    if (path.startsWith('/api/students/class/')) return respond([]);

    // Arc endpoints
    if (path === '/api/arc/class/ECON101') return respond(mockArcs);
    if (path.startsWith('/api/arc/class/')) return respond([]);

    // Scene progress
    if (path.includes('/api/scene/progress/class/'))
      return respond({ class_id: 'ECON101', arc_id: 'arc-1', total_students: 3, students: [] });

    // Reasoning traces
    if (path.includes('/api/reasoning-trace/student/'))
      return respond(mockReasoningTraces);

    // Default: empty array
    return respond([]);
  });
}

// ── Custom test fixture ──────────────────────────────────────────────────────

export const test = base.extend({
  page: async ({ page }, use) => {
    await mockApiRoutes(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
