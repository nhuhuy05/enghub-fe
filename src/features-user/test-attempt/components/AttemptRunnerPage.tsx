import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Loader2,
  Menu,
  Send,
  Volume2,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EngHubLogo } from '@/components/brand/EngHubLogo';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAttemptRunner } from '../hooks/useAttemptRunner';
import { streamPracticeQuestionChat } from '../services/testAttemptService';
import type { AttemptGroup, AttemptPart } from '../types';
import { ContextPanel } from './ContextPanel';
import { PracticeQuestionChatPanel, type ChatMessage } from './PracticeQuestionChatPanel';
import { QuestionPalette } from './QuestionPalette';
import { QuestionPanel } from './QuestionPanel';

interface QuestionRef {
  partNumber: number;
  groupId: number;
  questionId: number;
  questionNumber: number;
}

interface GroupRef {
  partNumber: number;
  groupId: number;
  firstQuestionId: number;
}

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return [hours, minutes, secs].map((value) => value.toString().padStart(2, '0')).join(':');
};

const flattenQuestions = (parts: AttemptPart[]): QuestionRef[] =>
  parts.flatMap((part) =>
    part.groups.flatMap((group) =>
      group.questions.map((question) => ({
        partNumber: part.partNumber,
        groupId: group.id,
        questionId: question.id,
        questionNumber: question.questionNumber,
      }))
    )
  );

const flattenGroups = (parts: AttemptPart[]): GroupRef[] =>
  parts.flatMap((part) =>
    part.groups.flatMap((group) => {
      const firstQuestion = group.questions[0];
      return firstQuestion
        ? [
            {
              partNumber: part.partNumber,
              groupId: group.id,
              firstQuestionId: firstQuestion.id,
            },
          ]
        : [];
    })
  );

const getFirstUnansweredQuestionId = (parts: AttemptPart[]) => {
  for (const part of parts) {
    for (const group of part.groups) {
      const question = group.questions.find((item) => typeof item.selectedAnswerId !== 'number');
      if (question) return question.id;
    }
  }
  return parts[0]?.groups[0]?.questions[0]?.id ?? null;
};

const getSectionLabel = (partNumber: number) => (partNumber <= 4 ? 'Listening' : 'Reading');

const getGroupQuestionLabel = (part: AttemptPart | null, group: AttemptGroup | null, totalQuestions: number) => {
  if (!part || !group || group.questions.length === 0) return `Questions 0 / ${totalQuestions}`;
  const numbers = group.questions.map((question) => question.questionNumber).sort((a, b) => a - b);
  const first = numbers[0];
  const last = numbers[numbers.length - 1];
  const range = first === last ? `${first}` : `${first} - ${last}`;
  return `${getSectionLabel(part.partNumber)}: Questions ${range} / ${totalQuestions}`;
};

