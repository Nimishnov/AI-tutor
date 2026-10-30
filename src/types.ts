export type ViewKey = 'journey' | 'dashboard' | 'study' | 'materials' | 'notes' | 'tutor' | 'practice' | 'revision' | 'help';
export type CloudStatus = 'connecting' | 'synced' | 'syncing' | 'local' | 'offline';
export type MaterialOrigin = 'sample' | 'pasted' | 'pdf' | 'image';

export interface MaterialAttachment {
  storagePath: string;
  mimeType: string;
  fileName: string;
}
export type StudyTabStatus = 'active' | 'completed';

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
  attachment?: MaterialAttachment;
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
  materialId?: string;
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

/** A chronological activity item shown in the Home recent-activity list. */
export interface LearningSession {
  id: string;
  title: string;
  subject: string;
  materialId: string;
  createdAt: string;
  destination?: ViewKey;
  tutorExchangeId?: string;
}

/** A learner-visible left-rail tab anchored to one source material. */
export interface StudyTab {
  id: string;
  title: string;
  subject: string;
  materialId: string;
  createdAt: string;
  lastOpenedAt: string;
  status: StudyTabStatus;
  groupId?: string;
  completedAt?: string;
}

export interface LearningState {
  materials: StudyMaterial[];
  notes: StudyNote[];
  attempts: QuizAttempt[];
  tutorExchanges: TutorExchange[];
  /** Recent activity history; this is distinct from the active study-tab list. */
  sessions: LearningSession[];
  studyTabs: StudyTab[];
  activeMaterialId: string;
  activeStudyTabId: string | null;
  onboardingComplete: boolean;
}

export interface AIExplanation {
  answer: string;
  steps: string[];
  example: string;
  sourceStatus: string;
}

export interface TutorExchange {
  id: string;
  materialId: string;
  question: string;
  answer?: AIExplanation;
  error?: string;
  createdAt: string;
}

export interface AIMisconception {
  concept: string;
  hypothesis: string;
  confidence: 'low' | 'medium';
  reteach: string;
  example: string;
  followup: Omit<QuizQuestion, 'id' | 'isFollowUp'>;
}
