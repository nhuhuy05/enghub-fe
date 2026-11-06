import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features-user/auth/hooks/useAuth';
import { getUserRoles } from '@/features-user/auth/utils/roleUtils';
import { HomePage } from '@/features-user/home/components/HomePage';

export const RootRedirect = () => {
  const { isAuthenticated, isSessionChecked, user } = useAuth();

  if (!isSessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fc] text-sm font-semibold text-[#505f76]">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    const roles = getUserRoles(user);
    if (roles.includes('ADMIN')) {
      return <Navigate to="/admin/users" replace />;
    }
  }

  return <HomePage />;
};
