import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenText, Loader2, Search, Sparkles } from 'lucide-react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useAuthStore } from '@/features-user/auth/store/useAuthStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const VocabularyPage = () => {
  const { topics, dueCount, isLoading, error } = useVocabulary();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return topics;
    return topics.filter((topic) =>
      [topic.name, topic.description ?? ''].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, topics]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-[#f6f7fc]">
        <Loader2 className="h-9 w-9 animate-spin text-[#004ac6]" />
        <p className="font-semibold text-[#667085]">Đang tải chủ đề từ vựng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-[#f6f7fc] px-4 text-center">
        <h2 className="text-xl font-black text-[#d92d20]">Không thể tải từ vựng</h2>
        <p className="text-sm font-medium text-[#667085]">{error}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-[#004ac6] px-5 py-2.5 text-sm font-bold text-white">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7fc] px-4 py-4 text-[#191b23] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <section className="mb-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#cfd7f2] bg-[#eaf0ff] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#004ac6]">
              <BookOpenText className="h-4 w-4" />
              TOEIC Vocabulary
            </div>
            <h1 className="text-[36px] font-black leading-tight text-[#111827]">Học từ vựng theo chủ đề</h1>
            <p className="mt-2 max-w-2xl text-[15px] font-medium leading-7 text-[#667085]">
              Chọn một chủ đề để học từ mới, đánh dấu đã học và ôn lại các từ đến hạn bằng flashcard.
            </p>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setShowLoginPrompt(true);
                return;
              }
              navigate('/vocabulary/review');
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#004ac6] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#003da3]"
          >
            <Sparkles className="h-4 w-4" />
            Ôn tập từ đến hạn
            <span className="rounded-lg bg-white/15 px-2 py-0.5 text-xs">{dueCount} từ</span>
          </button>

          <div className="relative w-full lg:max-w-[360px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm chủ đề..."
              className="h-11 w-full rounded-xl border border-[#d8dced] bg-white pl-10 pr-4 text-sm font-bold text-[#191b23] outline-none transition placeholder:text-[#98a2b3] focus:border-[#004ac6] focus:ring-2 focus:ring-[#eaf0ff]"
            />
          </div>
        </section>

        {filteredTopics.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => navigate(`/vocabulary/topics/${topic.id}`)}
                className="group flex min-h-[230px] flex-col rounded-2xl border border-[#d8dced] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#004ac6] hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f7fb] text-[#004ac6]">
                    <BookOpenText className="h-5 w-5" />
                  </div>
                  <span className="rounded-lg bg-[#eaf0ff] px-2.5 py-1 text-[11px] font-black text-[#004ac6]">
                    {topic.wordCount} từ
                  </span>
                </div>

                <h2 className="text-xl font-black text-[#111827]">{topic.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[#667085]">
                  {topic.description || 'Chưa có mô tả cho chủ đề này.'}
                </p>

                <div className="mt-auto pt-5">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-[#004ac6]">
                    Bắt đầu học
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <section className="flex h-64 flex-col items-center justify-center rounded-2xl border border-[#d8dced] bg-white text-center shadow-sm">
            <Search className="mb-3 h-9 w-9 text-[#98a2b3]" />
            <h2 className="text-lg font-black text-[#111827]">Không tìm thấy chủ đề phù hợp</h2>
            <p className="mt-1 text-sm font-medium text-[#667085]">Thử đổi từ khóa tìm kiếm.</p>
          </section>
        )}
      </div>

      <ConfirmDialog
        isOpen={showLoginPrompt}
        title="Yêu cầu đăng nhập"
        message="Bạn cần đăng nhập tài khoản để sử dụng tính năng ôn tập từ vựng đến hạn."
        confirmLabel="Đăng nhập"
        cancelLabel="Hủy"
        tone="primary"
        onCancel={() => setShowLoginPrompt(false)}
        onConfirm={() => {
          setShowLoginPrompt(false);
          navigate('/login', { state: { from: { pathname: '/vocabulary/review' } } });
        }}
      />
    </main>
  );
};
