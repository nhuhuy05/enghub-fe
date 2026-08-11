import apiClient from "@/api/apiClient";
import { useAuthStore } from "@/features-user/auth/store/useAuthStore";
import type { ApiResponse } from "@/types/apiTypes";
import type {
  AttemptAnswer,
  AttemptContent,
  AttemptGroup,
  AttemptMedia,
  AttemptMode,
  AttemptPart,
  AttemptPassage,
  AttemptQuestion,
  AttemptResult,
  AttemptStatus,
  AttemptSummary,
  PageResult,
  PracticeQuestionChatRequest,
  PublishedTest,
  PublishedTestCollection,
  SaveAnswerInput,
  SaveAnswerResult,
  StartAttemptInput,
} from "../types";

type RawRecord = Record<string, unknown>;

type SseHandler = {
  onDelta: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

const asRecord = (value: unknown): RawRecord =>
  typeof value === "object" && value !== null ? (value as RawRecord) : {};
const asNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" ? value : fallback;
const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const asNullableString = (value: unknown) =>
  typeof value === "string" ? value : null;
const asNullableNumber = (value: unknown) =>
  typeof value === "number" ? value : null;
const asBoolean = (value: unknown) =>
  typeof value === "boolean" ? value : null;
const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const get = (item: RawRecord, camel: string, snake: string = camel) =>
  item[camel] ?? item[snake];

const unwrapResult = <T>(response: ApiResponse<T>): T => {
  if (response.code !== 1000) {
    const error = new Error(response.message || "Request failed") as Error & {
      apiCode?: number;
    };
    error.apiCode = response.code;
    throw error;
  }
  return response.result;
};

const normalizePartNumbers = (value: unknown) =>
  asArray(value).filter((part): part is number => typeof part === "number");

const normalizeCollection = (value: unknown): PublishedTestCollection => {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    name: asString(item.name),
    description: asString(item.description),
    createdAt: asNullableString(get(item, "createdAt", "created_at")),
  };
};

const normalizeTest = (value: unknown): PublishedTest => {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    collectionId: asNullableNumber(get(item, "collectionId", "collection_id")),
    collectionName: asNullableString(
      get(item, "collectionName", "collection_name"),
    ),
    testNumber: asNullableNumber(get(item, "testNumber", "test_number")),
    title: asString(item.title),
    description: asString(item.description),
    totalQuestions: asNumber(get(item, "totalQuestions", "total_questions")),
    durationMinutes: asNumber(get(item, "durationMinutes", "duration_minutes")),
    createdAt: asNullableString(get(item, "createdAt", "created_at")),
  };
};

export const normalizeAttempt = (value: unknown): AttemptSummary => {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    testId: asNumber(get(item, "testId", "test_id")),
    testTitle: asNullableString(get(item, "testTitle", "test_title")),
    mode: asString(item.mode, "MOCK") as AttemptMode,
    status: asString(item.status, "IN_PROGRESS") as AttemptStatus,
    correctCount: asNumber(get(item, "correctCount", "correct_count")),
    listeningCorrect: asNumber(
      get(item, "listeningCorrect", "listening_correct"),
    ),
    readingCorrect: asNumber(get(item, "readingCorrect", "reading_correct")),
    answeredCount: asNumber(get(item, "answeredCount", "answered_count")),
    totalQuestions: asNumber(get(item, "totalQuestions", "total_questions")),
    totalScore: asNullableNumber(get(item, "totalScore", "total_score")),
    readingScore: asNullableNumber(get(item, "readingScore", "reading_score")),
    listeningScore: asNullableNumber(
      get(item, "listeningScore", "listening_score"),
    ),
    durationSeconds: asNullableNumber(
      get(item, "durationSeconds", "duration_seconds"),
    ),
    startedAt: asNullableString(get(item, "startedAt", "started_at")),
    submittedAt: asNullableString(get(item, "submittedAt", "submitted_at")),
    expiresAt: asNullableString(get(item, "expiresAt", "expires_at")),
    remainingSeconds: asNullableNumber(
      get(item, "remainingSeconds", "remaining_seconds"),
    ),
    partNumbers: normalizePartNumbers(get(item, "partNumbers", "part_numbers")),
  };
};

