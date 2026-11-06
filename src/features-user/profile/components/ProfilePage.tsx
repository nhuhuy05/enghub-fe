import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  Camera,
  CheckCircle2,
  LockKeyhole,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  Target,
  TimerReset,
  UserRound,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features-user/auth/hooks/useAuth';
import { useAuthStore } from '@/features-user/auth/store/useAuthStore';
import { useProfile } from '../hooks/useProfile';

type ProfileTab = 'progress' | 'personal';

const profileMenu: Array<{ id: ProfileTab; label: string; icon: typeof UserRound }> = [
  { id: 'progress', label: 'Tiến độ học tập', icon: BarChart3 },
  { id: 'personal', label: 'Thông tin cá nhân', icon: UserRound },
];

const progressStats = [
  { label: 'Bài đã học', value: '42', icon: CheckCircle2 },
  { label: 'Mục tiêu TOEIC', value: '850', icon: Target },
  { label: 'Giờ luyện tập', value: '18h', icon: TimerReset },
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAuthenticated, isSessionChecked } = useAuthStore();
  const {
    profile,
    isLoading,
    isSaving,
    error,
    successMessage,
    saveProfile,
    clearSuccessMessage,
  } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');

  const [prevProfile, setPrevProfile] = useState<typeof profile>(null);

  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }

  const initials = useMemo(() => {
    const source = profile?.fullName || profile?.email || 'User';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profile]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await saveProfile({ fullName, phone, avatarUrl, password });
    if (result.success) {
      setPassword('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isSessionChecked && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fc] px-4 pt-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#d9ddec] bg-white p-8 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-[#004ac6]" />
          <p className="font-bold text-[#505f76]">Đang tải thông tin người dùng...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fc] px-4 py-8 text-[#191b23] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold text-[#111827] sm:text-4xl">Thông tin người dùng</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
              Quản lý hồ sơ cá nhân, tiến độ học tập và bảo mật tài khoản.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
            Tài khoản đang hoạt động
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside>
            <div className="rounded-2xl border border-[#d9ddec] bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Ảnh đại diện"
                      className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg ring-1 ring-[#d9ddec]"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#004ac6] text-3xl font-black text-white shadow-lg">
                      {initials}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#18bd84] text-white shadow-sm">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>

                <h2 className="mt-5 max-w-full truncate text-xl font-extrabold text-[#111827]">
                  {profile.fullName || 'Người dùng EngHub'}
                </h2>
                <p className="mt-1 max-w-full truncate text-sm text-[#667085]">{profile.email}</p>
              </div>

              <nav className="mt-6 space-y-2 border-t border-[#edf0f7] pt-5" aria-label="Profile menu">
                {profileMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        clearSuccessMessage();
                        setActiveTab(item.id);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                        isActive
                          ? 'bg-blue-50 text-[#004ac6]'
                          : 'text-[#505f76] hover:bg-[#f4f7ff] hover:text-[#004ac6]'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-[#004ac6]" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-5 border-t border-[#edf0f7] pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.99]"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>

          {activeTab === 'progress' && (
            <section className="rounded-2xl border border-[#d9ddec] bg-white p-6 shadow-sm">
              <div className="mb-6 border-b border-[#edf0f7] pb-5">
                <h2 className="text-xl font-extrabold text-[#111827]">Tiến độ học tập</h2>
                <p className="mt-1 text-sm text-[#667085]">Theo dõi quá trình luyện tập và mục tiêu hiện tại.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {progressStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-[#edf0f7] bg-[#f8fafc] p-5">
                      <Icon className="h-5 w-5 text-[#004ac6]" />
                      <p className="mt-5 text-3xl font-extrabold text-[#111827]">{item.value}</p>
                      <p className="mt-1 text-sm font-semibold text-[#667085]">{item.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-[#edf0f7] p-5">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-[#111827]">Mục tiêu tuần</span>
                  <span className="text-[#004ac6]">75%</span>
                </div>
                <div className="mt-4 h-3 rounded-full bg-[#edf0f7]">
                  <div className="h-full w-3/4 rounded-full bg-[#004ac6]" />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'personal' && (
            <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-[#d9ddec] bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 border-b border-[#edf0f7] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827]">Thông tin cá nhân</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Cập nhật hồ sơ cá nhân và nhập mật khẩu mới nếu muốn thay đổi.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving || !fullName.trim() || (password.length > 0 && password.trim().length < 8)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#004ac6] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(0,74,198,0.24)] transition hover:bg-[#003896] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu thay đổi
                </button>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {successMessage && (
                <button
                  type="button"
                  onClick={clearSuccessMessage}
                  className="mb-5 flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm font-semibold text-emerald-700"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  {successMessage}
                </button>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#344054]">Họ và tên</span>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d0d5dd] bg-white px-4 transition focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-blue-100">
                    <UserRound className="h-4 w-4 text-[#667085]" />
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none"
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#344054]">Email</span>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] px-4">
                    <Mail className="h-4 w-4 text-[#667085]" />
                    <input
                      value={profile.email}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#667085] outline-none"
                      disabled
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#344054]">Số điện thoại</span>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d0d5dd] bg-white px-4 transition focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-blue-100">
                    <Phone className="h-4 w-4 text-[#667085]" />
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-[#344054]">Mật khẩu mới</span>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d0d5dd] bg-white px-4 transition focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-blue-100">
                    <LockKeyhole className="h-4 w-4 text-[#667085]" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      minLength={8}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </div>
                </label>

           
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
};
