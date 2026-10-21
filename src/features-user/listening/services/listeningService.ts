import apiClient from '@/api/apiClient';
import type { ApiResponse } from '@/types/apiTypes';
import { testAttemptService } from '@/features-user/test-attempt/services/testAttemptService';
import type { PublishedTest } from '@/features-user/test-attempt/types';
import type {
  ListeningDictationGroup,
  ListeningDictationSession,
  ListeningDictationSentence,
  ListeningExerciseGroup,
  ListeningHintLevel,
  ListeningPart,
  ListeningSession,
  ListeningTest,
} from '../types';

const listeningParts: ListeningPart[] = [
  {
    id: 'part-1',
    name: 'Part 1',
    title: 'Photographs',
    description: 'Nghe mô tả hình ảnh và luyện chép từng câu.',
    questionsCount: 6,
    duration: 480,
    accent: 'US',
  },
  {
    id: 'part-2',
    name: 'Part 2',
    title: 'Question-Response',
    description: 'Nghe hỏi đáp ngắn và luyện phản xạ câu trả lời.',
    questionsCount: 25,
    duration: 780,
    accent: 'US/UK',
  },
  {
    id: 'part-3',
    name: 'Part 3',
    title: 'Conversations',
    description: 'Luyện nghe hội thoại theo từng đoạn transcript.',
    questionsCount: 39,
    duration: 1200,
    accent: 'US/AU',
  },
  {
    id: 'part-4',
    name: 'Part 4',
    title: 'Short Talks',
    description: 'Luyện nghe bài nói ngắn, thông báo và voicemail.',
    questionsCount: 30,
    duration: 1080,
    accent: 'UK/AU',
  },
];

const unwrapResult = <T>(response: ApiResponse<T>): T => {
  if (response.code !== 1000) {
    const error = new Error(getListeningErrorMessage(response.code, response.message)) as Error & { apiCode?: number };
    error.apiCode = response.code;
    throw error;
  }
  return response.result;
};

export const getListeningErrorMessage = (code: number | undefined, fallback = 'Không thể tải dữ liệu nghe chép.') => {
  if (code === 1009) return 'Không tìm thấy test đã publish cho bài nghe này.';
  if (code === 1001) return 'Part nghe chép không hợp lệ. Chỉ hỗ trợ Part 1 đến Part 4.';
  if (code === 1034) return 'Group nghe chưa có audio.';
  return fallback;
};

const parsePartNumber = (partId: string) => {
  const match = partId.match(/^part-(\d+)$/i);
  const partNumber = match ? Number(match[1]) : Number(partId);
  if (![1, 2, 3, 4].includes(partNumber)) {
    const error = new Error(getListeningErrorMessage(1001)) as Error & { apiCode?: number };
    error.apiCode = 1001;
    throw error;
  }
  return partNumber;
};

const normalizeHintLevels = (levels: ListeningHintLevel[] | null | undefined): ListeningHintLevel[] => {
  const valid = (levels || []).filter((level): level is ListeningHintLevel => [30, 50, 100].includes(level));
  return valid.length ? valid : [30, 50, 100];
};

const mapSentence = (sentence: ListeningDictationSentence): ListeningExerciseGroup['sentences'][number] => ({
  id: sentence.id,
  speaker: sentence.speaker,
  text: sentence.text,
  translation: sentence.translation ?? '',
  audioUrl: sentence.audio_url,
  startMs: sentence.start_ms,
  endMs: sentence.end_ms,
  orderIndex: sentence.order_index,
  hintLevels: normalizeHintLevels(sentence.hint_levels),
});

const mapGroup = (group: ListeningDictationGroup): ListeningExerciseGroup => ({
  id: String(group.id),
  title: group.title,
  groupOrder: group.group_order,
  questionNumbers: group.question_numbers || [],
  sentences: (group.sentences || []).map(mapSentence),
});

const mapSession = (data: ListeningDictationSession): ListeningSession => ({
  testId: String(data.test_id),
  partId: data.part_id || `part-${data.part_number}`,
  title: data.title,
  partName: data.part_name,
  instruction: data.instruction,
  audioUrl: data.groups[0]?.sentences[0]?.audio_url ?? '',
  duration: 0,
  vocabulary: [],
  groups: (data.groups || []).map(mapGroup),
});

const mapPublishedTest = (test: PublishedTest): ListeningTest => ({
  id: String(test.id),
  collection: test.collectionName || 'Published Tests',
  name: test.testNumber ? `Test ${test.testNumber}` : test.title,
  title: test.title,
  description: test.description,
  totalQuestions: test.totalQuestions,
  estimatedMinutes: test.durationMinutes,
  parts: listeningParts,
});

export const listeningService = {
  getTests: async (): Promise<ListeningTest[]> => {
    const tests = await testAttemptService.getTests();
    return tests.map(mapPublishedTest);
  },

  getSession: async (testId: string, partId: string): Promise<ListeningSession> => {
    const partNumber = parsePartNumber(partId);
    const response = await apiClient.get<ApiResponse<ListeningDictationSession>>(
      `/listening/tests/${testId}/parts/${partNumber}/dictation`
    );
    return mapSession(unwrapResult(response.data));
  },
};
