import PropTypes from 'prop-types'
import { EmptyState } from '@shared/ui/Skeleton'
import { PageHeader } from '@shared/ui/Card'

export function PlaceholderPage({ title }) {
  return (
    <div>
      <PageHeader title={title} subtitle="This section is part of a later phase." />
      <EmptyState title="Nothing here yet" description="The list, filters and actions for this section are built in the next phases." />
    </div>
  )
}

PlaceholderPage.propTypes = { title: PropTypes.string.isRequired }
