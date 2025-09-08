'use client';

import { MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TeamMemberUser {
  id: string;
  name: string | null;
  email?: string | null;
  mbtiType?: string | null;
}

interface TeamMemberItem {
  id: string;
  user: TeamMemberUser;
}

interface TeamMemberListClientProps {
  members: TeamMemberItem[];
  courseId: string;
  canManage?: boolean; // controls three-dots menu and removal
}

export function TeamMemberListClient({
  members,
  courseId,
  canManage = true,
}: TeamMemberListClientProps) {
  const [localMembers, setLocalMembers] = useState<TeamMemberItem[]>(members);
  const [openMenuMemberId, setOpenMenuMemberId] = useState<string | null>(null);
  const [confirmMemberId, setConfirmMemberId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Close menus when clicking outside
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenMenuMemberId(null);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const onRemoveMember = async (memberId: string) => {
    const member = localMembers.find(m => m.id === memberId);
    if (!member) return;
    setIsRemoving(true);
    setRemoveError(null);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/students/${member.user.id}`,
        {
          method: 'DELETE',
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal menghapus mahasiswa');
      }
      setLocalMembers(prev => prev.filter(m => m.id !== memberId));
      setConfirmMemberId(null);
      setOpenMenuMemberId(null);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsRemoving(false);
    }
  };

  const count = localMembers.length;
  const gridColsClass =
    count <= 2 ? 'grid-cols-1' : count <= 6 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div ref={containerRef} className={cn('grid gap-2', gridColsClass)}>
      {localMembers.map(member => (
        <div
          key={member.id}
          className='flex items-center gap-3 p-3 border rounded-2xl hover:bg-gray-50'
        >
          {member.user.mbtiType ? (
            <Image
              src={`/mbti-logo-normalized/${member.user.mbtiType}.svg`}
              alt={member.user.mbtiType}
              width={40}
              height={40}
              className='w-10 h-10'
            />
          ) : (
            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 font-semibold text-sm'>
                {(member.user.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <p className='font-medium text-gray-900 truncate'>
              {member.user.name || 'Tanpa Nama'}
            </p>
          </div>
          {canManage && (
            <div className='ml-auto relative'>
              <button
                aria-label='Opsi'
                className='p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300'
                onClick={e => {
                  e.stopPropagation();
                  setOpenMenuMemberId(prev =>
                    prev === member.id ? null : member.id
                  );
                }}
              >
                <MoreVertical className='w-5 h-5 text-gray-500' />
              </button>
              {openMenuMemberId === member.id && (
                <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden'>
                  <button
                    className='w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600'
                    onClick={e => {
                      e.stopPropagation();
                      setConfirmMemberId(member.id);
                      setOpenMenuMemberId(null);
                      setRemoveError(null);
                    }}
                  >
                    Hapus mahasiswa
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {canManage && (
        <Dialog
          open={!!confirmMemberId}
          onOpenChange={open => !open && setConfirmMemberId(null)}
        >
          <DialogContent className='sm:max-w-xs'>
            <DialogHeader>
              <DialogTitle className='text-left'>Hapus Mahasiswa</DialogTitle>
              {removeError && (
                <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md text-left'>
                  {removeError}
                </p>
              )}
            </DialogHeader>
            <p className='text-sm text-muted-foreground text-left'>
              Mahasiswa akan dihapus dari kelas ini. Lanjutkan?
            </p>
            <DialogFooter className='flex flex-col gap-2 sm:flex-col'>
              <Button
                variant='destructive'
                onClick={() =>
                  confirmMemberId && onRemoveMember(confirmMemberId)
                }
                disabled={isRemoving}
                className='w-full rounded-full'
              >
                {isRemoving ? 'Menghapus...' : 'Hapus'}
              </Button>
              <Button
                variant='outline'
                onClick={() => setConfirmMemberId(null)}
                disabled={isRemoving}
                className='w-full rounded-full'
              >
                Batal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
