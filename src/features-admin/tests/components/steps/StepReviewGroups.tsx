import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Link2, Loader2, X } from 'lucide-react';
import { AudioTranscriptEditor } from '../review-groups/AudioTranscriptEditor';
import { AiGroupSupportControl } from '../review-groups/AiGroupSupportControl';
import { GroupSidebar } from '../review-groups/GroupSidebar';
import { ImagesEditor } from '../review-groups/ImagesEditor';
import { PassagesEditor } from '../review-groups/PassagesEditor';
import { QuestionsEditor } from '../review-groups/QuestionsEditor';
import { getMissingFlagLabel } from '../review-groups/reviewGroupUtils';
import { useReviewGroupsController } from '../../hooks/useReviewGroupsController';

interface StepReviewGroupsProps {
  testId: number;
  nextStep: () => void;
  prevStep: () => void;
}

const isAiMissingContextError = (message: string) =>
  message.includes('AI_MISSING_REQUIRED_CONTEXT') ||
  message.includes('AI generation is missing required context') ||
  message.includes('Thiếu dữ liệu để tạo giải thích');

export const StepReviewGroups = ({ testId, nextStep, prevStep }: StepReviewGroupsProps) => {
  const {
    activePart,
    addImage,
    addImagePassage,
    audioAssets,
    autoLinkMedia,
    autoLinking,
    availableParts,
    blockedReviewCount,
    detail,
    errorMsg,
    filteredGroups,
    generateExplanations,
    generateGroupSupport,
    generateTranscript,
    generateTranslation,
    generatingAiAction,
    goNextStep,
    goPrevStep,
    hasBlockingFlags,
    imageAssets,
    loadingDetail,
    loadingList,
    markAllReviewed,
    patchReviewStatus,
    reviewableGroups,
    saveStatusClass,
    saveStatusText,
    saving,
    selectGroup,
    selectPart,
    selectedGroupId,
    setAnswerValue,
    setCorrectAnswer,
    setDetailValue,
    setQuestionValue,
    setSuccessMsg,
    successMsg,
  } = useReviewGroupsController({ testId, nextStep, prevStep });
  const [dismissedPopupForError, setDismissedPopupForError] = useState('');
  const showAiContextPopup = Boolean(errorMsg && isAiMissingContextError(errorMsg) && dismissedPopupForError !== errorMsg);

  useEffect(() => {
    setDismissedPopupForError('');
  }, [errorMsg]);

  if (loadingList) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#004ac6]" />
        <p className="mt-4 text-sm font-semibold text-[#667085]">Đang tải nhóm câu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMsg && !isAiMissingContextError(errorMsg) && (
        <div className="flex items-center gap-2 rounded-xl border border-[#fee4e2] bg-[#fef3f2] p-4 text-sm font-semibold text-[#b42318]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#d3f5d5] bg-[#edfcf2] p-4 text-sm font-semibold text-[#027a48]">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 shrink-0" />
            {successMsg}
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="rounded p-1 text-[#027a48] transition hover:bg-[#d3f5d5]"
            title="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {showAiContextPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-2xl border border-[#fee4e2] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fef3f2] text-[#d92d20]">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold leading-6 text-[#111827]">Thiếu dữ liệu để tạo giải thích</h3>
                  <p className="mt-1.5 text-[13px] font-semibold leading-5 text-[#475467]">
                    Part 1 cần transcript, image, answer text và đáp án đúng. Part 2 cần transcript, answer text và đáp án đúng. Part 3/4 cần transcript và đáp án đúng, thêm image nếu có graphic. Part 5 cần question text, answers và đáp án đúng. Part 6/7 cần passage text hoặc passage image, answers và đáp án đúng.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedPopupForError(errorMsg)}
                className="rounded-lg p-1 text-[#667085] transition-colors hover:bg-[#f2f4f7] hover:text-[#111827]"
                aria-label="Đóng thông báo"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDismissedPopupForError(errorMsg)}
                className="rounded-lg bg-[#004ac6] px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#003da3]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <GroupSidebar
          availableParts={availableParts}
          activePart={activePart}
          filteredGroups={filteredGroups}
          selectedGroupId={selectedGroupId}
          saving={saving}
          autoLinking={autoLinking}
          reviewableCount={reviewableGroups.length}
          blockedReviewCount={blockedReviewCount}
          onSelectPart={(partNumber) => void selectPart(partNumber)}
          onSelectGroup={(groupId) => void selectGroup(groupId)}
          onMarkAllReviewed={() => void markAllReviewed()}
          onAutoLink={() => void autoLinkMedia()}
        />

        <section className="min-w-0">
          <div className="min-h-[640px] rounded-2xl border border-[#d8dced] bg-white p-5 shadow-sm">
            {loadingDetail ? (
              <div className="py-20 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#004ac6]" />
                <p className="mt-4 text-sm font-semibold text-[#667085]">Đang tải chi tiết nhóm câu...</p>
              </div>
            ) : detail ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f5fb] pb-4">
                  <AiGroupSupportControl
                    generatingAction={generatingAiAction}
                    saving={saving}
                    onGenerate={(input) => void generateGroupSupport(input)}
                  />
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <span className={`text-xs font-bold ${saveStatusClass}`}>{saveStatusText}</span>
                    <button
                      onClick={() => void patchReviewStatus(detail.review_status === 'reviewed' ? 'needs_review' : 'reviewed')}
                      disabled={saving || (detail.review_status !== 'reviewed' && hasBlockingFlags)}
                      className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40 ${
                        detail.review_status === 'reviewed'
                          ? 'border border-[#d8dced] text-[#344054]'
                          : 'bg-[#027a48] text-white'
                      }`}
                      title={
                        detail.review_status !== 'reviewed' && hasBlockingFlags
                          ? 'Bổ sung dữ liệu thiếu trước khi đánh dấu đã review.'
                          : undefined
                      }
                    >
                      {detail.review_status === 'reviewed' ? 'Chuyển về cần review' : 'Đánh dấu đã review'}
                    </button>
                  </div>
                </div>

                {detail.missing_flags && detail.missing_flags.length > 0 && (
                  <div className="rounded-xl border border-[#fecdca] bg-[#fff1f0] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase text-[#b42318]">Thiếu dữ liệu</p>
                      <button
                        type="button"
                        onClick={() => void autoLinkMedia()}
                        disabled={saving || autoLinking}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#fecdca] bg-white px-2.5 py-1 text-xs font-bold text-[#b42318] shadow-sm transition hover:bg-[#fef3f2] disabled:opacity-50"
                        title="Tự động tìm kiếm file audio/hình ảnh đã upload để liên kết vào câu hỏi này"
                      >
                        <Link2 className="h-3.5 w-3.5 text-[#b42318]" />
                        {autoLinking ? 'Đang liên kết...' : 'Tự động liên kết'}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {detail.missing_flags.map((flag) => (
                        <span key={flag} className="rounded bg-white px-2 py-1 text-xs font-bold text-[#b42318]">
                          {getMissingFlagLabel(flag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <ImagesEditor
                  detail={detail}
                  imageAssets={imageAssets}
                  setDetailValue={setDetailValue}
                  addImage={addImage}
                />

                <AudioTranscriptEditor
                  detail={detail}
                  audioAssets={audioAssets}
                  setDetailValue={setDetailValue}
                  generatingAction={generatingAiAction}
                  saving={saving}
                  onGenerateTranscript={() => void generateTranscript()}
                />

                {detail.part_number >= 6 && (
                  <PassagesEditor
                    detail={detail}
                    imageAssets={imageAssets}
                    setDetailValue={setDetailValue}
                    addImagePassage={addImagePassage}
                  />
                )}

                <QuestionsEditor
                  questions={detail.questions}
                  setQuestionValue={setQuestionValue}
                  setAnswerValue={setAnswerValue}
                  setCorrectAnswer={setCorrectAnswer}
                  generatingAction={generatingAiAction}
                  saving={saving}
                  onGenerateTranslation={() => void generateTranslation()}
                  onGenerateExplanations={() => void generateExplanations()}
                />

              </div>
            ) : (
              <div className="py-20 text-center text-sm font-semibold text-[#667085]">Chưa chọn nhóm câu.</div>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-[#f3f5fb] pt-6">
        <button
          onClick={() => void goPrevStep()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d8dced] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition-all hover:bg-[#f9fafb] disabled:opacity-40"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Quay lại
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void autoLinkMedia()}
            disabled={saving || autoLinking}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#004ac6] bg-[#f0f4ff] px-4 py-2.5 text-sm font-semibold text-[#004ac6] transition hover:bg-[#e1ecff] disabled:opacity-50"
            title="Tự động liên kết toàn bộ file audio, hình ảnh đã upload vào các câu hỏi"
          >
            {autoLinking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#004ac6]" />
                Đang liên kết...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 text-[#004ac6]" />
                Tự động liên kết Media
              </>
            )}
          </button>
          <button
            onClick={() => void goNextStep()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#004ac6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#003da3] disabled:opacity-40"
          >
            Tiếp tục
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
