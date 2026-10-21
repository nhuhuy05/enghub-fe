export type ListeningHintLevel = 30 | 50 | 100;

export interface ListeningPart {
  id: string;
  name: string;
  title: string;
  description: string;
  questionsCount: number;
  duration: number;
  accent: string;
}

export interface ListeningTest {
  id: string;
  collection: string;
  name: string;
  title: string;
  description: string;
  totalQuestions: number;
  estimatedMinutes: number;
  parts: ListeningPart[];
  isNew?: boolean;
}

export interface ListeningSentence {
  id: string;
  speaker: string | null;
  text: string;
  translation: string;
  audioUrl: string;
  startMs: number | null;
  endMs: number | null;
  orderIndex: number;
  hintLevels: ListeningHintLevel[];
}

export interface ListeningExerciseGroup {
  id: string;
  title: string;
  groupOrder: number;
  questionNumbers: number[];
  sentences: ListeningSentence[];
}

export interface ListeningSession {
  testId: string;
  partId: string;
  title: string;
  partName: string;
  instruction: string;
  audioUrl: string;
  duration: number;
  vocabulary: Array<{
    term: string;
    meaning: string;
  }>;
  groups: ListeningExerciseGroup[];
}

export interface ListeningDictationSentence {
  id: string;
  speaker: string | null;
  text: string;
  translation: string | null;
  audio_url: string;
  start_ms: number | null;
  end_ms: number | null;
  order_index: number;
  completed: boolean;
  hint_levels: ListeningHintLevel[];
}

export interface ListeningDictationGroup {
  id: number;
  title: string;
  group_order: number;
  question_numbers: number[];
  sentences: ListeningDictationSentence[];
}

export interface ListeningDictationSession {
  test_id: number;
  part_id: string;
  part_number: number;
  title: string;
  part_name: string;
  instruction: string;
  groups: ListeningDictationGroup[];
}
