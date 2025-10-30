'use client';

import {
  Calendar,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { getAssignmentStatusBadge } from '@/lib/utils/assignment-status';
import type { ManageAssignmentRow } from '@/types/manage';

interface ManageAssignmentsViewProps {
  assignments: ManageAssignmentRow[];
  courseId: string;
  searchPlaceholder: string;
  emptyActiveMessage: string;
  emptyArchivedMessage: string;
  renderActions?: (assignment: ManageAssignmentRow) => ReactNode;
  onArchiveToggle?: (assignment: ManageAssignmentRow) => Promise<void> | void;
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDate(isoString: string): string {
  return dateFormatter.format(new Date(isoString));
}

function ManageTable({
  rows,
  emptyMessage,
  renderActions,
}: {
  rows: ManageAssignmentRow[];
  emptyMessage: string;
  renderActions: (assignment: ManageAssignmentRow) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className='flex h-40 items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30'>
        <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table className='min-w-[720px]'>
      <TableHeader className='[&_tr]:border-b-0'>
        <TableRow className='bg-muted overflow-hidden rounded-md'>
          <TableHead className='rounded-md'>Nama Tugas</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='text-right rounded-md'>
            Manage Control
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(assignment => {
          const statusBadge = getAssignmentStatusBadge(
            assignment.status,
            assignment.submissionsCount,
            assignment.totalStudents
          );

          return (
            <TableRow key={assignment.id} className='bg-white'>
              <TableCell>
                <div className='flex flex-col gap-1'>
                  <span className='font-medium'>{assignment.title}</span>
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <Calendar className='size-3.5' />
                    <span>{formatDate(assignment.startAt)}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={cn('rounded-full border', statusBadge.className)}
                >
                  {statusBadge.text}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                {renderActions(assignment)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function EditAssignmentDialog(): ReactNode {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Edit assignment'
          disabled
        >
          <Pencil className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-2xl sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-medium'>Edit Tugas</DialogTitle>
          <DialogDescription className='text-sm font-normal'>
            Fitur edit tugas akan segera hadir.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAssignmentDialog(): ReactNode {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Delete assignment'
          disabled
          className='text-destructive hover:text-destructive'
        >
          <Trash2 className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-2xl sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle className='font-medium'>Hapus Tugas?</DialogTitle>
          <DialogDescription>
            Fitur hapus tugas akan segera hadir.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export function ManageAssignmentsView({
  assignments,
  courseId,
  searchPlaceholder,
  emptyActiveMessage,
  emptyArchivedMessage,
  renderActions,
  onArchiveToggle,
}: ManageAssignmentsViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(
    null
  );
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const handleArchiveToggle = useCallback(
    (assignment: ManageAssignmentRow) => {
      if (!onArchiveToggle) {
        return;
      }

      setPendingAssignmentId(assignment.id);
      setArchiveError(null);
      void (async () => {
        try {
          await onArchiveToggle(assignment);
          router.refresh();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Gagal mengubah status tugas. Silakan coba lagi.';
          setArchiveError(errorMessage);
        } finally {
          setPendingAssignmentId(current =>
            current === assignment.id ? null : current
          );
        }
      })();
    },
    [onArchiveToggle, router]
  );

  const defaultActions = useCallback(
    (assignment: ManageAssignmentRow) => {
      const archiveLabel = assignment.isArchived
        ? 'Tampilkan tugas'
        : 'Sembunyikan tugas';
      const ArchiveIcon = assignment.isArchived ? Eye : EyeOff;
      const isPending = pendingAssignmentId === assignment.id;

      return (
        <div className='flex items-center justify-end gap-2'>
          <Button asChild variant='ghost' size='icon' aria-label='Lihat tugas'>
            <Link
              href={`/dashboard/class/${courseId}/assignments/${assignment.id}`}
            >
              <ExternalLink className='size-4' />
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                aria-label={archiveLabel}
                disabled={isPending}
                aria-busy={isPending}
              >
                <ArchiveIcon className='size-4' />
              </Button>
            </DialogTrigger>
            <DialogContent className='rounded-2xl sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle className='font-medium'>
                  {assignment.isArchived
                    ? 'Munculkan Tugas?'
                    : 'Sembunyikan Tugas?'}
                </DialogTitle>
                <DialogDescription>
                  {assignment.isArchived
                    ? 'Tampilkan tugas ini agar mahasiswa dapat melihatnya'
                    : 'Tugas yang disembunyikan tidak akan bisa diakses oleh mahasiswa'}
                </DialogDescription>
              </DialogHeader>
              {archiveError && (
                <div
                  className='rounded-md border border-red-200 bg-red-50 p-3'
                  role='alert'
                  aria-live='polite'
                >
                  <p className='text-sm text-red-600'>{archiveError}</p>
                </div>
              )}
              <DialogFooter className='flex-col-reverse sm:flex-col-reverse'>
                <DialogClose asChild>
                  <Button variant='ghost' className='rounded-full'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant='onboarding'
                  className='h-12 text-sm rounded-full'
                  aria-label={archiveLabel}
                  disabled={isPending}
                  aria-busy={isPending}
                  onClick={() => handleArchiveToggle(assignment)}
                >
                  {isPending && (
                    <LoadingSpinner size='sm' color='white' className='mr-2' />
                  )}
                  {assignment.isArchived ? 'Munculkan' : 'Sembunyikan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <EditAssignmentDialog />
          <DeleteAssignmentDialog />
        </div>
      );
    },
    [handleArchiveToggle, pendingAssignmentId, archiveError, courseId]
  );

  const renderRowActions = renderActions ?? defaultActions;

  const filteredAssignments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assignments;

    return assignments.filter(assignment => {
      const tokens = assignment.title.toLowerCase();
      return tokens.includes(term);
    });
  }, [assignments, searchTerm]);

  const activeAssignments = filteredAssignments.filter(a => !a.isArchived);
  const archivedAssignments = filteredAssignments.filter(a => a.isArchived);

  return (
    <section className='flex h-full flex-col gap-6 rounded-3xl rounded-r-none bg-white p-6'>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative flex-1'>
          <Input
            type='search'
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className='h-11 rounded-full pl-4 pr-11'
            autoFocus
          />
          <Search className='absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        <ManageTable
          rows={activeAssignments}
          emptyMessage={emptyActiveMessage}
          renderActions={renderRowActions}
        />
      </div>

      <Separator className='my-6 data-[orientation=horizontal]:h-1 rounded-full bg-neutral-200' />

      <div>
        <button
          type='button'
          onClick={() => setShowArchived(value => !value)}
          className={cn(
            'flex w-full max-w-fit cursor-pointer items-center gap-2 px-0 py-0 text-left text-sm font-semibold transition-colors',
            showArchived
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-expanded={showArchived}
        >
          <span>Tugas yang Diarsipkan</span>
          <svg
            className={cn(
              'size-4 text-current transition-transform',
              showArchived ? 'rotate-90' : ''
            )}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5l7 7-7 7'
            />
          </svg>
        </button>
        {showArchived && (
          <div className='mt-4'>
            <ManageTable
              rows={archivedAssignments}
              emptyMessage={emptyArchivedMessage}
              renderActions={renderRowActions}
            />
          </div>
        )}
      </div>
    </section>
  );
}
