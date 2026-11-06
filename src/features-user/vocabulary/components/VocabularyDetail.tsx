import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText, Loader2, Volume2 } from 'lucide-react';
import { useVocabularyDetail } from '../hooks/useVocabularyDetail';
import { getVocabularyErrorMessage, vocabularyService } from '../services/vocabularyService';
import type { Vocabulary, VocabularyReviewOption, VocabularyReviewRating } from '../types';
import { useAuthStore } from '@/features-user/auth/store/useAuthStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type DetailTab = 'words' | 'flashcard';

const ratingStyles: Record<VocabularyReviewRating, { label: string; className: string }> = {
  AGAIN: { label: 'Again', className: 'border-[#fca5a5] text-[#b42318] hover:bg-[#fef3f2]' },
  HARD: { label: 'Hard', className: 'border-[#fedf89] text-[#b25e00] hover:bg-[#fffaeb]' },
  GOOD: { label: 'Good', className: 'border-[#b7cdf8] text-[#004ac6] hover:bg-[#eaf0ff]' },
  EASY: { label: 'Easy', className: 'border-[#abefc6] text-[#027a48] hover:bg-[#ecfdf3]' },
};

const ratingOrder: VocabularyReviewRating[] = ['AGAIN', 'HARD', 'GOOD', 'EASY'];

const fallbackReviewOptions: VocabularyReviewOption[] = ratingOrder.map((rating) => ({
  rating,
  label: ratingStyles[rating].label,
  delayLabel: '',
  nextReviewAt: null,
}));

const playAudio = (url: string | null) => {
  if (!url) return;
  void new Audio(url).play();
};

