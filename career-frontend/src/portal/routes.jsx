import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Skeleton } from '@shared/ui/Skeleton'
import { AuthLayout } from './layouts/AuthLayout'
import { PortalLayout } from './layouts/PortalLayout'
import { RequireAuth } from './features/auth/RequireAuth'

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage').then((module) => ({ default: module.PlaceholderPage })))
const JobListPage = lazy(() => import('./features/jobs/JobListPage').then((module) => ({ default: module.JobListPage })))
const JobFormPage = lazy(() => import('./features/jobs/JobFormPage').then((module) => ({ default: module.JobFormPage })))
const CandidateListPage = lazy(() => import('./features/candidates/CandidateListPage').then((module) => ({ default: module.CandidateListPage })))
const CandidatePage = lazy(() => import('./features/candidates/CandidatePage').then((module) => ({ default: module.CandidatePage })))
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
            <Route path="/interviews" element={<PlaceholderPage title="Interviews" />} />
            <Route path="/talent" element={<PlaceholderPage title="Talent Community" />} />
            <Route path="/content" element={<PlaceholderPage title="Website Content" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="/audit" element={<PlaceholderPage title="Audit Log" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
