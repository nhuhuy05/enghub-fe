import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, Clock3, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features-user/auth/hooks/useAuth';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage, testAttemptService } from '../services/testAttemptService';
import type { AttemptMode, PublishedTest, PublishedTestCollection } from '../types';
import { ModeSelectorModal } from './ModeSelectorModal';

const ALL_PARTS = [1, 2, 3, 4, 5, 6, 7];

export const TestCatalogPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collections, setCollections] = useState<PublishedTestCollection[]>([]);
  const [tests, setTests] = useState<PublishedTest[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedTest, setSelectedTest] = useState<PublishedTest | null>(null);
  const [mode, setMode] = useState<AttemptMode>('MOCK');
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const [nextCollections, nextTests] = await Promise.all([
          testAttemptService.getCollections(),
          testAttemptService.getTests(selectedCollectionId ? { collectionId: selectedCollectionId } : undefined),
        ]);
        setCollections(nextCollections);
        setTests(nextTests);
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Không thể tải danh sách đề thi.'));
      } finally {
        setLoading(false);
      }
    };

    void loadCatalog();
  }, [selectedCollectionId]);

  const openModeSelector = (test: PublishedTest) => {
    setSelectedTest(test);
    setMode('MOCK');
    setSelectedParts([]);
    setErrorMsg('');
  };

  const handleModeChange = (nextMode: AttemptMode) => {
    setMode(nextMode);
  };

  const togglePart = (part: number) => {
    setSelectedParts((current) =>
      current.includes(part) ? current.filter((item) => item !== part) : [...current, part].sort((a, b) => a - b)
    );
  };

  const startAttempt = async (startMode: AttemptMode, partNumbers: number[]) => {
    if (!selectedTest || partNumbers.length === 0 || starting) return;

    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      setStarting(true);
      setErrorMsg('');
      const attempt = await testAttemptService.startAttempt({
        testId: selectedTest.id,
        mode: startMode,
        partNumbers,
      });
      navigate(`/attempts/${attempt.id}`, { state: { freshStart: true } });
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể bắt đầu lượt làm bài.'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fc] px-4 py-6 pt-16 text-[#191b23] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111827]">Luyện thi TOEIC với Full Test</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#667085]">
              Chọn đề TOEIC để luyện thi hoặc luyện tập theo từng Part.
            </p>
          </div>
          {isAuthenticated && (
            <Link
              to="/attempts"
              className="inline-flex items-center justify-center rounded-xl border border-[#d8dced] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] shadow-sm transition hover:bg-[#f9fafb]"
            >
              Lịch sử làm bài
            </Link>
          )}
        </section>

        <section className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCollectionId(null)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
              selectedCollectionId === null
                ? 'bg-[#004ac6] text-white'
                : 'border border-[#d8dced] bg-white text-[#505f76] hover:text-[#004ac6]'
            }`}
          >
            Tất cả
          </button>
          {collections.map((collection) => (
            <button
              type="button"
              key={collection.id}
              onClick={() => setSelectedCollectionId(collection.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                selectedCollectionId === collection.id
                  ? 'bg-[#004ac6] text-white'
                  : 'border border-[#d8dced] bg-white text-[#505f76] hover:text-[#004ac6]'
              }`}
            >
              {collection.name}
            </button>
          ))}
        </section>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-[#fee4e2] bg-[#fef3f2] p-4 text-sm font-bold text-[#b42318]">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#004ac6]" />
            <p className="mt-3 text-sm font-bold text-[#667085]">Đang tải đề thi...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8dced] bg-white p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-[#98a2b3]" />
            <h2 className="mt-3 text-base font-bold text-[#111827]">Chưa có đề thi đã xuất bản</h2>
            <p className="mt-1 text-sm text-[#667085]">Hãy thử bộ đề khác hoặc xuất bản đề từ công cụ giáo viên.</p>
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <button
                type="button"
                key={test.id}
                onClick={() => openModeSelector(test)}
                className="flex min-h-[240px] flex-col rounded-2xl border border-[#d8dced] bg-white p-5 text-left shadow-sm transition hover:border-[#004ac6] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#004ac6]">
                    {test.collectionName || 'Đề thi đã xuất bản'}
                    </p>
                    <h2 className="mt-2 text-xl font-bold leading-tight text-[#111827]">{test.title}</h2>
                  </div>
                  {test.testNumber && (
                    <span className="rounded-lg bg-[#eaf0ff] px-2.5 py-1 text-xs font-bold text-[#004ac6]">
                      #{test.testNumber}
                    </span>
                  )}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667085]">
                  {test.description || 'Chưa có mô tả.'}
                </p>
                <div className="mt-auto flex items-center gap-4 pt-5 text-xs font-bold text-[#667085]">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-[#004ac6]" />
                    {test.totalQuestions} câu hỏi
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-[#b25e00]" />
                    {test.durationMinutes} phút
                  </span>
                </div>
                <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#004ac6] px-4 py-3 text-sm font-bold text-white shadow-sm transition group-hover:bg-[#003da3]">
                  Bắt đầu làm bài
                </span>
              </button>
            ))}
          </section>
        )}
      </div>
      {selectedTest && (
        <ModeSelectorModal
          canStart={selectedParts.length > 0 && !starting}
          errorMsg={errorMsg}
          mode={mode}
          onClose={() => {
            setSelectedTest(null);
            setErrorMsg('');
          }}
          onModeChange={handleModeChange}
          onSelectAll={() =>
            setSelectedParts((current) => (current.length === ALL_PARTS.length ? [] : ALL_PARTS))
          }
          onStart={(startMode, parts) => void startAttempt(startMode, parts)}
          onTogglePart={togglePart}
          selectedParts={selectedParts}
          starting={starting}
          testTitle={selectedTest.title}
        />
      )}

      <ConfirmDialog
        isOpen={showLoginPrompt}
        title="Yêu cầu đăng nhập"
        message="Bạn cần đăng nhập tài khoản để bắt đầu làm bài thi và lưu lại kết quả."
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
