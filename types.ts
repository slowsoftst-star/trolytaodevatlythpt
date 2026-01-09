export enum GradeLevel {
  GRADE_10 = 10,
  GRADE_11 = 11,
  GRADE_12 = 12
}

export interface Lesson {
  id: string;
  name: string;
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Curriculum {
  [key: number]: Chapter[];
}

export enum QuizType {
  MULTIPLE_CHOICE = 'Trắc nghiệm',
  TRUE_FALSE = 'Đúng/Sai',
  SHORT_ANSWER = 'Tự luận/Trả lời ngắn'
}

export enum Difficulty {
  KNOW = 'Biết',
  UNDERSTAND = 'Hiểu',
  APPLY = 'Vận dụng'
}

export interface QuizConfig {
  grade: GradeLevel;
  chapterId: string;
  lessonId: string;
  type: QuizType;
  quantity: number;
  difficulty: Difficulty;
}

// New interface for the items in the queue
export interface QuizRequestItem extends QuizConfig {
  id: string; // Unique ID for list management
  chapterName: string;
  lessonName: string;
}

export interface Question {
  id: number;
  content: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation?: string;
  type: QuizType;
}

export interface QuizResult {
  title: string;
  questions: Question[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  images?: string[]; // base64 strings
}