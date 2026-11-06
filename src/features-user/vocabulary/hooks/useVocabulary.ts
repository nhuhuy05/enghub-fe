import { useEffect, useState } from 'react';
import type { VocabularyTopic } from '../types';
import { vocabularyService } from '../services/vocabularyService';
import { useAuthStore } from '@/features-user/auth/store/useAuthStore';

export const useVocabulary = () => {
  const [topics, setTopics] = useState<VocabularyTopic[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const nextTopics = await vocabularyService.getTopics();
        setTopics(nextTopics);

        if (isAuthenticated) {
          try {
            const dueWords = await vocabularyService.getDue();
            setDueCount(dueWords.length);
          } catch {
            setDueCount(0);
          }
        } else {
          setDueCount(0);
        }
      } catch {
        setError('Không thể tải danh sách chủ đề từ vựng.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTopics();
  }, [isAuthenticated]);

  return { topics, dueCount, isLoading, error };
};
