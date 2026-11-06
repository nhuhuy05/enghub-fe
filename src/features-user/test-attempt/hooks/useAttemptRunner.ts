import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getErrorCode,
  getErrorMessage,
  testAttemptService,
} from '../services/testAttemptService';
import type { AttemptContent, AttemptResult, SaveAnswerResult } from '../types';

export type AnswerMap = Record<number, number | null>;
export type FeedbackMap = Record<number, SaveAnswerResult>;

const hydrateAnswers = (content: AttemptContent): AnswerMap => {
  const answers: AnswerMap = {};
  content.parts.forEach((part) => {
    part.groups.forEach((group) => {
      group.questions.forEach((question) => {
        answers[question.id] = question.selectedAnswerId;
      });
    });
  });
  return answers;
};

const hydratePracticeFeedbacks = (result: AttemptResult): FeedbackMap => {
  const feedbacks: FeedbackMap = {};

  result.parts.forEach((part) => {
    part.groups.forEach((group) => {
      group.questions.forEach((question) => {
        if (typeof question.selectedAnswerId !== 'number') return;

        feedbacks[question.id] = {
          attemptId: result.attempt.id,
          questionId: question.id,
          selectedAnswerId: question.selectedAnswerId,
          correct: question.correct ?? null,
          correctAnswerId: question.correctAnswerId ?? null,
          explanationVi: question.explanationVi ?? null,
          transcriptEn: group.transcriptEn ?? null,
          transcriptVi: group.transcriptVi ?? null,
          answeredAt: null,
        };
      });
    });
  });

  return feedbacks;
};

const patchSelectedAnswer = (
  content: AttemptContent,
  questionId: number,
  selectedAnswerId: number | null
): AttemptContent => ({
  ...content,
  parts: content.parts.map((part) => ({
    ...part,
    groups: part.groups.map((group) => ({
      ...group,
      questions: group.questions.map((question) =>
        question.id === questionId ? { ...question, selectedAnswerId } : question
      ),
    })),
  })),
});

const parseUtcDate = (dateStr: string): Date => {
  if (dateStr.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(dateStr)) {
    return new Date(dateStr);
  }
  return new Date(dateStr + 'Z');
};

const computeRemainingSeconds = (expiresAt: string | null, serverRemaining: number | null): number => {
  // Ưu tiên remainingSeconds từ server vì server tính dựa trên startedAt và clock của chính nó (không phụ thuộc múi giờ client)
  if (typeof serverRemaining === 'number' && Number.isFinite(serverRemaining) && serverRemaining >= 0) {
    return serverRemaining;
  }
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((parseUtcDate(expiresAt).getTime() - Date.now()) / 1000));
};

