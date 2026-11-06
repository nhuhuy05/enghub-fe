import type { QuestionGroupSummary } from '../../types/adminTestTypes';
import {
  BLOCKING_REVIEW_FLAGS,
  formatQuestionRange,
  getMissingFlagLabel,
  getReviewStatusLabel,
} from './reviewGroupUtils';

interface GroupSidebarProps {
  availableParts: number[];
  activePart: number;
  filteredGroups: QuestionGroupSummary[];
  selectedGroupId: number | null;
  saving: boolean;
  autoLinking?: boolean;
  reviewableCount: number;
  blockedReviewCount: number;
  onSelectPart: (partNumber: number) => void;
  onSelectGroup: (groupId: number) => void;
  onMarkAllReviewed: () => void;
  onAutoLink?: () => void;
}

export const GroupSidebar = ({
  availableParts,
  activePart,
  filteredGroups,
  selectedGroupId,
  saving,
  autoLinking,
  reviewableCount,
  blockedReviewCount,
  onSelectPart,
  onSelectGroup,
  onMarkAllReviewed,
  onAutoLink,
}: GroupSidebarProps) => (
  <aside className="min-w-0">
    <div className="rounded-2xl border border-[#d8dced] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {availableParts.map((partNumber) => (
          <button
            key={partNumber}
            onClick={() => onSelectPart(partNumber)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              activePart === partNumber
                ? 'border-[#004ac6] bg-[#eaf0ff] text-[#004ac6]'
                : 'border-[#d8dced] bg-white text-[#505f76]'
            }`}
          >
            Part {partNumber}
          </button>
        ))}
        <button
          onClick={onMarkAllReviewed}
          disabled={saving || !reviewableCount}
          className="rounded-full border border-[#027a48] bg-[#027a48] px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
          title={blockedReviewCount ? `${blockedReviewCount} nhóm còn thiếu dữ liệu và sẽ được bỏ qua.` : undefined}
        >
          Đã review tất cả
        </button>
        {onAutoLink && (
          <button
            type="button"
            onClick={onAutoLink}
            disabled={saving || autoLinking}
            className="rounded-full border border-[#004ac6] bg-[#eaf0ff] px-3 py-1 text-xs font-bold text-[#004ac6] transition hover:bg-[#dbe7ff] disabled:opacity-40"
            title="Tự động liên kết Audio và Hình ảnh đã tải lên với các câu hỏi"
          >
            {autoLinking ? 'Đang liên kết...' : 'Liên kết Media'}
          </button>
        )}
      </div>

      {blockedReviewCount > 0 && (
        <p className="mb-3 text-[10px] font-semibold text-[#b25e00]">
          {blockedReviewCount} nhóm cần bổ sung dữ liệu trước khi review.
        </p>
      )}

      <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
        {filteredGroups.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#d8dced] p-4 text-center text-xs font-semibold text-[#667085]">
            Part này chưa có group.
          </div>
        )}
        {filteredGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              selectedGroupId === group.id
                ? 'border-[#004ac6] bg-[#eaf0ff]'
                : 'border-[#e4e7ec] bg-white hover:bg-[#f9fafb]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#111827]">
                Part {group.part_number} - {formatQuestionRange(group.question_numbers)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  group.review_status === 'reviewed'
                    ? 'bg-[#edfcf2] text-[#027a48]'
                    : 'bg-[#fff4e5] text-[#b25e00]'
                }`}
              >
                {getReviewStatusLabel(group.review_status)}
              </span>
            </div>
            {group.missing_flags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {group.missing_flags.map((flag) => (
                  <span key={flag} className="rounded bg-[#fef3f2] px-1.5 py-0.5 text-[10px] font-bold text-[#b42318]">
                    {getMissingFlagLabel(flag)}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  </aside>
);

export const hasBlockingReviewFlag = (flags: string[]) =>
  flags.some((flag) => BLOCKING_REVIEW_FLAGS.includes(flag));
