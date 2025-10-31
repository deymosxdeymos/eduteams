'use client';

import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EditImpact } from '@/lib/utils/assignment-change-detection';
import { AssignmentChangeDiff } from './assignment-change-diff';

interface AssignmentEditConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  impact: EditImpact | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AssignmentEditConfirmationDialog({
  open,
  onOpenChange,
  impact,
  onConfirm,
  onCancel,
}: AssignmentEditConfirmationDialogProps) {
  const t = useTranslations('dashboard.assignments.edit.confirmation');
  const [confirmed, setConfirmed] = useState(false);

  if (!impact) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
    setConfirmed(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
    setConfirmed(false);
  };

  // Tier 4: Blocked (teams formed)
  if (impact.tier === 4) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <XCircle className='w-5 h-5' />
              {t('tier4.title', { defaultValue: 'Cannot Edit Assignment' })}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <p className='text-sm text-gray-700'>
              {impact.reason ||
                t('tier4.message', {
                  defaultValue:
                    'Cannot edit assignment structure after teams have been formed. Please reset the assignment first.',
                })}
            </p>

            <div className='rounded-md bg-red-50 border border-red-200 p-4'>
              <p className='text-sm text-red-800'>
                {t('tier4.help', {
                  defaultValue:
                    'To make structural changes, you must first reset the assignment, which will clear all team formations and student submissions.',
                })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} variant='outline'>
              {t('close', { defaultValue: 'Close' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Tier 3: Destructive changes
  if (impact.tier === 3) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600'>
              <AlertTriangle className='w-5 h-5' />
              {t('tier3.title', {
                defaultValue: 'Destructive Changes Detected',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <p className='text-sm text-gray-700'>
              {impact.reason ||
                t('tier3.message', {
                  count: impact.affectedSubmissions,
                  defaultValue:
                    'This will invalidate {{count}} existing submission(s). Students will need to retake the entire assessment.',
                })}
            </p>

            <AssignmentChangeDiff changes={impact.changes} />

            <div className='rounded-md bg-amber-50 border border-amber-200 p-4'>
              <label className='flex items-start gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className='mt-0.5 w-4 h-4 rounded border-gray-300'
                />
                <span className='text-sm text-amber-900'>
                  {t('tier3.confirm', {
                    defaultValue:
                      'I understand this will invalidate existing work and students will need to retake the assessment.',
                  })}
                </span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} variant='outline'>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmed}
              className='bg-amber-600 hover:bg-amber-700'
            >
              {t('tier3.continue', { defaultValue: 'Continue and Invalidate' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Tier 2: Additive changes
  if (impact.tier === 2) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-blue-600'>
              <Info className='w-5 h-5' />
              {t('tier2.title', { defaultValue: 'New Items Added' })}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <p className='text-sm text-gray-700'>
              {impact.reason ||
                t('tier2.message', {
                  count: impact.affectedSubmissions,
                  defaultValue:
                    'New items have been added. {{count}} student(s) who already submitted will need to complete the new sections.',
                })}
            </p>

            <AssignmentChangeDiff changes={impact.changes} />

            <div className='rounded-md bg-blue-50 border border-blue-200 p-4'>
              <p className='text-sm text-blue-900'>
                {t('tier2.info', {
                  defaultValue:
                    "Students' existing responses will be kept, but submissions will be marked as incomplete until they assess the new items.",
                })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} variant='outline'>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirm}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {t('tier2.continue', { defaultValue: 'Continue' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
