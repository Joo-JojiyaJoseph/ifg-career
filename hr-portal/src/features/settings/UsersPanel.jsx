import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EllipsisVerticalIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Avatar } from '@shared/ui/Avatar'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { ErrorState } from '@shared/ui/ErrorState'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { formatDateTime } from '@shared/lib/formatDate'
import { fetchUsers, inviteUser, resendInvite, resetTwoFactor, toggleUser, updateUser } from './api'

const roleOptions = [{ value: 'HR', label: 'HR' }, { value: 'Admin', label: 'Admin' }]

export function UsersPanel() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [inviting, setInviting] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const users = useQuery({ queryKey: ['hr-users', q], queryFn: () => fetchUsers({ q }) })

  const done = (message) => () => {
    toast.push({ tone: 'success', message })
    setConfirm(null)
    queryClient.invalidateQueries({ queryKey: ['hr-users'] })
  }
  const failed = (error) => {
    setConfirm(null)
    toast.push({ tone: 'error', message: error.message })
  }

  const role = useMutation({ mutationFn: ({ id, value }) => updateUser(id, { role: value }), onSuccess: done('Role changed'), onError: failed })
  const active = useMutation({ mutationFn: ({ id, value }) => toggleUser(id, value), onSuccess: (data) => done(data.data.is_active ? 'User can sign in again' : 'User deactivated and signed out')(), onError: failed })
  const twoFactor = useMutation({ mutationFn: (id) => resetTwoFactor(id), onSuccess: done('Two-step verification reset. They set it up again at next sign-in.'), onError: failed })
  const resend = useMutation({ mutationFn: (id) => resendInvite(id), onSuccess: done('Invitation sent again'), onError: failed })

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><SearchInput id="user-search" value={q} onChange={setQ} placeholder="Search name or email" label="Search HR users" /></div>
        <Button icon={UserPlusIcon} onClick={() => setInviting(true)}>Invite HR user</Button>
      </div>
      {users.isLoading ? <Skeleton className="h-48" /> : null}
      {users.isError ? <ErrorState onRetry={() => users.refetch()} /> : null}
      <ul className="divide-y divide-border">
        {(users.data?.data ?? []).map((user) => (
          <li key={user.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{user.name} {user.is_me ? <span className="text-xs text-muted">(you)</span> : null}</p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!user.is_active ? <Badge color="slate">Deactivated</Badge> : null}
              {user.invited ? <Badge color="amber">Invite pending</Badge> : <span className="text-xs text-muted">Last sign-in {formatDateTime(user.last_login_at)}</span>}
              {user.two_factor_enabled ? <Badge color="green">2-step on</Badge> : null}
              <div className="w-28">
                <Select id={`role-${user.id}`} value={user.role ?? 'HR'} onChange={(value) => value !== user.role && role.mutate({ id: user.id, value })} options={roleOptions} />
              </div>
              <Menu as="div" className="relative">
                <MenuButton className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-brand-50" aria-label={`More actions for ${user.name}`}>
                  <EllipsisVerticalIcon className="h-5 w-5 text-navy" />
                </MenuButton>
                <MenuItems anchor="bottom end" className="z-30 w-56 rounded-xl border border-border bg-white p-1 shadow-card-hover">
                  {user.invited ? <MenuItem><button type="button" className="block min-h-11 w-full rounded-lg px-3 text-left text-sm data-[focus]:bg-brand-50" onClick={() => resend.mutate(user.id)}>Resend invitation</button></MenuItem> : null}
                  {user.two_factor_enabled ? <MenuItem><button type="button" className="block min-h-11 w-full rounded-lg px-3 text-left text-sm data-[focus]:bg-brand-50" onClick={() => setConfirm({ kind: '2fa', user })}>Reset two-step verification</button></MenuItem> : null}
                  {!user.is_me ? (
                    <MenuItem>
                      <button type="button" className="block min-h-11 w-full rounded-lg px-3 text-left text-sm data-[focus]:bg-brand-50" onClick={() => (user.is_active ? setConfirm({ kind: 'deactivate', user }) : active.mutate({ id: user.id, value: true }))}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </MenuItem>
                  ) : null}
                </MenuItems>
              </Menu>
            </div>
          </li>
        ))}
      </ul>
      <InviteModal open={inviting} onClose={() => setInviting(false)} />
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        loading={active.isPending || twoFactor.isPending}
        onConfirm={() => (confirm.kind === '2fa' ? twoFactor.mutate(confirm.user.id) : active.mutate({ id: confirm.user.id, value: false }))}
        title={confirm?.kind === '2fa' ? 'Reset two-step verification?' : `Deactivate ${confirm?.user.name}?`}
        message={confirm?.kind === '2fa' ? 'They must set up their authenticator app again at their next sign-in.' : 'They are signed out straight away and cannot sign in until an Admin activates them. Their history stays.'}
        confirmLabel={confirm?.kind === '2fa' ? 'Reset' : 'Deactivate'}
      />
    </Card>
  )
}

function InviteModal({ open, onClose }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [values, setValues] = useState({ name: '', email: '', role: 'HR' })
  const [errors, setErrors] = useState({})
  const invite = useMutation({
    mutationFn: () => inviteUser(values),
    onSuccess: () => {
      toast.push({ tone: 'success', message: `Invitation sent to ${values.email}` })
      setValues({ name: '', email: '', role: 'HR' })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['hr-users'] })
      onClose()
    },
    onError: (error) => setErrors(Object.fromEntries(Object.entries(error.errors ?? { email: [error.message] }).map(([key, value]) => [key, value[0]]))),
  })

  return (
    <Modal open={open} onClose={onClose} title="Invite an HR user">
      <form className="flex flex-col gap-4" noValidate onSubmit={(event) => { event.preventDefault(); invite.mutate() }}>
        <FormField id="invite-name" label="Name" required error={errors.name}><Input id="invite-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></FormField>
        <FormField id="invite-email" label="Work email" required error={errors.email} hint="They get an email to set their own password."><Input id="invite-email" type="email" value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} /></FormField>
        <FormField id="invite-role" label="Role" error={errors.role}><Select id="invite-role" value={values.role} onChange={(role) => setValues((current) => ({ ...current, role }))} options={roleOptions} /></FormField>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={invite.isPending}>Send invitation</Button>
        </div>
      </form>
    </Modal>
  )
}

InviteModal.propTypes = {}
