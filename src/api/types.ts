/** Shapes returned by the Express backend (`studyai-companion-be`). */

export type SubjectColor = 'primary' | 'accent' | 'warning' | 'error' | 'success';

export type Subject = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  color: SubjectColor;
  progress: number;
  materialsCount: number;
  examsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MaterialType = 'pdf' | 'image' | 'note';

export type Material = {
  id: string;
  subjectId: string;
  title: string;
  type: MaterialType;
  pages: number | null;
  content: string | null;
  summary: string | null;
  keyConcepts: string[];
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type QuestionType = 'multiple_choice' | 'true_false';

export type Question = {
  id: string;
  subjectId: string;
  materialId: string | null;
  prompt: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  createdAt: string;
};

export type Exam = {
  id: string;
  subjectId: string;
  name: string;
  date: string;
  score: number | null;
  correctCount: number | null;
  totalCount: number;
  timeElapsedSeconds: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  position: number;
};

export type SubjectDetail = Subject & { materials: Material[]; exams: Exam[] };
export type ExamDetail = Exam & { questions: ExamQuestion[] };

/** Payload sent to `POST /api/exams/:id/submit`; also queued locally when offline. */
export type ExamSubmissionPayload = {
  timeElapsedSeconds?: number;
  answers: { examQuestionId: string; answer: string }[];
};

export type Dashboard = {
  subjectsCount: number;
  materialsCount: number;
  examsTaken: number;
  averageScore: number | null;
  lastExam: { id: string; name: string; subject: string | null; score: number; date: string } | null;
};

export type SubjectStats = {
  subjectId: string;
  subject: string;
  color: SubjectColor;
  examsTaken: number;
  averageScore: number | null;
  bestScore: number | null;
  worstScore: number | null;
  totalStudyTimeSeconds: number;
};

export type Stats = {
  examsTaken: number;
  averageScore: number | null;
  bestScore: number | null;
  worstScore: number | null;
  totalStudyTimeSeconds: number;
  perSubject: SubjectStats[];
};

export type ActivityType = 'exam' | 'material' | 'subject';

export type Activity = {
  id: string;
  type: ActivityType;
  /** The item's own name; for a `subject` row this is the subject name itself. */
  title: string;
  /** Parent subject name for exams/materials; null for a `subject` row. */
  subject: string | null;
  /** Trailing note such as a score (`85%`); null when not applicable. */
  note: string | null;
  /** ISO 8601 timestamp; the feed is ordered newest-first. */
  timestamp: string;
};
