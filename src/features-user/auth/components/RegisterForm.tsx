import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EngHubLogo } from '../../../components/brand/EngHubLogo';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error } = useAuth();

  const inputClassName =
    'h-12 w-full rounded-lg border border-transparent bg-[#f3f3fe] px-4 text-base font-normal outline-none transition-all placeholder:text-gray-400 focus:border-[#004ac6] focus:bg-white focus:ring-2 focus:ring-[#004ac6]/20';
  const primaryButtonClassName =
    'mx-auto flex h-12 w-[92%] items-center justify-center gap-2 rounded-lg bg-[#004ac6] px-6 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setValidationError('');
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      fullName: '',
    });

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto mb-5 w-[92%] text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <EngHubLogo markClassName="h-8 w-11" textClassName="text-[26px]" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="mx-auto w-[92%]">
          <label className="mb-2 block text-sm font-medium text-[#505f76]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={inputClassName}
            placeholder="enghub@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="mx-auto w-[92%]">
          <label className="mb-2 block text-sm font-medium text-[#505f76]" htmlFor="password">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`${inputClassName} pr-12`}
              placeholder="Tạo mật khẩu"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

        <div className="mx-auto w-[92%]">
          <label className="mb-2 block text-sm font-medium text-[#505f76]" htmlFor="confirm">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`${inputClassName} pr-12`}
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#94a3b8] transition hover:bg-white/70 hover:text-[#004ac6]"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}
              title={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-[92%] items-center gap-2 py-1">
          <input
            type="checkbox"
            id="terms"
            required
            className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#c3c6d7] text-[#004ac6] focus:ring-[#004ac6]"
          />
          <label className="text-xs font-medium leading-5 text-[#505f76]" htmlFor="terms">
            Tôi đồng ý với <a href="#" className="font-bold text-[#004ac6] hover:underline">Điều khoản</a> và{' '}
            <a href="#" className="font-bold text-[#004ac6] hover:underline">Chính sách bảo mật</a>.
          </label>
        </div>

        {(validationError || error) && (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {validationError || error}
          </div>
        )}

        <button type="submit" className={primaryButtonClassName} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Tạo tài khoản'}
        </button>

      </form>

      <div className="mx-auto mt-6 w-[92%] text-center">
        <p className="text-sm font-medium text-[#505f76]">
          Đã có tài khoản?
          <Link to="/login" className="ml-1 font-bold text-[#004ac6] hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};