export const VocabularyDetail = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const numericTopicId = Number(topicId);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { topic, words, setWords, isLoading, error } = useVocabularyDetail(Number.isFinite(numericTopicId) ? numericTopicId : null);
  const [activeTab, setActiveTab] = useState<DetailTab>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [learningId, setLearningId] = useState<number | null>(null);
  const [reviewingRating, setReviewingRating] = useState<VocabularyReviewRating | null>(null);
  const [actionError, setActionError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const currentWord = words[currentIndex] ?? null;
  const progressText = useMemo(() => {
    if (!words.length) return '0/0';
    return `${currentIndex + 1}/${words.length}`;
  }, [currentIndex, words.length]);

  const goToCard = (nextIndex: number) => {
    if (!words.length) return;
    const normalizedIndex = (nextIndex + words.length) % words.length;
    setCurrentIndex(normalizedIndex);
    setRevealed(false);
    setActionError('');
  };

  const markCurrentWordLearned = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!currentWord || currentWord.progress || learningId === currentWord.id) return;

    try {
      setLearningId(currentWord.id);
      setActionError('');
      const nextWord = await vocabularyService.learn(currentWord.id);
      setWords((current) => current.map((word) => (word.id === nextWord.id ? nextWord : word)));
    } catch (err) {
      setActionError(getVocabularyErrorMessage(err, 'Không thể lưu tiến độ học từ này.'));
    } finally {
      setLearningId(null);
    }
  };

  const flipCard = () => {
    if (!revealed && isAuthenticated) {
      void markCurrentWordLearned();
    }
    setRevealed((value) => !value);
  };

  const rateCurrentWord = async (rating: VocabularyReviewRating) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (!currentWord || reviewingRating) return;

    try {
      setReviewingRating(rating);
      setActionError('');
      const nextWord = await vocabularyService.review(currentWord.id, rating);
      setWords((current) => current.map((word) => (word.id === nextWord.id ? nextWord : word)));
      goToCard(currentIndex + 1);
    } catch (err) {
      setActionError(getVocabularyErrorMessage(err, 'Không thể lưu kết quả ôn tập.'));
    } finally {
      setReviewingRating(null);
    }
  };

  if (!Number.isFinite(numericTopicId)) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f6f7fc] p-4">
        <p className="rounded-xl border border-[#fee4e2] bg-white p-5 text-sm font-bold text-[#b42318]">
          Mã chủ đề không hợp lệ.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-[#f6f7fc]">
        <Loader2 className="h-9 w-9 animate-spin text-[#004ac6]" />
        <p className="font-semibold text-[#667085]">Đang tải từ vựng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-[#f6f7fc] px-4 text-center">
        <h2 className="text-xl font-black text-[#d92d20]">{error}</h2>
        <button onClick={() => navigate('/vocabulary')} className="rounded-xl bg-[#004ac6] px-5 py-2.5 text-sm font-bold text-white">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7fc] px-4 py-4 text-[#191b23] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1040px]">
        <header className="mb-5">
          <button
            type="button"
            onClick={() => navigate('/vocabulary')}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#505f76] transition hover:text-[#004ac6]"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách chủ đề
          </button>
          <h1 className="text-3xl font-black text-[#111827]">{topic?.name || `Chủ đề #${numericTopicId}`}</h1>
        </header>

        <div className="mb-5 inline-flex rounded-xl border border-[#d8dced] bg-white p-1 shadow-sm">
          <TabButton active={activeTab === 'words'} onClick={() => setActiveTab('words')}>
            Danh sách từ
          </TabButton>
          <TabButton active={activeTab === 'flashcard'} onClick={() => setActiveTab('flashcard')}>
            Flashcard
          </TabButton>
        </div>

        {actionError && (
          <div className="mb-5 rounded-xl border border-[#fee4e2] bg-[#fef3f2] p-4 text-sm font-bold text-[#b42318]">
            {actionError}
          </div>
        )}

        {activeTab === 'words' ? (
          <WordsPanel words={words} />
        ) : (
          <FlashcardPanel
            currentWord={currentWord}
            progressText={progressText}
            revealed={revealed}
            totalWords={words.length}
            isLearning={learningId === currentWord?.id}
            reviewingRating={reviewingRating}
            onFlip={flipCard}
            onRate={rateCurrentWord}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={showLoginPrompt}
        title="Yêu cầu đăng nhập"
        message="Bạn cần đăng nhập tài khoản để lưu tiến độ học và kết quả ôn tập flashcard."
        confirmLabel="Đăng nhập"
        cancelLabel="Hủy"
        tone="primary"
        onCancel={() => setShowLoginPrompt(false)}
        onConfirm={() => {
          setShowLoginPrompt(false);
          navigate('/login', { state: { from: location } });
        }}
      />
    </main>
  );
};

const TabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-10 rounded-lg px-4 text-sm font-bold transition ${
      active ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#667085] hover:bg-[#f8fafc] hover:text-[#111827]'
    }`}
  >
    {children}
  </button>
);

const WordsPanel = ({ words }: { words: Vocabulary[] }) => {
  if (!words.length) {
    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-[#d8dced] bg-white p-8 text-center shadow-sm">
        <BookOpenText className="h-10 w-10 text-[#98a2b3]" />
        <p className="mt-3 text-sm font-semibold text-[#667085]">Chưa có từ trong chủ đề này.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      {words.map((word) => (
        <article key={word.id} className="rounded-2xl border border-[#d8dced] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-[#111827]">{word.word}</h2>
                {word.partOfSpeech && (
                  <span className="rounded-lg bg-[#eaf0ff] px-2 py-0.5 text-xs font-black uppercase text-[#004ac6]">
                    {word.partOfSpeech}
                  </span>
                )}
              </div>
              {word.pronunciation && <p className="mt-1 text-sm font-semibold text-[#667085]">{word.pronunciation}</p>}
            </div>
            <AudioButton audioUrl={word.audioUrl} label={`Nghe phát âm ${word.word}`} />
          </div>

          <div className="mt-4 space-y-3">
            <InfoBlock label="Nghĩa tiếng Việt" value={word.meaningVi} strong />
            <InfoBlock label="Nghĩa tiếng Anh" value={word.meaningEn} />

            {(word.exampleSentenceEn || word.exampleSentenceVi) && (
              <div className="rounded-xl border border-[#e4e7ec] bg-[#fbfcff] p-3">
                {word.exampleSentenceEn && (
                  <div>
                    <p className="text-[11px] font-black uppercase text-[#667085]">Ví dụ tiếng Anh</p>
                    <p className="mt-1 text-sm font-medium italic leading-6 text-[#344054]">"{word.exampleSentenceEn}"</p>
                  </div>
                )}
                {word.exampleSentenceVi && (
                  <div className={word.exampleSentenceEn ? 'mt-3' : ''}>
                    <p className="text-[11px] font-black uppercase text-[#667085]">Dịch nghĩa ví dụ</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#004c7a]">{word.exampleSentenceVi}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

const InfoBlock = ({ label, strong, value }: { label: string; strong?: boolean; value: string | null }) => (
  <div>
    <p className="text-[11px] font-black uppercase text-[#667085]">{label}</p>
    <p className={`mt-1 text-sm leading-6 ${strong ? 'font-bold text-[#111827]' : 'font-medium text-[#505f76]'}`}>
      {value || '-'}
    </p>
  </div>
);

const FlashcardPanel = ({
  currentWord,
  isLearning,
  onFlip,
  onRate,
  progressText,
  reviewingRating,
  revealed,
  totalWords,
}: {
  currentWord: Vocabulary | null;
  isLearning: boolean;
  onFlip: () => void;
  onRate: (rating: VocabularyReviewRating) => void;
  progressText: string;
  reviewingRating: VocabularyReviewRating | null;
  revealed: boolean;
  totalWords: number;
}) => {
  if (!currentWord) {
    return (
      <section className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#d8dced] bg-white p-8 text-center shadow-sm">
        <BookOpenText className="h-10 w-10 text-[#98a2b3]" />
        <p className="mt-3 text-sm font-semibold text-[#667085]">Chưa có flashcard trong chủ đề này.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[760px]">
      <div className="mb-3 flex items-center justify-between text-sm font-bold text-[#667085]">
        <span>{progressText}</span>
        <span>{isLearning ? 'Đang lưu tiến độ...' : `${totalWords} từ`}</span>
      </div>

      <CardButton onFlip={onFlip}>
        {!revealed ? (
          <div className="max-w-2xl">
            {currentWord.partOfSpeech && (
              <p className="mx-auto mb-4 inline-flex rounded-lg bg-[#eaf0ff] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#004ac6]">
                {currentWord.partOfSpeech}
              </p>
            )}
            <h2 className="break-words text-4xl font-black leading-tight text-[#111827]">{currentWord.word}</h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              {currentWord.pronunciation && <p className="text-base font-semibold text-[#667085]">{currentWord.pronunciation}</p>}
              <AudioButton audioUrl={currentWord.audioUrl} label={`Nghe phát âm ${currentWord.word}`} />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-black leading-tight text-[#111827]">
              {currentWord.meaningVi || currentWord.meaningEn || 'Chưa có nghĩa.'}
            </h2>
            {currentWord.meaningVi && currentWord.meaningEn && (
              <p className="mt-2 text-base font-semibold text-[#667085]">{currentWord.meaningEn}</p>
            )}
            {(currentWord.exampleSentenceEn || currentWord.exampleSentenceVi) && (
              <div className="mt-5 rounded-2xl border border-[#d8dced] bg-[#fbfcff] p-4 text-left">
                {currentWord.exampleSentenceEn && (
                  <p className="text-base font-medium italic leading-7 text-[#344054]">"{currentWord.exampleSentenceEn}"</p>
                )}
                {currentWord.exampleSentenceVi && (
                  <p className="mt-2 text-sm font-bold leading-6 text-[#004c7a]">{currentWord.exampleSentenceVi}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardButton>

      {revealed && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {(currentWord.reviewOptions.length ? currentWord.reviewOptions : fallbackReviewOptions).map((option) => (
            <button
              key={option.rating}
              type="button"
              onClick={() => onRate(option.rating)}
              disabled={Boolean(reviewingRating)}
              className={`flex h-14 flex-col items-center justify-center rounded-xl border bg-white text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${ratingStyles[option.rating].className}`}
            >
              {reviewingRating === option.rating ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{option.label || ratingStyles[option.rating].label}</span>
                  {option.delayLabel && <span className="text-xs font-black opacity-70">{option.delayLabel}</span>}
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

const CardButton = ({ children, onFlip }: { children: ReactNode; onFlip: () => void }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onFlip}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onFlip();
      }
    }}
    className="flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-[#d8dced] bg-white p-6 text-center shadow-sm transition hover:border-[#b7cdf8]"
  >
    {children}
  </div>
);

const AudioButton = ({ audioUrl, label }: { audioUrl: string | null; label: string }) => (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      playAudio(audioUrl);
    }}
    disabled={!audioUrl}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8dced] bg-white text-[#505f76] transition hover:border-[#004ac6] hover:text-[#004ac6] disabled:cursor-not-allowed disabled:opacity-40"
    aria-label={label}
    title={label}
  >
    <Volume2 className="h-4 w-4" />
  </button>
);
