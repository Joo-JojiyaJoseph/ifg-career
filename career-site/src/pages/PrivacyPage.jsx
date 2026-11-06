import { useEffect } from 'react'

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy policy · Infolks Group Careers'
  }, [])

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl text-navy">Privacy policy</h1>
      <p className="mt-4 text-text">
        Infolks Group collects the details you submit on this careers site so the hiring teams at Infolks, Webfolks, Dataways and Medrays can review your application.
        That includes your name, contact details, resume and the answers on an application form.
      </p>
      <p className="mt-3 text-text">
        Application records are kept so a later change to your profile does not rewrite what you sent. You can turn talent community emails off from notification settings after you sign in.
      </p>
    </article>
  )
}
