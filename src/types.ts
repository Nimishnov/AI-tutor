export type ViewKey = 'dashboard' | 'materials' | 'notes' | 'tutor' | 'practice' | 'revision';
export type MaterialOrigin = 'sample' | 'pasted' | 'pdf';

export interface SourcePage {
  page: number;
  excerpt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  body: string;
  origin: MaterialOrigin;
  sourcePages: SourcePage[];
  createdAt: string;
}

export interface NoteSection {
  heading: string;
  bullets: string[];
  sourceCitations: string[];
}

export interface StudyNote {
  id: string;
  materialId: string;
  title: string;
  summary: string;
  sections: NoteSection[];
  confusions: string[];
  createdAt: string;
  isDemo?: boolean;
}

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  concept: string;
  choices: QuizChoice[];
  correctId: string;
  explanation: string;
  sourceCitation: string;
  isFollowUp?: boolean;
}

export interface QuizAttempt {
  id: string;
  question: string;
  concept: string;
  selectedId: string;
  selectedText: string;
  correctId: string;
  correctText: string;
  isCorrect: boolean;
  isFollowUp: boolean;
  createdAt: string;
}

export interface LearningSession {
  id: string;
  title: string;
  subject: string;
  materialId: string;
  createdAt: string;
}

export interface LearningState {
  materials: StudyMaterial[];
  notes: StudyNote[];
  attempts: QuizAttempt[];
  sessions: LearningSession[];
  activeMaterialId: string;
}

export interface AIExplanation {
  answer: string;
  steps: string[];
  example: string;
  sourceStatus: string;
}

export interface AIMisconception {
  concept: string;
  hypothesis: string;
  confidence: 'low' | 'medium';
  reteach: string;
  example: string;
  followup: Omit<QuizQuestion, 'id' | 'isFollowUp'>;
}
