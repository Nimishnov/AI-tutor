import type { LearningState, QuizQuestion, StudyMaterial, StudyNote, StudyTab } from './types';

export const demoMaterialId = 'demo-newtons-laws';

const demoBody = `Newton's laws of motion describe the relationship between the motion of an object and the forces acting on it.\n\nFirst law — law of inertia: An object remains at rest, or continues moving at constant velocity in a straight line, unless acted upon by a net external force. Inertia is an object's resistance to a change in its motion. More mass means more inertia.\n\nSecond law: The acceleration of an object is directly proportional to the net force and inversely proportional to its mass. In equation form, F_net = m × a. The acceleration points in the direction of the net force. For the same mass, a larger net force produces greater acceleration. For the same force, a larger mass produces less acceleration.\n\nThird law: When object A exerts a force on object B, object B exerts an equal-magnitude force in the opposite direction on object A. These action–reaction forces act on different objects, so they do not cancel each other on a single object's free-body diagram.\n\nExample: When you push a loaded trolley with the same force as an empty trolley, the loaded trolley accelerates less because its mass is greater. When you walk, your foot pushes the ground backward and the ground pushes you forward.\n\nCommon confusion: A moving object does not need a forward net force to keep moving at constant velocity. A net force changes velocity; it is not required to maintain motion.`;

export const demoMaterial: StudyMaterial = {
  id: demoMaterialId,
  title: "Newton's Laws of Motion",
  subject: 'Physics · Mechanics',
  body: demoBody,
  origin: 'sample',
  sourcePages: [
    { page: 1, excerpt: "Newton's laws describe how forces change an object's motion." },
    { page: 2, excerpt: 'F_net = m × a; action–reaction forces act on different objects.' }
  ],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
};

export const demoNote: StudyNote = {
  id: 'demo-note-newtons',
  materialId: demoMaterialId,
  title: "Newton's Laws of Motion",
  summary: 'Forces explain changes in motion: inertia resists change, net force determines acceleration, and interaction forces come in equal-and-opposite pairs.',
  sections: [
    {
      heading: 'The three laws',
      bullets: [
        'First law: without a net external force, an object stays at rest or keeps a constant velocity.',
        'Second law: net force, mass, and acceleration are linked by F_net = m × a.',
        'Third law: interacting objects exert equal, opposite forces on one another.'
      ],
      sourceCitations: ['Sample material · p. 1', 'Sample material · p. 2']
    },
    {
      heading: 'A useful mental model',
      bullets: [
        'A net force changes velocity; it is not needed to keep constant-velocity motion going.',
        'At the same push, a heavier trolley accelerates less than a lighter trolley.',
        'Action–reaction forces act on different objects, so they do not cancel on one object.'
      ],
      sourceCitations: ['Sample material · p. 2']
    }
  ],
  confusions: [
    'Thinking a moving object must have a forward net force even when its velocity is constant.',
    'Treating action–reaction forces as if they act on the same object.'
  ],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  isDemo: true
};

export const firstQuestion: QuizQuestion = {
  id: 'demo-first-question',
  question: 'A 2 kg cart is pushed with a net force of 6 N. What is its acceleration?',
  concept: "Newton's second law",
  choices: [
    { id: 'A', text: '3 m/s²' },
    { id: 'B', text: '12 m/s²' },
    { id: 'C', text: '4 m/s²' },
    { id: 'D', text: '0.33 m/s²' }
  ],
  correctId: 'A',
  explanation: 'Newton’s second law gives a = F_net ÷ m, so 6 N ÷ 2 kg = 3 m/s².',
  sourceCitation: 'Sample material · p. 2'
};

function sampleTab(): StudyTab {
  const now = new Date().toISOString();
  return {
    id: 'sample-tab-newton',
    title: demoMaterial.title,
    subject: demoMaterial.subject,
    materialId: demoMaterial.id,
    createdAt: demoMaterial.createdAt,
    lastOpenedAt: now,
    status: 'active'
  };
}

export function makeEmptyState(): LearningState {
  return {
    materials: [],
    notes: [],
    attempts: [],
    tutorExchanges: [],
    sessions: [],
    studyTabs: [],
    activeMaterialId: '',
    activeStudyTabId: null,
    onboardingComplete: false
  };
}

/** Optional sample for learners who explicitly choose to explore an example. */
export function makeDemoState(): LearningState {
  return {
    materials: [demoMaterial],
    notes: [demoNote],
    attempts: [],
    tutorExchanges: [],
    sessions: [],
    studyTabs: [sampleTab()],
    activeMaterialId: demoMaterialId,
    activeStudyTabId: 'sample-tab-newton',
    onboardingComplete: true
  };
}
