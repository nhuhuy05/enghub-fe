import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronRight, Headphones, Loader2 } from 'lucide-react';
import { useListeningSession } from '../hooks/useListeningSession';
import { getHiddenWordIndexes, getIndexedTokens, normalizeWords, splitSentence } from '../utils/listeningText';
import {
  AnswerTokens,
  AudioToolbar,
  DictationInlineSentence,
  HintTabs,
  ShortcutHint,
} from './practice';

export const ListeningPracticePage = () => {
  const { testId = '', partId = '' } = useParams<{
    testId: string;
    partId: string;
  }>();
  const navigate = useNavigate();
  const {
    session,
    isLoading,
    error,
    activeGroupId,
    activeSentenceId,
    activeSentence,
    currentSentenceNumber,
    totalSentencesInGroup,
    hintLevel,
    setHintLevel,
    dictationWordAnswers,
    dictationFullAnswers,
    selectSentence,
    goPrev,
    goNext,
    setDictationWordAnswer,
    setDictationFullAnswer,
  } = useListeningSession(testId, partId);
  const [revealedWordIndexesBySentence, setRevealedWordIndexesBySentence] = useState<Record<string, number[]>>({});

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="h-10 w-10 animate-spin text-[#004ac6]" />
        <p className="font-bold text-[#505f76]">Đang chuẩn bị bài nghe...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold text-red-500">{error || 'Không tìm thấy bài nghe'}</h2>
        <button onClick={() => navigate('/listening')} className="rounded-xl bg-[#004ac6] px-6 py-2 font-bold text-white">
          Quay lại
        </button>
      </div>
    );
  }

  if (!activeSentence) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold text-[#191b23]">Chưa có dữ liệu nghe chép</h2>
        <p className="max-w-md text-sm font-semibold text-[#64748b]">
          Test hoặc Part này chưa có audio/transcript hợp lệ để luyện nghe.
        </p>
        <button onClick={() => navigate('/listening')} className="rounded-xl bg-[#004ac6] px-6 py-2 font-bold text-white">
          Quay lại
        </button>
      </div>
    );
  }

  const indexedTokens = getIndexedTokens(activeSentence.text);
  const wordDisplayByIndex = indexedTokens.reduce<Record<number, string>>((acc, item) => {
    if (item.wordIndex !== null) acc[item.wordIndex] = item.token;
    return acc;
  }, {});
  const sentenceWords = indexedTokens
    .filter((item) => item.wordIndex !== null && item.normalized)
    .map((item) => item.normalized as string);
  const wordIndexesToHide = getHiddenWordIndexes(sentenceWords, hintLevel);
  const dictationAnswers = dictationWordAnswers[activeSentence.id] || {};
  const dictationFullAnswer = dictationFullAnswers[activeSentence.id] || '';
  const revealedWordIndexes = new Set(revealedWordIndexesBySentence[activeSentence.id] || []);
  const dictationTargetIndexes = hintLevel === 100
    ? sentenceWords.map((_, index) => index)
    : Array.from(wordIndexesToHide).sort((a, b) => a - b);
  const fullAnswerWords = normalizeWords(dictationFullAnswer);
  const correctWordIndexes = new Set<number>();
  dictationTargetIndexes.forEach((wordIndex, targetIndex) => {
    const answer = hintLevel === 100
      ? fullAnswerWords[targetIndex] || ''
      : normalizeWords(dictationAnswers[wordIndex] || '')[0] || '';
    if (answer === (sentenceWords[wordIndex] || '')) correctWordIndexes.add(wordIndex);
  });
  const dictationCorrectWords = correctWordIndexes.size;
  const dictationAccuracy = dictationTargetIndexes.length
    ? Math.round((dictationCorrectWords / dictationTargetIndexes.length) * 100)
    : 0;
  const revealWord = (wordIndex: number) => {
    setRevealedWordIndexesBySentence((prev) => {
      const current = new Set(prev[activeSentence.id] || []);
      current.add(wordIndex);
      return {
        ...prev,
        [activeSentence.id]: Array.from(current).sort((a, b) => a - b),
      };
    });
  };
  const revealNextWord = () => {
    const nextWordIndex = dictationTargetIndexes.find((wordIndex) => (
      !correctWordIndexes.has(wordIndex) && !revealedWordIndexes.has(wordIndex)
    ));
    if (nextWordIndex !== undefined) revealWord(nextWordIndex);
  };
  const isAnswerVisible = dictationTargetIndexes.length > 0
    && dictationTargetIndexes.every((wordIndex) => correctWordIndexes.has(wordIndex) || revealedWordIndexes.has(wordIndex));
  const dictationResultWords = dictationTargetIndexes.map((wordIndex) => ({
    wordIndex,
    word: wordDisplayByIndex[wordIndex] || sentenceWords[wordIndex] || '',
    isVisible: correctWordIndexes.has(wordIndex) || revealedWordIndexes.has(wordIndex),
  }));
  const answerTokens = splitSentence(activeSentence.text);
  const totalSessionSentences = session.groups.reduce((total, group) => total + group.sentences.length, 0);

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden bg-[#f6f7fc] text-[#191b23]">
      <header className="flex h-12 shrink-0 items-center justify-center border-b border-[#d8dced] bg-white/90">
        <div className="rounded-lg bg-[#004ac6] px-4 py-1.5 text-xs font-bold text-white shadow-sm">Nghe Chép</div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1120px] flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[#d8dced] bg-white px-3.5 py-3.5">
          <div className="mb-3">
            <h1 className="truncate text-base font-black text-[#111827]">{session.title}</h1>
            <p className="mt-1 text-sm font-medium text-[#667085]">{session.groups.length} bài • {totalSessionSentences} câu</p>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain border-t border-[#e4e7ec] pt-3 pr-1">
            {session.groups.map((group) => {
              const isOpen = group.id === activeGroupId;
              return (
                <div key={group.id}>
                  <button
                    onClick={() => selectSentence(group.id, group.sentences[0].id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                      isOpen ? 'bg-[#004ac6] text-white' : 'text-[#111827] hover:bg-[#eaf0ff]'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-black">
                      <ChevronRight className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-90' : ''}`} />
                      <Headphones className="h-4 w-4" />
                      {group.title}
                    </span>
                    <span className="text-xs font-bold">{group.sentences.length} câu</span>
                  </button>

                  {isOpen && (
                    <div className="ml-4 border-l-2 border-[#d8dced] py-1 pl-2">
                      {group.sentences.map((sentence, index) => {
                        const isActive = sentence.id === activeSentenceId;
                        return (
                          <button
                            key={sentence.id}
                            onClick={() => selectSentence(group.id, sentence.id)}
                            className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition ${
                              isActive ? 'bg-[#eaf0ff] text-[#004ac6]' : 'text-[#667085] hover:bg-[#f2f4f7]'
                            }`}
                          >
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                              isActive ? 'bg-[#004ac6] text-white' : 'bg-white text-[#667085]'
                            }`}>
                              {index + 1}
                            </span>
                            {session.partId === 'part-1' || session.partId === 'part-2' ? `Câu nói ${index + 1}` : `Câu ${index + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="h-full min-h-0 overflow-y-auto overscroll-contain px-3 py-3 lg:px-4">
          <section className="max-w-[820px] rounded-2xl border border-[#d8dced] bg-white p-3.5 shadow-sm">
            <AudioToolbar
              current={currentSentenceNumber}
              total={totalSentencesInGroup}
              audioUrl={activeSentence.audioUrl}
              startMs={activeSentence.startMs}
              endMs={activeSentence.endMs}
              onPrev={goPrev}
              onNext={goNext}
            />

            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-bold text-[#667085]">Ẩn từ:</span>
              <HintTabs value={hintLevel} onChange={setHintLevel} compact />
            </div>
            <DictationInlineSentence
              tokens={indexedTokens}
              hiddenWordIndexes={wordIndexesToHide}
              answers={dictationAnswers}
              fullAnswer={dictationFullAnswer}
              isFullHidden={hintLevel === 100}
              correctWordIndexes={correctWordIndexes}
              revealedWordIndexes={revealedWordIndexes}
              canGoNextOnEnter={isAnswerVisible}
              onChange={(wordIndex, value) => setDictationWordAnswer(activeSentence.id, wordIndex, value)}
              onFullChange={(value) => setDictationFullAnswer(activeSentence.id, value)}
              onRevealNext={revealNextWord}
              onNext={goNext}
            />
            <div className="mt-3 flex justify-between text-sm font-semibold text-[#667085]">
              <span>{dictationCorrectWords} / {dictationTargetIndexes.length} từ đúng</span>
              <span>{dictationAccuracy}%</span>
            </div>
            <div className="mt-3 rounded-xl bg-[#f6f7fc] p-3">
              {dictationResultWords.map(({ wordIndex, word, isVisible }) => (
                <button
                  key={`${word}-${wordIndex}`}
                  type="button"
                  onClick={() => revealWord(wordIndex)}
                  className={`mr-1.5 mb-1 inline-flex rounded-md px-2.5 py-1.5 text-sm font-bold transition ${
                    isVisible
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-[#eef2f7] tracking-widest text-[#667085] hover:bg-[#e4e7ec]'
                  }`}
                  aria-label={`Hint word ${wordIndex + 1}`}
                >
                  {isVisible ? word : '\u2022'.repeat(Math.max(1, word.length))}
                </button>
              ))}
            </div>
            {isAnswerVisible && (
              <>
                <p className="mt-3 text-sm font-bold text-[#027a48]">
                  {dictationAccuracy === 100 ? 'Độ chính xác: 100%' : 'Đã hiện đáp án'}
                </p>
                <AnswerTokens tokens={answerTokens} translation={activeSentence.translation} />
              </>
            )}
            <ShortcutHint text="Ctrl phát lại • Tab gợi ý từ • Enter kiểm tra" />
          </section>
        </main>
      </div>
    </div>
  );
};
