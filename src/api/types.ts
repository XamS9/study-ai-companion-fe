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

export type Dashboard = {
  subjectsCount: number;
  materialsCount: number;
  examsTaken: number;
  averageScore: number | null;
  lastExam: { id: string; name: string; subject: string | null; score: number; date: string } | null;
};
