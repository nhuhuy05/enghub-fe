import { CheckCircle2, Clock3, FileText, Loader2, PlayCircle, Target, X } from 'lucide-react';
import type { AttemptMode } from '../types';

const ALL_PARTS = [1, 2, 3, 4, 5, 6, 7];
const PARTS = [
  { part: 1, questions: 6, section: 'LISTENING' },
  { part: 2, questions: 25, section: 'LISTENING' },
  { part: 3, questions: 39, section: 'LISTENING' },
  { part: 4, questions: 30, section: 'LISTENING' },
  { part: 5, questions: 30, section: 'READING' },
  { part: 6, questions: 16, section: 'READING' },
  { part: 7, questions: 54, section: 'READING' },
] as const;

const formatParts = (parts: number[]) => (parts.length ? parts.join(', ') : '1-7');
const getQuestionCount = (parts: number[]) =>
  PARTS.filter((item) => parts.includes(item.part)).reduce((total, item) => total + item.questions, 0);

export const ModeSelectorModal = ({
  canStart,
  isAuthenticated,
  mode,
  onClose,
  onModeChange,
  onSelectAll,
  onStart,
  onTogglePart,
  selectedParts,
  starting,
  testTitle,
}: {
  canStart: boolean;
  isAuthenticated: boolean;
  mode: AttemptMode;
  onClose: () => void;
  onModeChange: (mode: AttemptMode) => void;
  onSelectAll: () => void;
  onStart: (mode: AttemptMode, parts: number[]) => void;
  onTogglePart: (part: number) => void;
  selectedParts: number[];
  starting: boolean;
  testTitle: string;
}) => {
  const selectedQuestionCount = getQuestionCount(selectedParts);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#111827]/70 px-3 py-4">
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#667085] transition hover:bg-[#f2f4f7] hover:text-[#111827]"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pr-8">
          <h2 className="text-xl font-bold text-[#111827]">Chọn chế độ</h2>
          <p className="text-sm font-semibold text-[#667085]">{testTitle}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f4f7fb] p-1">
          <ModeTab active={mode === 'MOCK'} icon={<FileText className="h-4 w-4" />} label="Luyện thi" onClick={() => onModeChange('MOCK')} />
          <ModeTab active={mode === 'PRACTICE'} icon={<Target className="h-4 w-4" />} label="Luyện tập" onClick={() => onModeChange('PRACTICE')} />
        </div>

        <div className="mt-4 max-h-[calc(100vh-170px)] space-y-4 overflow-y-auto pr-1">
          {mode === 'PRACTICE' ? (
            <>
              <div className="rounded-xl border border-[#b7cdf8] bg-[#eaf0ff] p-3 text-sm font-medium text-[#004ac6]">
                <strong>Chế độ Luyện tập:</strong> Xem đáp án và giải thích ngay sau mỗi câu/nhóm câu hỏi.
              </div>
              <PartSelectionCard
                buttonDisabled={!canStart}
                buttonLabel={isAuthenticated ? 'Bắt đầu' : 'Đăng nhập'}
                description={null}
                icon={<CheckCircle2 className="h-5 w-5" />}
                mode="PRACTICE"
                onSelectAll={onSelectAll}
                onStart={() => onStart('PRACTICE', selectedParts)}
                onTogglePart={onTogglePart}
                selectedParts={selectedParts}
                selectedQuestionCount={selectedQuestionCount}
                starting={starting}
                title="Chọn Part để luyện tập"
              />
            </>
          ) : (
            <>
              <div className="rounded-xl border border-[#d5e9f8] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf0ff] text-[#004ac6]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#111827]">Full Test (200 câu)</h3>
                      <p className="mt-3 text-sm text-[#667085]">Làm đầy đủ đề thi như thi thật - 2 tiếng</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge icon={<Clock3 className="h-3.5 w-3.5" />} text="120 phút" />
                        <Badge icon={<FileText className="h-3.5 w-3.5" />} text="200 câu" />
                      </div>
                    </div>
                  </div>
                  <StartButton disabled={starting} label={isAuthenticated ? 'Bắt đầu' : 'Đăng nhập'} onClick={() => onStart('MOCK', ALL_PARTS)} starting={starting} />
                </div>
              </div>

              <PartSelectionCard
                buttonDisabled={!canStart}
                buttonLabel={isAuthenticated ? 'Bắt đầu' : 'Đăng nhập'}
                description="Chọn Part cụ thể để thi thử"
                icon={<Target className="h-5 w-5" />}
                mode="MOCK"
                onSelectAll={onSelectAll}
                onStart={() => onStart('MOCK', selectedParts)}
                onTogglePart={onTogglePart}
                selectedParts={selectedParts}
                selectedQuestionCount={selectedQuestionCount}
                starting={starting}
                title="Thi theo Part"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ModeTab = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-10 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold transition ${
      active ? 'border-2 border-[#004ac6] bg-white text-[#111827]' : 'text-[#667085] hover:bg-white/60'
    }`}
  >
    {icon}
    {label}
  </button>
);

const Badge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf0ff] px-2.5 py-1 text-xs font-bold text-[#004ac6]">
    {icon}
    {text}
  </span>
);

const StartButton = ({
  disabled,
  label,
  onClick,
  starting,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  starting: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#004ac6] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#003da3] disabled:cursor-not-allowed disabled:opacity-45"
  >
    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
    {label}
  </button>
);

const PartSelectionCard = ({
  buttonDisabled,
  buttonLabel,
  description,
  icon,
  mode,
  onSelectAll,
  onStart,
  onTogglePart,
  selectedParts,
  selectedQuestionCount,
  starting,
  title,
}: {
  buttonDisabled: boolean;
  buttonLabel: string;
  description: string | null;
  icon: React.ReactNode;
  mode: AttemptMode;
  onSelectAll: () => void;
  onStart: () => void;
  onTogglePart: (part: number) => void;
  selectedParts: number[];
  selectedQuestionCount: number;
  starting: boolean;
  title: string;
}) => {
  const allSelected = selectedParts.length === ALL_PARTS.length;
  return (
    <div className="rounded-xl border border-[#d5e9f8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf0ff] text-[#004ac6]">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
            {description && <p className="mt-3 text-sm text-[#667085]">{description}</p>}
          </div>
        </div>
        <StartButton disabled={buttonDisabled} label={buttonLabel} onClick={onStart} starting={starting} />
      </div>

      <button
        type="button"
        onClick={onSelectAll}
        className={`mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-base transition ${
          allSelected ? 'border-[#004ac6] bg-[#eaf0ff]' : 'border-[#d8dced] bg-white hover:border-[#004ac6]'
        }`}
      >
        <span className="flex items-center gap-3 font-semibold text-[#111827]">
          <Radio selected={allSelected} />
          Chọn tất cả 7 Part
        </span>
        <span className="text-sm text-[#667085]">200 câu</span>
      </button>

      <PartSection
        parts={PARTS.filter((item) => item.section === 'LISTENING')}
        selectedParts={selectedParts}
        title="LISTENING"
        onTogglePart={onTogglePart}
      />
      <PartSection
        parts={PARTS.filter((item) => item.section === 'READING')}
        selectedParts={selectedParts}
        title="READING"
        onTogglePart={onTogglePart}
      />

      {selectedParts.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-[#b42318]">Chọn ít nhất một Part để bắt đầu.</p>
      ) : (
        <p className="mt-3 text-sm font-semibold text-[#667085]">
          {mode === 'MOCK' ? 'Luyện thi' : 'Luyện tập'} Part {formatParts(selectedParts)} - {selectedQuestionCount} câu
        </p>
      )}
    </div>
  );
};

const PartSection = ({
  onTogglePart,
  parts,
  selectedParts,
  title,
}: {
  onTogglePart: (part: number) => void;
  parts: typeof PARTS[number][];
  selectedParts: number[];
  title: string;
}) => (
  <div className="mb-3">
    <p className="mb-2 text-xs font-bold text-[#667085]">{title}</p>
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {parts.map((item) => {
        const selected = selectedParts.includes(item.part);
        return (
          <button
            key={item.part}
            type="button"
            onClick={() => onTogglePart(item.part)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
              selected ? 'border-[#004ac6] bg-[#eaf0ff]' : 'border-[#d8dced] bg-white hover:border-[#004ac6]'
            }`}
          >
            <span className="flex items-center gap-2.5 text-base font-medium text-[#111827]">
              <Radio selected={selected} />
              Part {item.part}
            </span>
            <span className="text-sm text-[#667085]">{item.questions} câu</span>
          </button>
        );
      })}
    </div>
  </div>
);

const Radio = ({ selected }: { selected: boolean }) => (
  <span
    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
      selected ? 'border-[#004ac6] bg-[#004ac6]' : 'border-[#004ac6] bg-white'
    }`}
  >
    {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
  </span>
);

