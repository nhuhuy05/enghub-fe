import { useEffect, useMemo, useState } from 'react';
import { listeningService } from '../services/listeningService';
import type { ListeningHintLevel, ListeningSession } from '../types';

export const useListeningSession = (testId: string, partId: string) => {
  const [session, setSession] = useState<ListeningSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<ListeningHintLevel>(50);
  const [dictationWordAnswers, setDictationWordAnswers] = useState<Record<string, Record<number, string>>>({});
  const [dictationFullAnswers, setDictationFullAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await listeningService.getSession(testId, partId);
        setSession(data);
        setActiveGroupId(data.groups[0]?.id || null);
        setActiveSentenceId(data.groups[0]?.sentences[0]?.id || null);
      } catch {
        setError('Không thể tải bài luyện nghe.');
      } finally {
        setIsLoading(false);
      }
    };

    if (testId && partId) {
      fetchSession();
    } else {
      setIsLoading(false);
      setError('Thiếu thông tin test hoặc part.');
    }
  }, [partId, testId]);

  const flatSentences = useMemo(() => {
    if (!session) return [];
    return session.groups.flatMap((group, groupIndex) =>
      group.sentences.map((sentence, sentenceIndex) => ({
        group,
        sentence,
        groupIndex,
        sentenceIndex,
      })),
    );
  }, [session]);

  const activeItem = useMemo(() => {
    return flatSentences.find((item) => item.sentence.id === activeSentenceId) || flatSentences[0] || null;
  }, [activeSentenceId, flatSentences]);

  const activeGroup = activeItem?.group || null;
  const activeSentence = activeItem?.sentence || null;
  const currentSentenceNumber = activeItem ? activeItem.sentenceIndex + 1 : 0;
  const totalSentencesInGroup = activeGroup?.sentences.length || 0;

  const selectSentence = (groupId: string, sentenceId: string) => {
    setActiveGroupId(groupId);
    setActiveSentenceId(sentenceId);
  };

  const goToOffset = (offset: number) => {
    if (!activeSentence) return;
    const currentIndex = flatSentences.findIndex((item) => item.sentence.id === activeSentence.id);
    const nextItem = flatSentences[currentIndex + offset];
    if (!nextItem) return;
    selectSentence(nextItem.group.id, nextItem.sentence.id);
  };

  const setDictationWordAnswer = (sentenceId: string, wordIndex: number, answer: string) => {
    setDictationWordAnswers((prev) => ({
      ...prev,
      [sentenceId]: {
        ...(prev[sentenceId] || {}),
        [wordIndex]: answer,
      },
    }));
  };

  const setDictationFullAnswer = (sentenceId: string, answer: string) => {
    setDictationFullAnswers((prev) => ({
      ...prev,
      [sentenceId]: answer,
    }));
  };

  return {
    session,
    isLoading,
    error,
    activeGroupId,
    activeSentenceId,
    activeGroup,
    activeSentence,
    currentSentenceNumber,
    totalSentencesInGroup,
    hintLevel,
    setHintLevel,
    dictationWordAnswers,
    dictationFullAnswers,
    selectSentence,
    goPrev: () => goToOffset(-1),
    goNext: () => goToOffset(1),
    setDictationWordAnswer,
    setDictationFullAnswer,
  };
};