export const useAttemptRunner = (attemptId: number, options?: { hydratePracticeFeedbacks?: boolean }) => {
  const shouldHydratePracticeFeedbacks = options?.hydratePracticeFeedbacks ?? true;
  const navigate = useNavigate();
  const [content, setContent] = useState<AttemptContent | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [feedbacks, setFeedbacks] = useState<FeedbackMap>({});
  const [loading, setLoading] = useState(true);
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const deadlineMsRef = useRef<number | null>(null);
  const timerInitializedRef = useRef(false);

  const routeToResult = useCallback(() => {
    navigate(`/attempts/${attemptId}/result`, { replace: true });
  }, [attemptId, navigate]);

  const loadContent = useCallback(async () => {
    if (!Number.isFinite(attemptId)) {
      setLoading(false);
      setErrorMsg('Invalid attempt id.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const nextContent = await testAttemptService.getAttemptContent(attemptId);
      if (nextContent.attempt.status === 'SUBMITTED') {
        routeToResult();
        return;
      }
      setContent(nextContent);
      setAnswers(hydrateAnswers(nextContent));
      if (
        nextContent.attempt.mode === 'PRACTICE' &&
        nextContent.attempt.answeredCount > 0 &&
        shouldHydratePracticeFeedbacks
      ) {
        const result = await testAttemptService.getAttemptResult(attemptId);
        setFeedbacks(hydratePracticeFeedbacks(result));
      } else {
        setFeedbacks({});
      }

      if (nextContent.attempt.mode === 'MOCK') {
        const initialSeconds = computeRemainingSeconds(
          nextContent.attempt.expiresAt,
          nextContent.attempt.remainingSeconds
        );
        // Nếu bài thi đã thực sự hết hạn từ trước khi người dùng vào lại
        if (initialSeconds <= 0 && nextContent.attempt.startedAt) {
          routeToResult();
          return;
        }
        deadlineMsRef.current = Date.now() + initialSeconds * 1000;
        setRemainingSeconds(initialSeconds);
        timerInitializedRef.current = true;
      } else {
        setRemainingSeconds(0);
        timerInitializedRef.current = false;
      }
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 1013) {
        routeToResult();
        return;
      }
      setErrorMsg(getErrorMessage(err, 'Cannot load attempt content.'));
    } finally {
      setLoading(false);
    }
  }, [attemptId, routeToResult, shouldHydratePracticeFeedbacks]);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!content || content.attempt.mode !== 'MOCK' || deadlineMsRef.current === null) return;

    const tick = () => {
      if (deadlineMsRef.current === null) return;
      const diff = Math.max(0, Math.ceil((deadlineMsRef.current - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [content?.attempt.id, content?.attempt.mode]);

  const submitAttempt = useCallback(async () => {
    if (!Number.isFinite(attemptId)) return;

    try {
      setSubmitting(true);
      setErrorMsg('');
      await testAttemptService.submitAttempt(attemptId);
      routeToResult();
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 1013) {
        routeToResult();
        return;
      }
      setErrorMsg(getErrorMessage(err, 'Cannot submit this attempt.'));
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, routeToResult]);

  useEffect(() => {
    // Chỉ auto-submit khi:
    // 1. Content đã tải
    // 2. Chế độ MOCK (luyện thi tính giờ)
    // 3. Timer ĐÃ ĐƯỢC khởi tạo từ trước (timerInitializedRef.current === true)
    // 4. Thời gian còn lại đã đếm lùi về đúng 0
    // 5. Chưa đang trong tiến trình submit
    if (
      !content ||
      content.attempt.mode !== 'MOCK' ||
      !timerInitializedRef.current ||
      remainingSeconds > 0 ||
      submitting
    ) {
      return;
    }
    void submitAttempt();
  }, [content, remainingSeconds, submitAttempt, submitting]);

  const saveAnswer = useCallback(
    async (questionId: number, selectedAnswerId: number | null) => {
      if (!Number.isFinite(attemptId)) return;

      const previousAnswer = answers[questionId] ?? null;
      setSavingQuestionId(questionId);
      setErrorMsg('');
      setAnswers((current) => ({ ...current, [questionId]: selectedAnswerId }));
      setContent((current) => (current ? patchSelectedAnswer(current, questionId, selectedAnswerId) : current));

      try {
        const result = await testAttemptService.saveAnswer(attemptId, { questionId, selectedAnswerId });
        setAnswers((current) => ({ ...current, [questionId]: result.selectedAnswerId }));
        setContent((current) =>
          current ? patchSelectedAnswer(current, questionId, result.selectedAnswerId) : current
        );
        if (content?.attempt.mode === 'PRACTICE') {
          setFeedbacks((current) => ({ ...current, [questionId]: result }));
        }
      } catch (err) {
        const code = getErrorCode(err);
        setAnswers((current) => ({ ...current, [questionId]: previousAnswer }));
        setContent((current) => (current ? patchSelectedAnswer(current, questionId, previousAnswer) : current));

        if (code === 1013) {
          routeToResult();
          return;
        }

        if (code === 1010) {
          void loadContent();
        }

        setErrorMsg(getErrorMessage(err, 'Cannot save this answer.'));
      } finally {
        setSavingQuestionId(null);
      }
    },
    [answers, attemptId, content?.attempt.mode, loadContent, routeToResult]
  );

  const answeredCount = useMemo(
    () => Object.values(answers).filter((answerId) => typeof answerId === 'number').length,
    [answers]
  );

  return {
    answers,
    answeredCount,
    content,
    errorMsg,
    feedbacks,
    loadContent,
    loading,
    remainingSeconds,
    saveAnswer,
    savingQuestionId,
    submitAttempt,
    submitting,
  };
};