const normalizeMedia = (value: unknown): AttemptMedia => {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    label: asNullableString(item.label),
    url: asNullableString(item.url),
    orderIndex: asNullableNumber(get(item, "orderIndex", "order_index")),
    startMs: asNullableNumber(get(item, "startMs", "start_ms")),
    endMs: asNullableNumber(get(item, "endMs", "end_ms")),
    transcriptEn: asNullableString(get(item, "transcriptEn", "transcript_en")),
    transcriptVi: asNullableString(get(item, "transcriptVi", "transcript_vi")),
  };
};

const normalizePassage = (value: unknown): AttemptPassage => {
  const item = asRecord(value);
  return {
    id: asNullableNumber(item.id) ?? undefined,
    title: asNullableString(item.title),
    passageType: asNullableString(get(item, "passageType", "passage_type")),
    contentFormat: asNullableString(
      get(item, "contentFormat", "content_format"),
    ),
    contentEn: asNullableString(get(item, "contentEn", "content_en")),
    contentVi: asNullableString(get(item, "contentVi", "content_vi")),
    vocabHints: asNullableString(get(item, "vocabHints", "vocab_hints")),
    label: asNullableString(item.label),
    url: asNullableString(item.url),
    orderIndex: asNullableNumber(get(item, "orderIndex", "order_index")),
  };
};

const normalizeAnswer = (value: unknown): AttemptAnswer => {
  const item = asRecord(value);
  const isCorrect = get(item, "isCorrect", "is_correct");
  return {
    id: asNumber(item.id),
    label: asString(item.label),
    answerTextEn: asNullableString(get(item, "answerTextEn", "answer_text_en")),
    answerTextVi: asNullableString(get(item, "answerTextVi", "answer_text_vi")),
    isCorrect: typeof isCorrect === "boolean" ? isCorrect : undefined,
  };
};

const normalizeQuestion = (value: unknown): AttemptQuestion => {
  const item = asRecord(value);
  return {
    id: asNumber(item.id),
    questionNumber: asNumber(get(item, "questionNumber", "question_number")),
    questionTextEn: asNullableString(
      get(item, "questionTextEn", "question_text_en"),
    ),
    questionTextVi: asNullableString(
      get(item, "questionTextVi", "question_text_vi"),
    ),
    selectedAnswerId: asNullableNumber(
      get(item, "selectedAnswerId", "selected_answer_id"),
    ),
    correctAnswerId: asNullableNumber(
      get(item, "correctAnswerId", "correct_answer_id"),
    ),
    correct: asBoolean(item.correct),
    explanationVi: asNullableString(
      get(item, "explanationVi", "explanation_vi"),
    ),
    answers: asArray(item.answers).map(normalizeAnswer),
  };
};

const normalizeGroup = (value: unknown): AttemptGroup => {
  const item = asRecord(value);
  const audio = item.audio ? normalizeMedia(item.audio) : null;
  return {
    id: asNumber(item.id),
    groupOrder: asNumber(get(item, "groupOrder", "group_order")),
    images: asArray(item.images).map(normalizeMedia),
    audio,
    passages: asArray(item.passages).map(normalizePassage),
    transcriptEn:
      asNullableString(get(item, "transcriptEn", "transcript_en")) ??
      audio?.transcriptEn ??
      null,
    transcriptVi:
      asNullableString(get(item, "transcriptVi", "transcript_vi")) ??
      audio?.transcriptVi ??
      null,
    questions: asArray(item.questions).map(normalizeQuestion),
  };
};

const normalizePart = (value: unknown): AttemptPart => {
  const item = asRecord(value);
  const partNumber = asNumber(get(item, "partNumber", "part_number"));
  return {
    partNumber,
    title: asString(item.title, `Part ${partNumber}`),
    groups: asArray(item.groups).map(normalizeGroup),
  };
};

