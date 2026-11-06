import { BookOpen } from 'lucide-react';
import type { AttemptGroup, AttemptPart, SaveAnswerResult } from '../types';
import { AudioRangePlayer } from './AudioRangePlayer';

const getInstruction = (partNumber: number) => {
  if (partNumber === 1) return 'Select the one statement that best describes what you see in the picture.';
  if (partNumber === 2) return 'Select the best response to the question.';
  if (partNumber <= 4) return 'Select the best response to each question.';
  if (partNumber === 5) return 'Select the best answer to complete the sentence.';
  if (partNumber === 6) return 'Select the best answer to complete the text.';
  return 'Select the best answer to each question.';
};

interface ContextPanelProps {
  group: AttemptGroup;
  onAudioEnded: () => void;
  part: AttemptPart;
  mode: 'MOCK' | 'PRACTICE';
  feedbacks: Record<number, SaveAnswerResult>;
}

export const ContextPanel = ({
  group,
  onAudioEnded,
  part,
  mode,
  feedbacks,
}: ContextPanelProps) => {
  const isListeningPart = [1, 2, 3, 4].includes(part.partNumber);
  const isMockListening = mode === 'MOCK' && isListeningPart;
  const canRevealGroupFeedback =
    mode === 'PRACTICE' && group.questions.length > 0 && group.questions.every((question) => feedbacks[question.id]);
  const feedbackTranscript = group.questions
    .map((question) => feedbacks[question.id])
    .find((feedback) => feedback?.transcriptEn || feedback?.transcriptVi);
  const transcriptEn = group.transcriptEn ?? feedbackTranscript?.transcriptEn ?? null;
  const transcriptVi = group.transcriptVi ?? feedbackTranscript?.transcriptVi ?? null;
  const showTranscript = isListeningPart && canRevealGroupFeedback && (transcriptEn || transcriptVi);

  return (
    <section className="min-h-0 overflow-y-auto border-b border-[#d8dced] bg-white p-4 lg:border-b-0 lg:border-r">
      <p className="mb-3 text-sm font-bold leading-6 text-[#2b6475]">{getInstruction(part.partNumber)}</p>

      {group.audio && (
        <AudioRangePlayer
          audio={group.audio}
          autoPlay={true}
          hiddenControls={isMockListening}
          onEnded={isMockListening ? onAudioEnded : undefined}
        />
      )}

      {group.images.length > 0 && (
        <div className="mt-3 grid gap-3">
          {group.images.map((image) =>
            image.url ? (
              <img
                key={`${image.id}-${image.orderIndex ?? 0}`}
                src={image.url}
                alt={image.label || 'Question image'}
                loading="lazy"
                className="mx-auto max-h-[650px] w-full object-contain"
              />
            ) : null
          )}
        </div>
      )}

      {showTranscript && (
        <div className="mt-4 rounded-sm border border-[#d8dced] bg-[#f8fbff] p-4 text-[#344054]">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#004ac6]">
            <BookOpen className="h-4 w-4" />
            <span>Nội dung audio</span>
          </div>
          {transcriptEn && (
            <div className="whitespace-pre-wrap text-sm leading-6">{transcriptEn}</div>
          )}
          {transcriptVi && (
            <div className={`whitespace-pre-wrap text-sm leading-6 opacity-80 ${transcriptEn ? 'mt-3 border-t border-[#d8dced] pt-3' : ''}`}>
              {transcriptVi}
            </div>
          )}
        </div>
      )}

      {group.passages.length > 0 && (
        <div className="mt-3 space-y-4">
          {group.passages.map((passage, index) => {
            const isReadingTranscriptPart = part.partNumber === 6 || part.partNumber === 7;
            const transcriptText =
              mode === 'MOCK' && isReadingTranscriptPart
                ? (passage.url ? null : passage.contentEn)
                : isReadingTranscriptPart && passage.contentVi
                  ? passage.contentVi
                  : passage.contentEn;

            return (
              <article key={`${passage.id ?? index}-${passage.orderIndex ?? index}`} className="space-y-3">
                {passage.title && <h2 className="text-sm font-bold text-[#2b6475]">{passage.title}</h2>}
                {passage.url && (
                  <img
                    src={passage.url}
                    alt={passage.title || 'Passage'}
                    loading="lazy"
                    className="mx-auto max-h-[520px] w-full object-contain"
                  />
                )}
                {transcriptText && (
                  <div className="whitespace-pre-wrap rounded-sm border border-[#d8dced] bg-white p-4 text-sm leading-7 text-[#111827]">
                    {transcriptText}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
