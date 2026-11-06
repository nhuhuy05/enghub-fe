import { AlertTriangle, Loader2, LogIn } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: 'danger' | 'warning' | 'primary';
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  loading = false,
  tone = 'danger',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const confirmClassName =
    tone === 'danger'
      ? 'bg-[#d92d20] hover:bg-[#b42318]'
      : tone === 'warning'
      ? 'bg-[#ff8a1f] hover:bg-[#ea760b]'
      : 'bg-[#004ac6] hover:bg-[#003da3]';
  const iconClassName =
    tone === 'danger'
      ? 'bg-red-50 text-[#d92d20]'
      : tone === 'warning'
      ? 'bg-[#fff4e5] text-[#ff8a1f]'
      : 'bg-[#eaf0ff] text-[#004ac6]';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111827]/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8dced] bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
            {tone === 'primary' ? <LogIn className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111827]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#505f76]">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-lg border border-[#d8dced] bg-white px-4 text-sm font-bold text-[#344054] transition hover:bg-[#f3f5fb] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition disabled:opacity-50 ${confirmClassName}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
