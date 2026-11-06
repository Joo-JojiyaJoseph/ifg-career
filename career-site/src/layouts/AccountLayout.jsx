import { NavLink, Outlet } from 'react-router-dom'

const itemClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center rounded-full px-4 text-sm ${isActive ? 'bg-brand-700 text-white' : 'bg-white text-brand-700'}`

export function AccountLayout() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Account">
        <NavLink className={itemClass} to="/profile">Profile</NavLink>
        <NavLink className={itemClass} to="/my-applications">My Applications</NavLink>
        <NavLink className={itemClass} to="/settings/notifications">Notifications</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
