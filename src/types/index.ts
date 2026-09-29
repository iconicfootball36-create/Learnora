export type EducationLevel = 
  | 'Secondary School'
  | 'University'
  | 'Professional Certification'
  | 'Medical'
  | 'Law'
  | 'Technology'
  | 'Business'
  | 'Language Learning'
  | string;

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Exam preparation';

export type LearningGoal = 
  | 'Understand my classes'
  | 'Prepare for exams'
  | 'Improve my grades'
  | 'Learn a new subject'
  | 'Prepare for a certification'
  | 'Build practical skills'
  | string;

export type LearningStyle = 
  | 'Reading'
  | 'Watching explanations'
  | 'Listening'
  | 'Practice questions'
  | 'Flashcards'
  | 'Interactive tutoring'
  | 'A mixture of everything';

export type StudyTimePerDay = '15 minutes' | '30 minutes' | '1 hour' | '2 hours' | '3+ hours';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  educationLevel: EducationLevel;
  customEducation?: string;
  proficiencyLevel: ProficiencyLevel;
  primaryGoal: LearningGoal;
  learningStyles: LearningStyle[];
  dailyStudyTime: StudyTimePerDay;
  tutorNickname: string;
  onboardingCompleted: boolean;
  streakDays: number;
  totalStudyMinutes: number;
  points: number;
  createdAt: number;
  updatedAt: number;
  selectedTheme?: 'light' | 'dark' | 'system';
  role?: 'student' | 'admin' | 'mentor';
  status?: 'active' | 'suspended';
  tier?: 'free' | 'pro' | 'elite';
  notesCount?: number;
  studySetsCount?: number;
}

export const ADMIN_EMAIL = 'adedayoademola171@gmail.com';
export const isAdminEmail = (email?: string | null): boolean => 
  Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());

export interface StudyMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'youtube' | 'audio' | 'image' | 'text' | 'recording';
  size?: number;
  url?: string;
  content: string; // extracted text or source text
  pageCount?: number;
  uploadedAt: number;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'reading' | 'understanding' | 'generating' | 'ready' | 'error';

export interface StudySet {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description?: string;
  materials: StudyMaterial[];
  status: ProcessingStatus;
  progressPercent: number;
  createdAt: number;
  updatedAt: number;
  weakTopics: string[];
  tags: string[];
  isFavorite?: boolean;
}

export interface CitationRef {
  sourceName: string;
  pageOrTimestamp?: string;
  quote?: string;
}

export interface NoteSection {
  id: string;
  heading: string;
  content: string;
  subsections?: { title: string; content: string }[];
  keyTerms?: { term: string; definition: string }[];
  formulasOrDates?: string[];
  keyTakeaways?: string[];
  citations?: CitationRef[];
}

export interface StudyNote {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  type: 'quick-summary' | 'standard' | 'comprehensive';
  sections: NoteSection[];
  summary: string;
  sourceReferences: CitationRef[];
  createdAt: number;
  updatedAt: number;
}

export type FlashcardType = 
  | 'term-def' 
  | 'qa' 
  | 'multiple-choice' 
  | 'fill-blank' 
  | 'cloze' 
  | 'concept' 
  | 'formula';

export interface Flashcard {
  id: string;
  studySetId: string;
  userId: string;
  type: FlashcardType;
  front: string;
  back: string;
  options?: string[]; // for multiple choice
  explanation?: string;
  citation?: CitationRef;
  difficulty: 'easy' | 'medium' | 'hard';
  // Spaced repetition fields
  mastery: 'new' | 'learning' | 'mastered';
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
  nextReviewDate: number;
  timesReviewed: number;
  timesCorrect: number;
  timesMissed: number;
  createdAt: number;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'scenario';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  explanation: string;
  citation?: CitationRef;
  topic?: string;
}

export interface Quiz {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  createdAt: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studySetId: string;
  userId: string;
  answers: Record<string, string | boolean>;
  score: number;
  totalQuestions: number;
  accuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  recommendedRevision: string;
  completedAt: number;
}

export interface PracticeTest {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  difficulty: string;
  createdAt: number;
}

export interface PracticeTestAttempt {
  id: string;
  testId: string;
  studySetId: string;
  userId: string;
  answers: Record<string, string | boolean>;
  score: number;
  total: number;
  timeUsedSeconds: number;
  weakAreas: string[];
  topicBreakdown: Record<string, { total: number; correct: number }>;
  recommendedRevisionPlan: string[];
  completedAt: number;
}

export type TutorMode = 'Explain' | 'Teach Me' | 'Quiz Me' | 'Give Me a Hint' | 'Explain Simply' | 'Go Deeper';

export interface TutorMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'nora';
  content: string;
  mode?: TutorMode;
  citations?: CitationRef[];
  interactiveOptions?: string[]; // for interactive follow-up
  questionToStudent?: string;
  chatQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    concept: string;
    studentAnswerIndex?: number;
    isCorrect?: boolean;
    submitted?: boolean;
  };
  selfReflection?: {
    studentGraspObserved: 'struggling' | 'partially-understood' | 'mastered';
    identifiedGap?: string;
    demonstratedStrength?: string;
    tutorAdjustmentMade: string;
  };
  timestamp: number;
  imageUrl?: string;
}