const normalizePage = <T>(
  value: unknown,
  mapper: (item: unknown) => T,
): PageResult<T> => {
  const page = asRecord(value);
  return {
    content: asArray(page.content).map(mapper),
    number: asNumber(page.number),
    size: asNumber(page.size, 20),
    totalElements: asNumber(page.totalElements),
    totalPages: asNumber(page.totalPages),
  };
};

const normalizeContent = (value: unknown): AttemptContent => {
  const item = asRecord(value);
  return {
    attempt: normalizeAttempt(item.attempt),
    testId: asNumber(get(item, "testId", "test_id")),
    title: asString(item.title),
    description: asString(item.description),
    durationMinutes: asNumber(get(item, "durationMinutes", "duration_minutes")),
    parts: asArray(item.parts).map(normalizePart),
  };
};

const normalizeSaveAnswer = (value: unknown): SaveAnswerResult => {
  const item = asRecord(value);
  return {
    attemptId: asNumber(get(item, "attemptId", "attempt_id")),
    questionId: asNumber(get(item, "questionId", "question_id")),
    selectedAnswerId: asNullableNumber(
      get(item, "selectedAnswerId", "selected_answer_id"),
    ),
    correct: asBoolean(item.correct),
    correctAnswerId: asNullableNumber(
      get(item, "correctAnswerId", "correct_answer_id"),
    ),
    explanationVi: asNullableString(
      get(item, "explanationVi", "explanation_vi"),
    ),
    transcriptEn: asNullableString(get(item, "transcriptEn", "transcript_en")),
    transcriptVi: asNullableString(get(item, "transcriptVi", "transcript_vi")),
    answeredAt: asNullableString(get(item, "answeredAt", "answered_at")),
  };
};

const normalizeResult = (value: unknown): AttemptResult => {
  const item = asRecord(value);
  return {
    attempt: normalizeAttempt(item.attempt),
    parts: asArray(item.parts).map(normalizePart),
  };
};

export const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (
      err as { response?: { data?: { message?: string; code?: number } } }
    ).response;
    return response?.data?.message || fallback;
  }
  return err instanceof Error ? err.message || fallback : fallback;
};

export const getErrorCode = (err: unknown) => {
  if (err instanceof Error && "apiCode" in err) {
    return (err as Error & { apiCode?: number }).apiCode;
  }
  if (typeof err === "object" && err !== null && "response" in err) {
    return (err as { response?: { data?: { code?: number } } }).response?.data
      ?.code;
  }
  return undefined;
};

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/enghub").replace(
    /\/+$/,
    "",
  );

const parseSseBlock = (block: string) => {
  const lines = block.split(/\r?\n/);
  const event = lines
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).replace(/^ /, ""))
    .join("\n");

  return { event, data };
};

const parseSseData = (data: string): RawRecord & { rawText?: string } => {
  if (!data) return {};
  try {
    return asRecord(JSON.parse(data));
  } catch {
    return { rawText: data };
  }
};

const getStreamErrorMessage = async (response: Response) => {
  let message = `Chat stream failed: ${response.status}`;
  try {
    const text = await response.text();
    if (!text.trim()) return message;

    try {
      const body = asRecord(JSON.parse(text));
      return asString(body.message, message);
    } catch {
      return text.trim();
    }
  } catch {
    // Keep the HTTP status fallback.
  }
  return message;
};

const handleSseBlock = (block: string, handlers: SseHandler) => {
  if (!block.trim()) return;

  const { event, data } = parseSseBlock(block);
  const parsed = parseSseData(data);
  const text = asString(parsed.text, asString(parsed.rawText));
  const normalizedEvent = event || (text ? "delta" : undefined);

  if (normalizedEvent === "delta") {
    handlers.onDelta(text);
  } else if (normalizedEvent === "done") {
    handlers.onDone?.();
  } else if (normalizedEvent === "error") {
    handlers.onError?.(asString(parsed.message, text || "AI chat failed"));
  }
};

