'use client';

import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MBTIOverviewLayout } from '@/components/dashboard/mbti-overview-layout';
import { StudentProfileContent } from '@/components/dashboard/student-profile-content';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Gender } from '@/generated/prisma/client';
import type { ExtendedUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getMBTIType } from '@/lib/utils/mbti-helpers';

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
  gender?: Gender | null;
}

interface TeamMemberItem {
  id: string;
  assignedSkillIds?: string[] | null;
  topSkills?: string[];
  preferredTopics?: string[];
  user: TeamMemberUser;
}

interface EnrolledStudent {
  id: string;
  name: string | null;
  nim: string | null;
  email: string | null;
  mbtiType: string | null;
  gender: string | null;
}

interface TeamMemberListClientProps {
  members: TeamMemberItem[];
  courseId: string;
  searchValue?: string;
  canManage?: boolean;
  currentUserId?: string;
  isEditMode?: boolean;
  teamId?: string;
  assignmentId?: string;
  availableStudents?: EnrolledStudent[];
  missingStudentIds?: Set<string>;
  saveTrigger?: number;
  onPendingAdditionsChange?: (pendingStudentIds: Set<string>) => void;
  onSavingChange?: (isSaving: boolean) => void;
}

const convertToExtendedUser = (member: TeamMemberItem): ExtendedUser => {
  const ei = member.user.ei ?? null;
  const sn = member.user.sn ?? null;
  const tf = member.user.tf ?? null;
  const pj = member.user.pj ?? null;

  return {
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: null,
    nim: member.user.nim,
    isOnboarded: true,
    onboardingStep: null,
    mbtiType: getMBTIType({
      ei,
      sn,
      tf,
      pj,
      mbtiType: (member.user.mbtiType || null) as ExtendedUser['mbtiType'],
    }) as ExtendedUser['mbtiType'],
    ei,
    sn,
    tf,
    pj,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    image: null,
    emailVerified: false,
    gender: member.user.gender ?? null,
    hasSeenWelcomeSplash: false,
    onboardingData: null,
    personalityData: null,
  } as ExtendedUser;
};

