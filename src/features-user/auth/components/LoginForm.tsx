import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EngHubLogo } from '../../../components/brand/EngHubLogo';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
      navigate(from?.pathname ? `${from.pathname}${from.search || ''}` : '/', { replace: true });
    }
  };

  const inputClassName =
    'h-12 w-full rounded-lg border border-transparent bg-[#f3f3fe] px-4 text-base font-normal outline-none transition-all placeholder:text-gray-400 focus:border-[#004ac6] focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20';

  return (
    <div className="w-full">
      <div className="mx-auto mb-5 w-[92%] text-center lg:text-left">
        <div className="mb-4 flex justify-center lg:hidden">
          <EngHubLogo markClassName="h-8 w-11" textClassName="text-2xl" />
        </div>
        <h2 className="mb-1 text-[28px] font-semibold text-[#191b23]">Chào mừng trở lại</h2>
        <p className="text-sm font-medium text-[#505f76] opacity-80">Nhập thông tin tài khoản để tiếp tục học.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="mx-auto w-[92%]">
          <label className="mb-2 block text-sm font-medium text-[#434655]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={inputClassName}
            placeholder="enghub@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mx-auto w-[92%]">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-[#434655]" htmlFor="password">
              Mật khẩu
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`${inputClassName} pr-12`}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#94a3b8] transition hover:bg-white/70 hover:text-[#004ac6]"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          className="mx-auto mt-2 flex h-12 w-[92%] items-center justify-center gap-2 rounded-lg bg-[#004ac6] px-6 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Đăng nhập'}
        </button>

      </form>

      <div className="mx-auto mt-5 w-[92%] text-center">
        <p className="text-sm font-medium text-[#505f76]">
          Chưa có tài khoản?
          <Link to="/register" className="ml-1 font-bold text-[#004ac6] hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
};
