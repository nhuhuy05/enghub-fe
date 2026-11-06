import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/features-user/auth/hooks/useAuth';
import { EngHubLogo } from '@/components/brand/EngHubLogo';

const navItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Từ vựng', href: '/vocabulary' },
  { label: 'Nghe', href: '/listening' },
  { label: 'Đọc', href: '/reading' },
  { label: 'Đề thi', href: '/tests' },
];

export const StudentTopMenu = () => {
  const { user, isAuthenticated } = useAuth();
  const avatarInitial = (user?.fullName || user?.email || 'U').trim().slice(0, 1).toUpperCase();

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-[#d8dced] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0" aria-label="EngHub home">
          <EngHubLogo markClassName="h-8 w-11" textClassName="text-2xl" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `pb-1 text-sm font-medium transition ${
                  isActive
                    ? 'border-b-2 border-[#004ac6] text-[#004ac6]'
                    : 'border-b-2 border-transparent text-[#505f76] hover:border-[#cfd7f2] hover:text-[#004ac6]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-[#434655]">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hidden max-w-[180px] flex-col items-end leading-tight sm:flex">
                <span className="truncate text-sm font-bold text-[#191b23]">
                  {user?.fullName || user?.email || 'User'}
                </span>
                {user?.email && (
                  <span className="truncate text-xs text-[#667085]">{user.email}</span>
                )}
              </Link>
              <Link to="/profile" aria-label="Profile">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-transparent transition hover:ring-[#004ac6]"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf0ff] text-sm font-black text-[#004ac6] ring-1 ring-transparent transition hover:ring-[#004ac6]">
                    {avatarInitial}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-[#004ac6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#003896]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
