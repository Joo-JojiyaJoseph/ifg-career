import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Skeleton } from '@shared/ui/Skeleton'
import { AuthLayout } from './layouts/AuthLayout'
import { PortalLayout } from './layouts/PortalLayout'
import { RequireAuth } from './features/auth/RequireAuth'

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const JobListPage = lazy(() => import('./features/jobs/JobListPage').then((module) => ({ default: module.JobListPage })))
const JobFormPage = lazy(() => import('./features/jobs/JobFormPage').then((module) => ({ default: module.JobFormPage })))
const CandidateListPage = lazy(() => import('./features/candidates/CandidateListPage').then((module) => ({ default: module.CandidateListPage })))
const CandidatePage = lazy(() => import('./features/candidates/CandidatePage').then((module) => ({ default: module.CandidatePage })))
const InterviewsPage = lazy(() => import('./features/interviews/InterviewsPage').then((module) => ({ default: module.InterviewsPage })))
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then((module) => ({ default: module.NotificationsPage })))
const NotificationPreferencesPage = lazy(() => import('./features/notifications/NotificationPreferencesPage').then((module) => ({ default: module.NotificationPreferencesPage })))
const TalentPage = lazy(() => import('./features/talent/TalentPage').then((module) => ({ default: module.TalentPage })))
const CampaignComposerPage = lazy(() => import('./features/talent/CampaignComposerPage').then((module) => ({ default: module.CampaignComposerPage })))
const ContentPage = lazy(() => import('./features/content/ContentPage').then((module) => ({ default: module.ContentPage })))
const ReportsPage = lazy(() => import('./features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const AuditLogPage = lazy(() => import('./features/audit/AuditLogPage').then((module) => ({ default: module.AuditLogPage })))
const ApplicationListPage = lazy(() => import('./features/applications/ApplicationListPage').then((module) => ({ default: module.ApplicationListPage })))

export function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-40" />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<PortalLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/new" element={<JobFormPage />} />
            <Route path="/jobs/:publicId/edit" element={<JobFormPage />} />
            <Route path="/candidates" element={<CandidateListPage />} />
            <Route path="/candidates/:publicId" element={<CandidatePage />} />
            <Route path="/applications" element={<ApplicationListPage />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/account/notifications" element={<NotificationPreferencesPage />} />
            <Route path="/talent" element={<TalentPage />} />
            <Route path="/talent/new" element={<CampaignComposerPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
