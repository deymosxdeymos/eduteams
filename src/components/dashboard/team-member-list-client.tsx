'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MBTIOverviewLayout } from '@/components/dashboard/mbti-overview-layout';
import { StudentProfileContent } from '@/components/dashboard/student-profile-content';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExtendedUser } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TeamMemberUser {
  id: string;
  name: string | null;
  email?: string | null;
  mbtiType?: string | null;
  nim?: string | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
}

interface TeamMemberItem {
  id: string;
  user: TeamMemberUser;
}

interface TeamMemberListClientProps {
  members: TeamMemberItem[];
  courseId: string;
  searchValue?: string;
  canManage?: boolean;
}

const convertToExtendedUser = (member: TeamMemberItem): ExtendedUser =>
  ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: null,
    nim: member.user.nim,
    isOnboarded: true,
    onboardingStep: null,
    mbtiType: (member.user.mbtiType || null) as ExtendedUser['mbtiType'],
    ei: member.user.ei ?? null,
    sn: member.user.sn ?? null,
    tf: member.user.tf ?? null,
    pj: member.user.pj ?? null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    image: null,
    emailVerified: false,
    gender: null,
    hasSeenWelcomeSplash: false,
    onboardingData: null,
    personalityData: null,
  }) as ExtendedUser;

export function TeamMemberListClient({
  members,
  courseId,
  searchValue = '',
  canManage = false,
}: TeamMemberListClientProps) {
  const t = useTranslations('dashboard.students');
  const [selectedMember, setSelectedMember] = useState<TeamMemberItem | null>(
    null
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'profile' | 'mbti'>(
    'profile'
  );
  const [confirmStudentId, setConfirmStudentId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const count = members.length;
  const gridColsClass =
    count <= 2 ? 'grid-cols-1' : count <= 6 ? 'grid-cols-2' : 'grid-cols-3';

  const isHighlighted = (member: TeamMemberItem) => {
    if (!searchValue.trim()) return false;
    const searchTerm = searchValue.toLowerCase();
    const name = member.user.name?.toLowerCase() ?? '';
    const nim = member.user.nim?.toLowerCase() ?? '';
    return name.includes(searchTerm) || nim.includes(searchTerm);
  };

  const onRemoveStudent = async (studentId: string) => {
    setIsRemoving(true);
    setRemoveError(null);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/students/${studentId}`,
        {
          method: 'DELETE',
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || t('errors.removeFailed'));
      }
      setConfirmStudentId(null);
      // Close profile modal if viewing the removed student
      if (selectedMember && selectedMember.user.id === studentId) {
        setIsProfileOpen(false);
        setSelectedMember(null);
      }
      // Refresh the page to update the teams
      window.location.reload();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : t('errors.error'));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div className={cn('grid gap-2', gridColsClass)}>
        {members.map(member => (
          <div
            key={member.id}
            className={cn(
              'flex items-center gap-3 p-3 border rounded-2xl transition-all duration-200 cursor-pointer',
              isHighlighted(member)
                ? 'bg-yellow-50 border-yellow-300 shadow-sm hover:bg-yellow-100'
                : 'hover:bg-gray-50'
            )}
            role='button'
            tabIndex={0}
            onClick={() => {
              setSelectedMember(member);
              setModalContent('profile');
              setIsProfileOpen(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedMember(member);
                setModalContent('profile');
                setIsProfileOpen(true);
              }
            }}
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
            <div className='flex-1 min-w-0 flex flex-col'>
              <p className='font-medium text-gray-900 truncate'>
                {member.user.name || t('noName')}
              </p>
              <p className='text-[0.625rem] font-normal text-gray-500 truncate'>
                {member.user.nim || ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      <Dialog
        open={isProfileOpen}
        onOpenChange={open => {
          setIsProfileOpen(open);
          if (!open) {
            setSelectedMember(null);
            setModalContent('profile');
          }
        }}
      >
        <DialogContent
          className='w-[85vw] max-w-[1200px] rounded-3xl p-0 border-0 gap-0 items-start'
          showCloseButton={false}
        >
          <DialogTitle className='sr-only'>
            {modalContent === 'profile'
              ? t('studentProfile')
              : t('mbtiDistribution')}
          </DialogTitle>
          {selectedMember &&
            (() => {
              const memberUser = convertToExtendedUser(selectedMember);

              return modalContent === 'profile' ? (
                <StudentProfileContent
                  student={memberUser}
                  canManage={canManage}
                  onRemoveStudent={() =>
                    selectedMember &&
                    setConfirmStudentId(selectedMember.user.id)
                  }
                  onClose={() => setIsProfileOpen(false)}
                  onShowMBTI={() => setModalContent('mbti')}
                  isModal
                />
              ) : (
                <div className='overflow-hidden'>
                  <MBTIOverviewLayout
                    user={memberUser}
                    isModal
                    isCompact
                    onRequestClose={() => setModalContent('profile')}
                  />
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog
        open={!!confirmStudentId}
        onOpenChange={open => !open && setConfirmStudentId(null)}
      >
        <DialogContent className='sm:max-w-xs'>
          <DialogHeader>
            <DialogTitle className='text-left'>{t('remove')}</DialogTitle>
            {removeError && (
              <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md text-left'>
                {removeError}
              </p>
            )}
          </DialogHeader>
          <p className='text-sm text-muted-foreground text-left'>
            {t('confirmRemove')}
          </p>
          <DialogFooter className='flex flex-col gap-2 sm:flex-col'>
            <Button
              variant='destructive'
              onClick={() => {
                if (confirmStudentId) {
                  onRemoveStudent(confirmStudentId);
                }
              }}
              disabled={isRemoving}
              className='w-full rounded-full'
            >
              {isRemoving ? t('removing') : t('delete')}
            </Button>
            <Button
              variant='outline'
              onClick={() => setConfirmStudentId(null)}
              disabled={isRemoving}
              className='w-full rounded-full'
            >
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