export const AttemptRunnerPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const numericAttemptId = Number(attemptId);
  const isFreshStart = Boolean((location.state as { freshStart?: boolean } | null)?.freshStart);
  const {
    answers,
    answeredCount,
    content,
    errorMsg,
    feedbacks,
    loading,
    remainingSeconds,
    saveAnswer,
    savingQuestionId,
    submitAttempt,
    submitting,
  } = useAttemptRunner(numericAttemptId, { hydratePracticeFeedbacks: !isFreshStart });
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [markedQuestions, setMarkedQuestions] = useState<Record<number, boolean>>({});
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [chatByQuestionId, setChatByQuestionId] = useState<Record<number, ChatMessage[]>>({});
  const [chatQuestionId, setChatQuestionId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatPanelWidth, setChatPanelWidth] = useState(420);
  const [streamingQuestionId, setStreamingQuestionId] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatAnimationRef = useRef<Record<string, { queue: string[]; timer: ReturnType<typeof window.setTimeout> | null }>>({});
  const chatIdRef = useRef(0);

  const questionRefs = useMemo(() => (content ? flattenQuestions(content.parts) : []), [content]);
  const groupRefs = useMemo(() => (content ? flattenGroups(content.parts) : []), [content]);
  const resumeQuestionId = useMemo(() => (content ? getFirstUnansweredQuestionId(content.parts) : null), [content]);
  const activeRef = questionRefs.find((item) => item.questionId === activeQuestionId) || questionRefs[0];
  const activePart = content?.parts.find((part) => part.partNumber === activeRef?.partNumber) || null;
  const activeGroup = activePart?.groups.find((group) => group.id === activeRef?.groupId) || null;
  const activeGroupIndex = activeRef
    ? groupRefs.findIndex((item) => item.partNumber === activeRef.partNumber && item.groupId === activeRef.groupId)
    : -1;
  const hasGroupAudio = Boolean(activeGroup?.audio?.url);
  const showFooterNavigation = content?.attempt.mode === 'PRACTICE' || Boolean(activePart?.partNumber && activePart.partNumber >= 5);
  const chatQuestion = useMemo(
    () => questionRefs.find((item) => item.questionId === chatQuestionId) || null,
    [chatQuestionId, questionRefs]
  );
  const canUseAiChat =
    content?.attempt.mode === 'PRACTICE' && content.attempt.status === 'IN_PROGRESS' && Number.isFinite(numericAttemptId);

  useEffect(() => {
    if (!activeQuestionId && resumeQuestionId) {
      setActiveQuestionId(resumeQuestionId);
    }
  }, [activeQuestionId, resumeQuestionId]);

  useEffect(() => {
    document.querySelectorAll('audio').forEach((audio) => {
      audio.volume = volume;
    });
  }, [volume, activeGroup?.id]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      Object.values(chatAnimationRef.current).forEach((entry) => {
        if (entry.timer) window.clearTimeout(entry.timer);
      });
    };
  }, []);

  const goGroupByOffset = (offset: number) => {
    const nextGroup = groupRefs[activeGroupIndex + offset];
    if (nextGroup) setActiveQuestionId(nextGroup.firstQuestionId);
  };

  const handleListeningAudioEnded = () => {
    const nextGroup = groupRefs[activeGroupIndex + 1];
    if (nextGroup && nextGroup.partNumber <= 4) {
      setActiveQuestionId(nextGroup.firstQuestionId);
    }
  };

  const handleSubmit = () => {
    setIsSubmitConfirmOpen(true);
  };

  const confirmSubmit = () => {
    setIsSubmitConfirmOpen(false);
    void submitAttempt();
  };

  const toggleMarked = () => {
    if (!activeQuestionId) return;
    setMarkedQuestions((current) => ({ ...current, [activeQuestionId]: !current[activeQuestionId] }));
  };

  const createChatMessageId = () => {
    chatIdRef.current += 1;
    return `chat-${Date.now()}-${chatIdRef.current}`;
  };

  const scheduleAssistantTyping = (questionId: number, messageId: string) => {
    const entry = chatAnimationRef.current[messageId];
    if (!entry || entry.timer || entry.queue.length === 0) return;

    entry.timer = window.setTimeout(() => {
      const currentEntry = chatAnimationRef.current[messageId];
      if (!currentEntry) return;

      currentEntry.timer = null;
      const nextText = currentEntry.queue.splice(0, currentEntry.queue[0] === '\n' ? 1 : 3).join('');

      setChatByQuestionId((current) => ({
        ...current,
        [questionId]: (current[questionId] || []).map((item) =>
          item.id === messageId ? { ...item, content: item.content + nextText } : item
        ),
      }));

      if (currentEntry.queue.length > 0) {
        scheduleAssistantTyping(questionId, messageId);
      }
    }, 18);
  };

  const appendAssistantDelta = (questionId: number, messageId: string, text: string) => {
    if (!text) return;
    const entry = chatAnimationRef.current[messageId] ?? { queue: [], timer: null };
    entry.queue.push(...Array.from(text));
    chatAnimationRef.current[messageId] = entry;
    scheduleAssistantTyping(questionId, messageId);
  };

  const clearChatAnimations = () => {
    Object.values(chatAnimationRef.current).forEach((entry) => {
      if (entry.timer) window.clearTimeout(entry.timer);
    });
    chatAnimationRef.current = {};
  };

  const openAiChat = (questionId: number) => {
    setChatQuestionId(questionId);
    setChatError('');
  };

  const closeAiChat = () => {
    setChatQuestionId(null);
    setChatInput('');
    setChatError('');
  };

  const stopAiChat = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearChatAnimations();
    setStreamingQuestionId(null);
    setChatByQuestionId((current) => {
      if (!chatQuestionId) return current;
      return {
        ...current,
        [chatQuestionId]: (current[chatQuestionId] || []).map((message) =>
          message.streaming ? { ...message, streaming: false } : message
        ),
      };
    });
  };

  const sendAiChatMessage = async () => {
    const questionId = chatQuestionId;
    const message = chatInput.trim();
    if (!questionId || !message || !canUseAiChat || streamingQuestionId) return;

    const userMessage: ChatMessage = {
      id: createChatMessageId(),
      role: 'user',
      content: message,
    };
    const assistantMessage: ChatMessage = {
      id: createChatMessageId(),
      role: 'assistant',
      content: '',
      streaming: true,
    };
    const controller = new AbortController();

    abortControllerRef.current = controller;
    setChatInput('');
    setChatError('');
    setStreamingQuestionId(questionId);
    setChatByQuestionId((current) => ({
      ...current,
      [questionId]: [...(current[questionId] || []), userMessage, assistantMessage],
    }));

    try {
      await streamPracticeQuestionChat({
        attemptId: numericAttemptId,
        questionId,
        request: { message },
        signal: controller.signal,
        handlers: {
          onDelta: (text) => {
            appendAssistantDelta(questionId, assistantMessage.id, text);
          },
          onDone: () => {
            setChatByQuestionId((current) => ({
              ...current,
              [questionId]: (current[questionId] || []).map((item) =>
                item.id === assistantMessage.id ? { ...item, streaming: false } : item
              ),
            }));
          },
          onError: (message) => {
            setChatError(message);
            setChatByQuestionId((current) => ({
              ...current,
              [questionId]: (current[questionId] || []).map((item) =>
                item.id === assistantMessage.id ? { ...item, content: item.content || message, streaming: false } : item
              ),
            }));
          },
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Không gửi được tin nhắn AI';
      setChatError(message);
      setChatByQuestionId((current) => ({
        ...current,
        [questionId]: (current[questionId] || []).map((item) =>
          item.id === assistantMessage.id ? { ...item, content: item.content || message, streaming: false } : item
        ),
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setStreamingQuestionId(null);
      setChatByQuestionId((current) => ({
        ...current,
        [questionId]: (current[questionId] || []).map((item) =>
          item.id === assistantMessage.id ? { ...item, streaming: false } : item
        ),
      }));
    }
  };

  if (!Number.isFinite(numericAttemptId)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fc] p-4">
        <p className="rounded-xl border border-[#fee4e2] bg-white p-5 text-sm font-bold text-[#b42318]">
          Mã lượt làm bài không hợp lệ.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7fc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
        <p className="text-sm font-bold text-[#667085]">Đang tải bài làm...</p>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f7fc] p-4 text-center">
        <div className="flex items-center gap-2 rounded-xl border border-[#fee4e2] bg-[#fef3f2] p-4 text-sm font-bold text-[#b42318]">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorMsg || 'Không thể tải nội dung bài thi.'}
        </div>
        <button
          type="button"
          onClick={() => navigate('/tests')}
          className="rounded-xl bg-[#004ac6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#003da3]"
        >
          Quay lại danh sách đề thi
        </button>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f7fc] text-[#191b23]">
      <header className="relative z-40 flex h-16 shrink-0 items-center bg-[#004ac6] px-4 text-white shadow-sm">
        <div className="flex w-full items-center gap-4">
          <div className="flex w-[260px] shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/tests')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-white/90 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
              <EngHubLogo markClassName="h-7 w-10" textClassName="hidden" />
            </div>
          </div>

          <h1 className="min-w-0 flex-1 truncate text-center text-base font-bold">
            {getGroupQuestionLabel(activePart, activeGroup, content.attempt.totalQuestions)}
          </h1>

          <div className="flex w-[360px] shrink-0 items-center justify-end gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsVolumeOpen((value) => !value)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f86ff] text-white shadow-sm transition hover:bg-[#1673db]"
                title={hasGroupAudio ? 'Âm lượng audio' : 'Âm lượng audio'}
              >
                <Volume2 className="h-4 w-4" />
              </button>
              {isVolumeOpen && (
                <div className="absolute right-0 top-10 z-50 w-40 rounded-xl border border-[#d8dced] bg-white p-3 text-[#111827] shadow-xl">
                  <label className="text-xs font-bold text-[#667085]" htmlFor="attempt-volume">
                    Âm lượng {Math.round(volume * 100)}%
                  </label>
                  <input
                    id="attempt-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="mt-2 w-full accent-[#004ac6]"
                  />
                </div>
              )}
            </div>
            <span className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-black text-[#004ac6] shadow-sm">
              {answeredCount}/{content.attempt.totalQuestions}
            </span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1f86ff] px-3 text-xs font-black text-white shadow-sm">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTime(remainingSeconds)}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#ff8a1f] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#ea760b] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Nộp bài
            </button>
          </div>
        </div>
      </header>

      {errorMsg && (
        <div className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[1440px] items-center gap-2 rounded-xl border border-[#fee4e2] bg-[#fef3f2] p-3 text-sm font-bold text-[#b42318]">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <main className="grid min-h-0 w-full flex-1 grid-cols-1 lg:grid-cols-2">
        {activePart && activeGroup ? (
          <>
            <ContextPanel
              group={activeGroup}
              onAudioEnded={handleListeningAudioEnded}
              part={activePart}
              mode={content.attempt.mode}
              feedbacks={feedbacks}
            />
            <QuestionPanel
              activeQuestionId={activeQuestionId}
              answers={answers}
              canUseAiChat={canUseAiChat}
              feedbacks={feedbacks}
              group={activeGroup}
              mode={content.attempt.mode}
              onOpenAiChat={openAiChat}
              onSaveAnswer={saveAnswer}
              savingQuestionId={savingQuestionId}
              partNumber={activePart.partNumber}
            />
          </>
        ) : (
          <div className="col-span-full rounded-sm border border-[#d8dced] bg-white p-10 text-center text-sm font-bold text-[#667085]">
            Chưa chọn câu hỏi.
          </div>
        )}
      </main>

      <QuestionPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        activeQuestionId={activeQuestionId}
        answers={answers}
        markedQuestions={markedQuestions}
        onSelect={(questionId) => {
          setActiveQuestionId(questionId);
          setIsPaletteOpen(false);
        }}
        parts={content.parts}
      />

      <PracticeQuestionChatPanel
        error={chatError}
        input={chatInput}
        isOpen={Boolean(chatQuestionId)}
        messages={chatQuestionId ? chatByQuestionId[chatQuestionId] || [] : []}
        onClose={closeAiChat}
        onInputChange={setChatInput}
        onWidthChange={setChatPanelWidth}
        onSend={() => void sendAiChatMessage()}
        onStop={stopAiChat}
        panelWidth={chatPanelWidth}
        questionNumber={chatQuestion?.questionNumber ?? null}
        streaming={Boolean(chatQuestionId && streamingQuestionId === chatQuestionId)}
        hasAnswer={Boolean(chatQuestionId && typeof answers[chatQuestionId] === 'number')}
      />

      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        title="Nộp bài?"
        message="Sau khi nộp bài, bạn sẽ không thể chỉnh sửa câu trả lời."
        confirmLabel="Nộp bài"
        loading={submitting}
        tone="warning"
        onCancel={() => setIsSubmitConfirmOpen(false)}
        onConfirm={confirmSubmit}
      />

      {showFooterNavigation && (
        <footer className="relative h-14 shrink-0 border-t border-[#d8dced] bg-white">
          <label className="absolute left-8 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center gap-2 text-sm font-semibold text-[#344054]">
            <input
              type="checkbox"
              checked={Boolean(activeQuestionId && markedQuestions[activeQuestionId])}
              onChange={toggleMarked}
              className="h-4 w-4 rounded border-[#c3c6d7] text-[#004ac6] focus:ring-[#004ac6]"
            />
            Đánh dấu để xem lại
          </label>

          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              className="flex h-10 w-12 items-center justify-center rounded-md bg-[#004ac6] text-white shadow-sm transition hover:bg-[#003da3]"
              aria-label="Danh sách câu hỏi"
              title="Danh sách câu hỏi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goGroupByOffset(-1)}
              disabled={activeGroupIndex <= 0}
              className="flex h-10 w-12 items-center justify-center rounded-md bg-[#4b9f3a] text-white shadow-sm transition hover:bg-[#3f872f] disabled:bg-[#d0d5dd]"
              aria-label="Nhóm trước"
              title="Nhóm trước"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goGroupByOffset(1)}
              disabled={activeGroupIndex >= groupRefs.length - 1}
              className="flex h-10 w-12 items-center justify-center rounded-md bg-[#4b9f3a] text-white shadow-sm transition hover:bg-[#3f872f] disabled:bg-[#d0d5dd]"
              aria-label="Nhóm sau"
              title="Nhóm sau"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