export function TeamMemberListClient({
  members,
  courseId,
  searchValue = '',
  canManage = false,
  currentUserId,
  isEditMode = false,
  teamId,
  assignmentId,
  availableStudents = [],
  missingStudentIds = new Set(),
  saveTrigger,
  onPendingAdditionsChange,
  onSavingChange,
}: TeamMemberListClientProps) {
  const t = useTranslations('dashboard.students');
  const tTeams = useTranslations('dashboard.teams');
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
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, _setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [isAdding, _setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(
    new Set()
  );
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [_saveError, setSaveError] = useState<string | null>(null);
  const lastSaveTriggerRef = useRef(0);
  const onPendingAdditionsChangeRef = useRef(onPendingAdditionsChange);
  const onSavingChangeRef = useRef(onSavingChange);

  useEffect(() => {
    onPendingAdditionsChangeRef.current = onPendingAdditionsChange;
  }, [onPendingAdditionsChange]);

  useEffect(() => {
    onSavingChangeRef.current = onSavingChange;
  }, [onSavingChange]);

  const filteredAvailableStudents = availableStudents.filter(
    s => !pendingAdditions.has(s.id)
  );

  const displayMembers = [
    ...members.filter(m => !pendingDeletions.has(m.user.id)),
    ...Array.from(pendingAdditions)
      .map(studentId => {
        const student = availableStudents.find(s => s.id === studentId);
        if (!student) return null;
        return {
          id: `pending-${studentId}`,
          assignedSkillIds: null,
          topSkills: [],
          preferredTopics: [],
          user: {
            id: student.id,
            name: student.name,
            email: student.email,
            mbtiType: student.mbtiType,
            nim: student.nim,
            ei: null,
            sn: null,
            tf: null,
            pj: null,
            gender: student.gender,
          },
        } as TeamMemberItem;
      })
      .filter((m): m is TeamMemberItem => m !== null),
  ];

  const count = displayMembers.length;
  const gridColsClass =
    count <= 2 ? 'grid-cols-1' : count <= 6 ? 'grid-cols-2' : 'grid-cols-3';

  const isHighlighted = (member: TeamMemberItem) => {
    if (!searchValue.trim()) return false;
    const searchTerm = searchValue.toLowerCase();
    const name = member.user.name?.toLowerCase() ?? '';
    const nim = member.user.nim?.toLowerCase() ?? '';
    return name.includes(searchTerm) || nim.includes(searchTerm);
  };

  const isCurrentUser = (member: TeamMemberItem) => {
    return currentUserId ? member.user.id === currentUserId : false;
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

  const handleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.user.id)));
    }
  };

  const handleToggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedMembers.size === 0) return;
    setPendingDeletions(prev => {
      const next = new Set(prev);
      for (const id of selectedMembers) {
        next.add(id);
      }
      return next;
    });
    setPendingAdditions(prev => {
      const next = new Set(prev);
      for (const id of selectedMembers) {
        next.delete(id);
      }
      return next;
    });
    setSelectedMembers(new Set());
    setDeleteError(null);
  };

  const handleAddStudent = (studentId: string) => {
    if (!teamId || !assignmentId) return;
    setPendingAdditions(prev => new Set(prev).add(studentId));
    setPendingDeletions(prev => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    setIsAddPopoverOpen(false);
    setAddError(null);
  };

  const pendingAdditionsRef = useRef(pendingAdditions);
  const pendingDeletionsRef = useRef(pendingDeletions);

  useEffect(() => {
    pendingAdditionsRef.current = pendingAdditions;
  }, [pendingAdditions]);

  useEffect(() => {
    pendingDeletionsRef.current = pendingDeletions;
  }, [pendingDeletions]);

  const savePendingChanges = useCallback(async () => {
    if (!teamId || !assignmentId) return;
    const additions = pendingAdditionsRef.current;
    const deletions = pendingDeletionsRef.current;

    if (additions.size === 0 && deletions.size === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const addPromises = Array.from(additions).map(async studentId => {
        const res = await fetch(
          `/api/assignments/${assignmentId}/teams/${teamId}/members`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId }),
          }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || tTeams('addMemberFailed'));
        }
        return res;
      });

      const deletePromises = Array.from(deletions).map(async studentId => {
        const res = await fetch(
          `/api/assignments/${assignmentId}/teams/${teamId}/members`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId }),
          }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to delete member');
        }
        return res;
      });

      await Promise.all([...addPromises, ...deletePromises]);
      setPendingAdditions(new Set());
      setPendingDeletions(new Set());
      window.location.reload();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save changes'
      );
    } finally {
      setIsSaving(false);
    }
  }, [teamId, assignmentId, tTeams]);

  useEffect(() => {
    if (
      saveTrigger != null &&
      saveTrigger > 0 &&
      saveTrigger !== lastSaveTriggerRef.current
    ) {
      lastSaveTriggerRef.current = saveTrigger;
      savePendingChanges();
    }
  }, [saveTrigger, savePendingChanges]);

  useEffect(() => {
    onPendingAdditionsChangeRef.current?.(new Set(pendingAdditions));
  }, [pendingAdditions]);

  useEffect(() => {
    onSavingChangeRef.current?.(isSaving);
  }, [isSaving]);

  return (
    <>
      {isEditMode && canManage && (
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='select-all'
              checked={
                members.length > 0 && selectedMembers.size === members.length
              }
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor='select-all'
              className='text-sm font-medium cursor-pointer'
            >
              {tTeams('selectAll')}
            </label>
          </div>
          <div className='flex flex-col gap-2'>
            {deleteError && (
              <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md'>
                {deleteError}
              </p>
            )}
            <div className='flex items-center gap-2'>
              <Popover
                open={isAddPopoverOpen}
                onOpenChange={open => {
                  setIsAddPopoverOpen(open);
                  if (!open) {
                    setAddError(null);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-full'
                    disabled={isAdding}
                  >
                    <Plus className='w-4 h-4 mr-1' />
                    {tTeams('addMember')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80 p-2' align='end'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium px-2 py-1'>
                      {tTeams('availableStudents')}
                    </p>
                    {addError && (
                      <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md mx-2'>
                        {addError}
                      </p>
                    )}
                    {filteredAvailableStudents.length === 0 ? (
                      <p className='text-sm text-gray-500 px-2 py-2'>
                        {tTeams('noAvailableStudents')}
                      </p>
                    ) : (
                      <div className='max-h-64 overflow-y-auto'>
                        {filteredAvailableStudents.map(student => {
                          const isMissing = missingStudentIds.has(student.id);
                          return (
                            <button
                              key={student.id}
                              type='button'
                              className={cn(
                                'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                                isMissing
                                  ? 'bg-red-50 hover:bg-red-100 border border-red-200'
                                  : 'hover:bg-gray-100'
                              )}
                              onClick={() => handleAddStudent(student.id)}
                              disabled={isAdding}
                            >
                              {student.mbtiType ? (
                                <Image
                                  src={`/mbti-logo-normalized/${student.mbtiType}.svg`}
                                  alt={student.mbtiType}
                                  width={32}
                                  height={32}
                                  className='w-8 h-8'
                                />
                              ) : (
                                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                                  <span className='text-blue-600 font-semibold text-xs'>
                                    {(student.name || '?')
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className='flex-1 min-w-0'>
                                <p
                                  className={cn(
                                    'font-medium text-sm truncate',
                                    isMissing ? 'text-red-900' : 'text-gray-900'
                                  )}
                                >
                                  {student.name || t('noName')}
                                </p>
                                <p
                                  className={cn(
                                    'text-xs truncate',
                                    isMissing ? 'text-red-700' : 'text-gray-500'
                                  )}
                                >
                                  {student.nim || ''}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedMembers.size > 0 && (
                <Button
                  variant='destructive'
                  size='sm'
                  className='rounded-full'
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  <Trash2 className='w-4 h-4 mr-1' />
                  {tTeams('deleteMember')} ({selectedMembers.size})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={cn('grid gap-2', gridColsClass)}>
        {displayMembers.map(member => {
          const isPendingAddition = member.id.startsWith('pending-');
          return (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-3 p-3 border rounded-2xl transition-all duration-200',
                isEditMode && canManage ? '' : 'cursor-pointer',
                isPendingAddition
                  ? 'bg-blue-50 border-blue-300 border-dashed opacity-75'
                  : isHighlighted(member)
                    ? 'bg-yellow-50 border-yellow-300 shadow-sm hover:bg-yellow-100'
                    : isCurrentUser(member)
                      ? 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100'
                      : isEditMode && canManage
                        ? ''
                        : 'hover:bg-gray-50'
              )}
              {...(!(isEditMode && canManage) && {
                role: 'button',
                tabIndex: 0,
                onClick: () => {
                  setSelectedMember(member);
                  setModalContent('profile');
                  setIsProfileOpen(true);
                },
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMember(member);
                    setModalContent('profile');
                    setIsProfileOpen(true);
                  }
                },
              })}
            >
              {isEditMode && canManage && (
                <Checkbox
                  checked={selectedMembers.has(member.user.id)}
                  onCheckedChange={() => handleToggleMember(member.user.id)}
                />
              )}
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
          );
        })}
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