export const streamPracticeQuestionChat = async ({
  attemptId,
  questionId,
  request,
  signal,
  handlers,
}: {
  attemptId: number;
  questionId: number;
  request: PracticeQuestionChatRequest;
  signal?: AbortSignal;
  handlers: SseHandler;
}) => {
  const token = useAuthStore.getState().token || localStorage.getItem("token");
  const response = await fetch(
    `${getApiBaseUrl()}/attempts/${attemptId}/questions/${questionId}/chat/stream`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        message: request.message,
        conversation_id: request.conversationId ?? null,
      }),
      signal,
    },
  );

  const contentType = response.headers.get("content-type") || "";
  if (
    !response.ok ||
    !response.body ||
    contentType.includes("application/json")
  ) {
    throw new Error(await getStreamErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      handleSseBlock(block, handlers);
    }
  }

  if (buffer.trim()) {
    handleSseBlock(buffer, handlers);
  }
};

export const testAttemptService = {
  getCollections: async (): Promise<PublishedTestCollection[]> => {
    const response =
      await apiClient.get<ApiResponse<unknown[]>>("/test-collections");
    return asArray(unwrapResult(response.data)).map(normalizeCollection);
  },

  getTests: async (params?: {
    collectionId?: number;
  }): Promise<PublishedTest[]> => {
    const response = await apiClient.get<ApiResponse<unknown[]>>("/tests", {
      params,
    });
    return asArray(unwrapResult(response.data)).map(normalizeTest);
  },

  getTestsInCollection: async (
    collectionId: number,
  ): Promise<PublishedTest[]> => {
    const response = await apiClient.get<ApiResponse<unknown[]>>(
      `/test-collections/${collectionId}/tests`,
    );
    return asArray(unwrapResult(response.data)).map(normalizeTest);
  },

  getTestById: async (testId: number): Promise<PublishedTest> => {
    const response = await apiClient.get<ApiResponse<unknown>>(
      `/tests/${testId}`,
    );
    return normalizeTest(unwrapResult(response.data));
  },

  startAttempt: async ({
    testId,
    mode = "MOCK",
    partNumbers,
  }: StartAttemptInput): Promise<AttemptSummary> => {
    const response = await apiClient.post<ApiResponse<unknown>>("/attempts", {
      testId,
      mode,
      part_numbers: partNumbers,
    });
    return normalizeAttempt(unwrapResult(response.data));
  },

  getAttempts: async (params?: {
    status?: AttemptStatus;
    testId?: number;
    page?: number;
    size?: number;
  }): Promise<PageResult<AttemptSummary>> => {
    const response = await apiClient.get<ApiResponse<unknown>>("/attempts", {
      params,
    });
    return normalizePage(unwrapResult(response.data), normalizeAttempt);
  },

  getAttemptContent: async (attemptId: number): Promise<AttemptContent> => {
    const response = await apiClient.get<ApiResponse<unknown>>(
      `/attempts/${attemptId}/content`,
    );
    return normalizeContent(unwrapResult(response.data));
  },

  saveAnswer: async (
    attemptId: number,
    data: SaveAnswerInput,
  ): Promise<SaveAnswerResult> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `/attempts/${attemptId}/answers`,
      {
        questionId: data.questionId,
        selectedAnswerId: data.selectedAnswerId,
      },
    );
    return normalizeSaveAnswer(unwrapResult(response.data));
  },

  submitAttempt: async (attemptId: number): Promise<AttemptSummary> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `/attempts/${attemptId}/submit`,
    );
    return normalizeAttempt(unwrapResult(response.data));
  },

  getAttemptResult: async (attemptId: number): Promise<AttemptResult> => {
    const response = await apiClient.get<ApiResponse<unknown>>(
      `/attempts/${attemptId}/result`,
    );
    return normalizeResult(unwrapResult(response.data));
  },
};
