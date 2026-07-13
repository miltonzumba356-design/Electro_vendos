import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Pagination, PaginationContent, PaginationItem } from './pagination'

export function TablePagination({
  page, totalPages, onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent className="gap-2">
        <PaginationItem>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t('common.previousPage')}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="text-sm text-muted-foreground px-1">
            {t('common.pageIndicator', { page, total: totalPages })}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t('common.nextPage')}
          >
            <ChevronRight className="size-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
