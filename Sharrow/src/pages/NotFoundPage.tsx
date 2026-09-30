import { PageLayout } from '@/components/shell/PageLayout'
import { EmptyState, Button } from '@/design/primitives'
import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <PageLayout eyebrow="404" title="This destination does not exist">
      <div className="rounded-md border border-line bg-surface-1">
        <EmptyState
          size="md"
          icon={<Compass className="size-5" aria-hidden="true" />}
          title="SHARROW could not find that page"
          body="The address may have changed, or the link may be from an older intelligence build."
          action={
            <Link to="/">
              <Button size="sm" variant="primary">
                Return to overview
              </Button>
            </Link>
          }
        />
      </div>
    </PageLayout>
  )
}
