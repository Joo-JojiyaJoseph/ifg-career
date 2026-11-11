import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Skeleton } from '@shared/ui/Skeleton'
import { AccountLayout } from './layouts/AccountLayout'
import { PublicLayout } from './layouts/PublicLayout'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage').then((module) => ({ default: module.MyApplicationsPage })))
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage').then((module) => ({ default: module.ApplicationDetailPage })))
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage').then((module) => ({ default: module.NotificationSettingsPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })))
const ApplicationReceivedPage = lazy(() => import('./pages/ApplicationReceivedPage').then((module) => ({ default: module.ApplicationReceivedPage })))
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage').then((module) => ({ default: module.UnsubscribePage })))
const JobSearchPage = lazy(() => import('./features/jobs/JobSearchPage').then((module) => ({ default: module.JobSearchPage })))
const JobDetailPage = lazy(() => import('./features/jobs/JobDetailPage').then((module) => ({ default: module.JobDetailPage })))
const ApplyPage = lazy(() => import('./features/jobs/ApplyPage').then((module) => ({ default: module.ApplyPage })))

export function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-40" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/jobs/:jobRef/apply/received" element={<ApplicationReceivedPage />} />
          <Route path="/jobs/:jobRef/apply" element={<ApplyPage />} />
          <Route path="/jobs/:jobRef" element={<JobDetailPage />} />
          <Route element={<AccountLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-applications" element={<MyApplicationsPage />} />
            <Route path="/my-applications/:applicationId" element={<ApplicationDetailPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
