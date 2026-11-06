import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { StudentLayout } from '../components/layout/StudentLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { RootRedirect } from './RootRedirect';
import { LoginForm } from '../features-user/auth/components/LoginForm';
import { RegisterForm } from '../features-user/auth/components/RegisterForm';
import { LoginVisual } from '../features-user/auth/components/LoginVisual';
import { RegisterVisual } from '../features-user/auth/components/RegisterVisual';
import { VocabularyPage } from '../features-user/vocabulary/components/VocabularyPage';
import { VocabularyDetail } from '../features-user/vocabulary/components/VocabularyDetail';
import { VocabularyReviewPage } from '../features-user/vocabulary/components/VocabularyReviewPage';
import { AdminVocabularyTopicsPage } from '../features-user/vocabulary/components/AdminVocabularyTopicsPage';
import { AdminVocabularyWordsPage } from '../features-user/vocabulary/components/AdminVocabularyWordsPage';
import { ListeningPage } from '../features-user/listening/components/ListeningPage';
import { ListeningPracticePage } from '../features-user/listening/components/ListeningPracticePage';
import { ReadingPage } from '../features-user/reading/components/ReadingPage';
import { ReadingPracticePage } from '../features-user/reading/components/ReadingPracticePage';
import { ProfilePage } from '../features-user/profile/components/ProfilePage';
import { TestCatalogPage } from '../features-user/test-attempt/components/TestCatalogPage';
import { AttemptHistoryPage } from '../features-user/test-attempt/components/AttemptHistoryPage';
import { AttemptRunnerPage } from '../features-user/test-attempt/components/AttemptRunnerPage';
import { AttemptResultPage } from '../features-user/test-attempt/components/AttemptResultPage';
import { TestListPage } from '../features-admin/tests/components/TestListPage';
import { CreateTestPage } from '../features-admin/tests/components/CreateTestPage';
import { AdminListeningPage } from '../features-admin/listening/components/AdminListeningPage';
import { AdminReadingPage } from '../features-admin/reading/components/AdminReadingPage';
import { AdminUsersPage } from '../features-admin/users/components/AdminUsersPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<StudentLayout />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/tests" element={<TestCatalogPage />} />
        <Route path="/tests/:testId" element={<Navigate to="/tests" replace />} />
        <Route path="/exam" element={<Navigate to="/tests" replace />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/vocabulary/topics/:topicId" element={<VocabularyDetail />} />
        <Route path="/vocabulary/:id" element={<Navigate to="/vocabulary" replace />} />
        <Route path="/listening" element={<ListeningPage />} />
        <Route path="/listening/:testId/:partId" element={<ListeningPracticePage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/reading/:lessonId" element={<ReadingPracticePage />} />
      </Route>
      <Route path="/exam/take" element={<Navigate to="/tests" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />

        <Route element={<StudentLayout />}>
          <Route path="/vocabulary/review" element={<VocabularyReviewPage />} />
          <Route path="/attempts" element={<AttemptHistoryPage />} />
        </Route>
        <Route path="/attempts/:attemptId" element={<AttemptRunnerPage />} />
        <Route path="/attempts/:attemptId/result" element={<AttemptResultPage />} />

        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/tests" element={<TestListPage />} />
            <Route path="/admin/tests/create" element={<CreateTestPage />} />
            <Route path="/admin/listening" element={<AdminListeningPage />} />
            <Route path="/admin/reading" element={<AdminReadingPage />} />
            <Route path="/admin/vocabulary" element={<AdminVocabularyTopicsPage />} />
            <Route path="/admin/vocabulary/topics" element={<Navigate to="/admin/vocabulary" replace />} />
            <Route path="/admin/vocabulary/topics/:topicId" element={<AdminVocabularyWordsPage />} />
            <Route path="/admin/roles" element={<Navigate to="/admin/users" replace />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/login"
        element={
          <AuthLayout visualContent={<LoginVisual />}>
            <LoginForm />
          </AuthLayout>
        }
      />

      <Route
        path="/register"
        element={
          <AuthLayout reverse visualContent={<RegisterVisual />}>
            <RegisterForm />
          </AuthLayout>
        }
      />
    </Routes>
  );
};
