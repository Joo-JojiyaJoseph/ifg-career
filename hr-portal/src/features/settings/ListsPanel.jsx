import { useState } from 'react'
import PropTypes from 'prop-types'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BuildingOffice2Icon, EllipsisVerticalIcon, GlobeAltIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { ErrorState } from '@shared/ui/ErrorState'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { fetchEntityContent } from '../content/api'
import { createListItem, deleteListItem, fetchList, updateListItem } from './api'

const GROUP = ''

/**
 * Settings → Departments, teams & skills, organised by company.
 * Pick a company (or "Whole group") and see its departments, each with its teams, and its skills.
 * Everything is added by typing a name and pressing Enter; rarer actions sit in a ⋯ menu.
 */
export function ListsPanel() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const entities = useQuery({ queryKey: ['hr-content', 'entities'], queryFn: fetchEntityContent, staleTime: 300_000 })
  const departments = useQuery({ queryKey: ['hr-list', 'departments', ''], queryFn: () => fetchList('departments') })
  const teams = useQuery({ queryKey: ['hr-list', 'teams', ''], queryFn: () => fetchList('teams') })
  const skills = useQuery({ queryKey: ['hr-list', 'skills', ''], queryFn: () => fetchList('skills') })
  const [company, setCompany] = useState(null)

  const companies = entities.data ?? []
  const current = company ?? companies[0]?.slug ?? GROUP

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['hr-list'] })
    queryClient.invalidateQueries({ queryKey: ['hr-meta'] })
  }
  const fail = (error) => toast.push({ tone: 'error', message: error.errors ? Object.values(error.errors)[0][0] : error.message })
  const create = useMutation({ mutationFn: ({ type, body }) => createListItem(type, body), onSuccess: (_, { body }) => { toast.push({ tone: 'success', message: `${body.name} added` }); refresh() }, onError: fail })
  const update = useMutation({ mutationFn: ({ type, id, body }) => updateListItem(type, id, body), onSuccess: (_, { message }) => { toast.push({ tone: 'success', message: message ?? 'Saved' }); refresh() }, onError: fail })
  const remove = useMutation({ mutationFn: ({ type, id }) => deleteListItem(type, id), onSuccess: (_, { name }) => { toast.push({ tone: 'success', message: `${name} removed` }); refresh() }, onError: fail })
  const actions = { create, update, remove }

  if (departments.isLoading || skills.isLoading || entities.isLoading) return <Skeleton className="h-96" />
  if (departments.isError || skills.isError || teams.isError) return <ErrorState onRetry={() => refresh()} />

  const owns = (department) => (current === GROUP ? !department.entity : department.entity?.slug === current)
  const companyDepartments = (departments.data ?? []).filter(owns)
  const companySkills = (skills.data ?? []).filter((skill) => (current === GROUP ? !skill.entities?.length : skill.entities?.some((entity) => entity.slug === current)))
  const sharedSkills = current === GROUP ? [] : (skills.data ?? []).filter((skill) => !skill.entities?.length)
  const label = current === GROUP ? 'the whole group' : companies.find((entity) => entity.slug === current)?.name

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3" aria-labelledby="step-company">
        <StepTitle id="step-company" step={1} title="Choose a company" text="Departments, teams and skills you add below belong to this company." />
        <CompanyPicker companies={companies} value={current} onChange={setCompany} departments={departments.data ?? []} />
      </section>

      <Card className="flex flex-col gap-4">
        <StepTitle
          step={2}
          title={`Departments and teams in ${current === GROUP ? 'the whole group' : label}`}
          text={current === GROUP ? 'Group-wide departments, such as HR, can be used by every company.' : `Add a department to ${label}, then add its teams. Group-wide departments are available too.`}
        />
        <QuickAdd
          id="new-department"
          label={`New department in ${label}`}
          placeholder={`New department in ${current === GROUP ? 'the whole group' : label}`}
          busy={create.isPending}
          onAdd={(name) => create.mutateAsync({ type: 'departments', body: { name, entity: current || null } })}
        />
        {companyDepartments.length === 0 ? <EmptyState title={`No departments in ${label} yet`} description="Type a name above and press Enter." /> : null}
        <ul className="grid gap-3 lg:grid-cols-2">
          {companyDepartments.map((department) => (
            <DepartmentCard key={department.id} department={department} teams={(teams.data ?? []).filter((team) => team.department_id === department.id)} companies={companies} actions={actions} />
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <StepTitle
          step={3}
          title={`Skills at ${current === GROUP ? 'the whole group' : label}`}
          text={current === GROUP ? 'Skills every company can use. Candidates search jobs by skill.' : `Skills used at ${label}. Candidates search jobs by skill.`}
        />
        <QuickAdd
          id="new-skill"
          label="New skill"
          placeholder={`New skill for ${current === GROUP ? 'every company' : label}`}
          busy={create.isPending || update.isPending}
          onAdd={(name) => {
            // A skill can only exist once; if another company already has it, share it with this one too.
            const existing = (skills.data ?? []).find((skill) => skill.name.toLowerCase() === name.toLowerCase())
            if (existing && current !== GROUP) {
              const slugs = (existing.entities ?? []).map((entity) => entity.slug)
              if (!slugs.length || slugs.includes(current)) return Promise.reject(new Error(`${existing.name} is already available here.`))
              return update.mutateAsync({ type: 'skills', id: existing.id, body: { entities: [...slugs, current] }, message: `${existing.name} added to ${label}` })
            }
            return create.mutateAsync({ type: 'skills', body: { name, entities: current ? [current] : [] } })
          }}
          onError={(error) => toast.push({ tone: 'error', message: error.message })}
        />
        {companySkills.length === 0 ? <p className="text-sm text-muted">No skills of its own yet.</p> : null}
        <ul className="flex flex-wrap gap-2">
          {companySkills.map((skill) => <SkillChip key={skill.id} skill={skill} company={current} actions={actions} />)}
        </ul>
        {sharedSkills.length ? (
          <p className="border-t border-border pt-3 text-sm text-muted">
            <GlobeAltIcon className="mr-1 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
            Also available: {sharedSkills.length} group-wide {sharedSkills.length === 1 ? 'skill' : 'skills'} ({sharedSkills.slice(0, 6).map((skill) => skill.name).join(', ')}{sharedSkills.length > 6 ? '…' : ''}).
          </p>
        ) : null}
      </Card>
    </div>
  )
}

/** A numbered step heading, so the order is clear: company first, then its departments and skills. */
function StepTitle({ id, step, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white" aria-hidden="true">{step}</span>
      <div className="min-w-0">
        <h2 id={id} className="font-display text-lg font-semibold text-ink">
          <span className="sr-only">Step {step}: </span>
          {title}
        </h2>
        <p className="text-sm text-muted">{text}</p>
      </div>
    </div>
  )
}

StepTitle.propTypes = { id: PropTypes.string, step: PropTypes.number.isRequired, title: PropTypes.string.isRequired, text: PropTypes.string }

/** One button per company plus "Whole group", each with how many departments it has. */
function CompanyPicker({ companies, value, onChange, departments }) {
  const count = (slug) => departments.filter((department) => (slug === GROUP ? !department.entity : department.entity?.slug === slug)).length
  const choices = [...companies.map((entity) => ({ slug: entity.slug, name: entity.name, entity })), { slug: GROUP, name: 'Whole group' }]

  return (
    <div role="radiogroup" aria-label="Company" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {choices.map((choice) => {
        const active = choice.slug === value
        return (
          <button
            key={choice.slug || 'group'}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(choice.slug)}
            className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${active ? 'border-brand-500 bg-white shadow-card ring-1 ring-brand-500' : 'border-border bg-white/70 hover:border-brand-200 hover:bg-white'}`}
          >
            {choice.entity ? (
              <EntityLogo entity={choice.entity} size="sm" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600" aria-hidden="true"><BuildingOffice2Icon className="h-5 w-5" /></span>
            )}
            <span className="min-w-0">
              <span className={`block truncate text-sm font-semibold ${active ? 'text-brand-700' : 'text-ink'}`}>{choice.name}</span>
              <span className="block text-xs text-muted">{count(choice.slug)} {count(choice.slug) === 1 ? 'department' : 'departments'}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

CompanyPicker.propTypes = { companies: PropTypes.array.isRequired, value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, departments: PropTypes.array.isRequired }

/** A text box with an Add button; Enter adds too. Clears itself once the item is saved. */
function QuickAdd({ id, label, placeholder, onAdd, onError, busy = false, compact = false }) {
  const [value, setValue] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    const name = value.trim()
    if (!name) return
    try {
      await onAdd(name)
      setValue('')
    } catch (error) {
      onError?.(error)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Input id={id} value={value} maxLength={100} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} className={compact ? '!min-h-10 text-sm' : ''} />
      <Button type="submit" variant={compact ? 'secondary' : 'primary'} size={compact ? 'sm' : 'md'} icon={PlusIcon} loading={busy} disabled={!value.trim()} className="shrink-0">
        Add
      </Button>
    </form>
  )
}

QuickAdd.propTypes = { id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, placeholder: PropTypes.string, onAdd: PropTypes.func.isRequired, onError: PropTypes.func, busy: PropTypes.bool, compact: PropTypes.bool }

/** A department with its teams as chips and a box to add a team. */
function DepartmentCard({ department, teams, companies, actions }) {
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const hidden = !department.is_active

  return (
    <li className={`flex flex-col gap-3 rounded-2xl border p-4 ${hidden ? 'border-dashed border-border bg-slate-50' : 'border-border bg-white'}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className={`font-display font-semibold ${hidden ? 'text-muted' : 'text-ink'}`}>{department.name}</p>
          <p className="text-xs text-muted">
            {teams.length} {teams.length === 1 ? 'team' : 'teams'} · {department.usage} {department.usage === 1 ? 'job' : 'jobs'}
            {hidden ? ' · Hidden from new jobs' : ''}
          </p>
        </div>
        <ItemMenu
          name={department.name}
          items={[
            { label: 'Rename or move', run: () => setEditing(true) },
            { label: hidden ? 'Show again' : 'Hide from new jobs', run: () => actions.update.mutate({ type: 'departments', id: department.id, body: { is_active: hidden }, message: hidden ? `${department.name} is shown again` : `${department.name} is hidden from new jobs` }) },
            department.usage || teams.length
              ? { label: 'Delete', disabled: true, hint: department.usage ? 'Used by jobs: hide it instead' : 'Remove its teams first' }
              : { label: 'Delete', danger: true, run: () => setRemoving(true) },
          ]}
        />
      </div>

      <ul className="flex flex-wrap gap-2" aria-label={`Teams in ${department.name}`}>
        {teams.map((team) => (
          <li key={team.id} className={`inline-flex min-h-9 items-center gap-1 rounded-full border pl-3 text-sm ${team.is_active ? 'border-brand-100 bg-brand-50 text-navy' : 'border-dashed border-border text-muted line-through'}`}>
            {team.name}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={team.usage ? `${team.name} is used by ${team.usage} jobs` : `Remove ${team.name}`}
              title={team.usage ? `Used by ${team.usage} ${team.usage === 1 ? 'job' : 'jobs'}, so it stays` : `Remove ${team.name}`}
              disabled={team.usage > 0}
              onClick={() => actions.remove.mutate({ type: 'teams', id: team.id, name: team.name })}
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {teams.length === 0 ? <li className="text-sm text-muted">No teams yet.</li> : null}
      </ul>
      <QuickAdd id={`new-team-${department.id}`} label={`New team in ${department.name}`} placeholder="Add a team" compact busy={actions.create.isPending} onAdd={(name) => actions.create.mutateAsync({ type: 'teams', body: { name, department_id: department.id } })} />

      {editing ? <DepartmentEditor department={department} companies={companies} actions={actions} onClose={() => setEditing(false)} /> : null}
      <ConfirmDialog
        open={removing}
        onClose={() => setRemoving(false)}
        title={`Delete ${department.name}?`}
        message="It is not used by any job, so it can be deleted."
        confirmLabel="Delete"
        loading={actions.remove.isPending}
        onConfirm={() => actions.remove.mutate({ type: 'departments', id: department.id, name: department.name }, { onSettled: () => setRemoving(false) })}
      />
    </li>
  )
}

DepartmentCard.propTypes = { department: PropTypes.object.isRequired, teams: PropTypes.array.isRequired, companies: PropTypes.array.isRequired, actions: PropTypes.object.isRequired }

function DepartmentEditor({ department, companies, actions, onClose }) {
  const [name, setName] = useState(department.name)
  const [entity, setEntity] = useState(department.entity?.slug ?? GROUP)

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Edit ${department.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form={`edit-department-${department.id}`} loading={actions.update.isPending} disabled={!name.trim()}>Save</Button>
        </>
      }
    >
      <form
        id={`edit-department-${department.id}`}
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          actions.update.mutate({ type: 'departments', id: department.id, body: { name: name.trim(), entity: entity || null } }, { onSuccess: onClose })
        }}
      >
        <FormField id={`department-name-${department.id}`} label="Name" required>
          <Input id={`department-name-${department.id}`} value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField id={`department-company-${department.id}`} label="Company">
          <Select id={`department-company-${department.id}`} value={entity} onChange={setEntity} options={[...companies.map((item) => ({ value: item.slug, label: item.name })), { value: GROUP, label: 'Whole group (all companies)' }]} />
        </FormField>
      </form>
    </Modal>
  )
}

DepartmentEditor.propTypes = { department: PropTypes.object.isRequired, companies: PropTypes.array.isRequired, actions: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired }

/**
 * A skill. × removes it from this company when other companies also use it; otherwise it deletes the skill,
 * which is only possible while no job uses it.
 */
function SkillChip({ skill, company, actions }) {
  const owners = (skill.entities ?? []).map((entity) => entity.slug)
  const shared = company !== GROUP && owners.length > 1
  const blocked = !shared && skill.usage > 0
  const others = (skill.entities ?? []).filter((entity) => entity.slug !== company).map((entity) => entity.name)

  return (
    <li className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-white pl-3 text-sm text-navy">
      {skill.name}
      {shared ? <span className="text-xs text-muted">+ {others.join(', ')}</span> : null}
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={blocked ? `${skill.name} is used by ${skill.usage} jobs` : shared ? `Remove ${skill.name} from this company` : `Delete ${skill.name}`}
        title={blocked ? `Used by ${skill.usage} ${skill.usage === 1 ? 'job' : 'jobs'}, so it stays` : undefined}
        disabled={blocked}
        onClick={() =>
          shared
            ? actions.update.mutate({ type: 'skills', id: skill.id, body: { entities: owners.filter((slug) => slug !== company) }, message: `${skill.name} removed from this company` })
            : actions.remove.mutate({ type: 'skills', id: skill.id, name: skill.name })
        }
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  )
}

SkillChip.propTypes = { skill: PropTypes.object.isRequired, company: PropTypes.string.isRequired, actions: PropTypes.object.isRequired }

function ItemMenu({ name, items }) {
  return (
    <Menu as="div" className="relative">
      <MenuButton className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-navy hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={`More actions for ${name}`}>
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems anchor="bottom end" className="z-30 w-60 rounded-xl border border-border bg-white p-1 shadow-card-hover focus:outline-none">
        {items.map((item) => (
          <MenuItem key={item.label} disabled={item.disabled}>
            <button type="button" onClick={item.run} className={`block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm data-[focus]:bg-brand-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 ${item.danger ? 'text-danger' : 'text-navy'}`}>
              {item.label}
              {item.hint ? <span className="block text-xs text-muted">{item.hint}</span> : null}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

ItemMenu.propTypes = { name: PropTypes.string.isRequired, items: PropTypes.array.isRequired }