export interface TutorSession {
  id: string;
  studySetId?: string;
  userId: string;
  title: string;
  activeMode: TutorMode;
  teachingStyleId?: string;
  identifiedWeakTopics: string[];
  createdAt: number;
  updatedAt: number;
}

export interface InteractiveLessonStep {
  stepNumber: number;
  title: string;
  lecture: string;
  analogies?: string;
  question: string;
  expectedConcept: string;
  hint: string;
}

export interface InteractiveLesson {
  id: string;
  studySetId?: string;
  userId: string;
  topic: string;
  learningObjective: string;
  prerequisites: string[];
  currentStepIndex: number;
  steps: InteractiveLessonStep[];
  completed: boolean;
}

export interface StudyPlanDay {
  dayName: string;
  date: string;
  tasks: {
    id: string;
    topic: string;
    activityType: 'read-notes' | 'flashcards' | 'quiz' | 'tutor-review' | 'practice-test';
    estimatedMinutes: number;
    completed: boolean;
  }[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  studySetId?: string;
  title: string;
  examDate?: string;
  targetSubject: string;
  hoursPerWeek: number;
  currentConfidence: 'low' | 'medium' | 'high';
  schedule: StudyPlanDay[];
  createdAt: number;
  updatedAt: number;
}

export interface AudioLessonScene {
  speaker: string;
  text: string;
  timestampSeconds: number;
}

export interface AudioLesson {
  id: string;
  studySetId: string;
  userId: string;
  title: string;
  mode: 'Quick recap' | 'Detailed lecture' | 'Conversation' | 'Exam revision';
  script: string;
  audioDurationSeconds: number;
  scenes: AudioLessonScene[];
  createdAt: number;
}

export interface ExplainerSlide {
  title: string;
  subtitle?: string;
  bulletPoints: string[];
  narration: string;
  visualDescription: string;
  durationSeconds: number;
  diagramType?: 'flowchart' | 'comparison' | 'hierarchy' | 'formula' | 'timeline' | 'cycle';
  diagramNodes?: { label: string; desc?: string; highlight?: boolean }[];
  avatarExpression?: 'explaining' | 'enthusiastic' | 'questioning' | 'celebrating';
  interactiveCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface ExplainerVideo {
  id: string;
  studySetId: string;
  userId: string;
  topic: string;
  slides: ExplainerSlide[];
  summary: string;
  keyPoints: string[];
  createdAt: number;
}

export interface EssayFeedback {
  id: string;
  userId: string;
  title: string;
  subject: string;
  assignmentType: string;
  originalText: string;
  estimatedScore: number;
  maxScore: number;
  strengths: string[];
  areasToImprove: string[];
  structureScore: number;
  argumentScore: number;
  clarityScore: number;
  grammarScore: number;
  evidenceScore: number;
  suggestedRevision: string;
  feedbackSummary: string;
  createdAt: number;
}

export interface TeachingStyle {
  id: string;
  userId: string;
  name: string;
  description: string;
  skillLevel: 'Beginner' | 'High School' | 'College/University' | 'Postgrad/PhD';
  tone: 'Enthusiastic' | 'Socratic & Challenging' | 'Patient & Gentle' | 'Academic Professor' | 'ELI5 Simple';
  questionDifficulty: 'Easy' | 'Moderate' | 'Demanding';
  explanationDepth: 'Concise' | 'Balanced' | 'Deep Dive';
  isPublic: boolean;
  isDefault?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number;
  target: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'study-reminder' | 'exam-alert' | 'streak' | 'material-ready' | 'achievement';
  read: boolean;
  createdAt: number;
}

export interface UserSubscription {
  userId: string;
  plan: 'free' | 'student' | 'pro';
  status: 'active' | 'trialing' | 'cancelled';
  renewalDate: number;
  limits: {
    monthlyGenerations: number;
    fileUploadsRemaining: number;
    audioLessonsRemaining: number;
    storageUsedMB: number;
    storageLimitMB: number;
  };
}

export interface StudentCognitiveMemory {
  id: string; // usually userId
  userId: string;
  learnedKnowledgeGaps: string[]; // e.g. ["Trouble with osmotic pressure formulas", "Confuses meiosis vs mitosis"]
  demonstratedStrengths: string[]; // e.g. ["Mastered citric acid cycle", "Quick with constitutional law citations"]
  preferredExplanations: {
    usesAnalogies: boolean;
    technicalDepth: 'simplified' | 'balanced' | 'rigorous';
    pacingSpeed: 'deliberate' | 'standard' | 'accelerated';
    effectiveHooks: string[]; // e.g. ["Sports analogies", "Code snippets", "Medical case studies"]
  };
  recurringMistakesCount: Record<string, number>; // topic -> mistakes count
  noraPedagogicalStrategy: {
    strategyName: string;
    focusAreas: string[];
    recentSelfAdjustment: string; // What Nora changed to teach this student better
    adaptationLevel: number; // 1-100 evolution level
    totalInteractionsReflected: number;
  };
  lastSelfReflectionAt: number;
  updatedAt: number;
}

export interface TeachingEvolutionLog {
  id: string;
  userId: string;
  interactionSummary: string;
  studentGraspObserved: 'struggling' | 'partially-understood' | 'mastered';
  identifiedGap?: string;
  tutorAdjustmentMade: string; // What Nora changed about her approach
  timestamp: number;
}
