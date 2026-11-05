import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-gradient-to-b from-brand-700 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="font-display text-2xl">Infolks Group</p>
        <div>
          <h1 className="font-display text-4xl">Grow your career with Infolks Group</h1>
          <p className="mt-3 max-w-md text-white/80">The private desk for the people who hire across Infolks, Webfolks, Dataways and Medrays.</p>
        </div>
        <p className="text-sm text-white/70">Building Great Teams Together</p>
      </section>
      <section className="flex items-center justify-center bg-brand-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
          <Outlet />
        </div>
      </section>
    </div>
  )
}
