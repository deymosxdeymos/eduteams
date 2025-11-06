'use client';

import { Pencil, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Textarea } from '@/components/ui/textarea';
import type { EditImpact } from '@/lib/utils/assignment-change-detection';
import type { ManageAssignmentRow } from '@/types/manage';
import { AssignmentEditConfirmationDialog } from './assignment-edit-confirmation-dialog';

interface EditAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: ManageAssignmentRow;
  courseId: string;
}

function parseDescriptionJSON(description: string | null) {
  if (!description) {
    return { text: '', skills: [], topics: [] };
  }

  try {
    const parsed = JSON.parse(description);
    return {
      text: parsed.text || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch {
    return { text: description, skills: [], topics: [] };
  }
}

export function EditAssignmentModal({
  open,
  onOpenChange,
  assignment,
  courseId,
}: EditAssignmentModalProps) {
  const t = useTranslations('dashboard.assignments.edit');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editImpact, setEditImpact] = useState<EditImpact | null>(null);
  const isFormValid = Boolean(title.trim()) && skills.length > 0;

  useEffect(() => {
    if (open) {
      const parsed = parseDescriptionJSON(assignment.description);
      setTitle(assignment.title);
      setDescription(parsed.text);
      setSkills(parsed.skills);
      setTopics(parsed.topics);
      setHasUnsavedChanges(false);
      setError(null);
    }
  }, [open, assignment]);

  useEffect(() => {
    if (open) {
      const parsed = parseDescriptionJSON(assignment.description);
      const hasChanged =
        title !== assignment.title ||
        description !== parsed.text ||
        JSON.stringify(skills) !== JSON.stringify(parsed.skills) ||
        JSON.stringify(topics) !== JSON.stringify(parsed.topics);
      setHasUnsavedChanges(hasChanged);
    }
  }, [title, description, skills, topics, open, assignment]);

  const handleClose = (newOpen: boolean) => {
    if (newOpen) {
      onOpenChange(true);
      return;
    }

    if (hasUnsavedChanges && !submitting) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }

    onOpenChange(false);
  };

  const addSkill = () => {
    const trimmedInput = skillInput.trim();
    if (trimmedInput && !skills.includes(trimmedInput)) {
      setSkills([...skills, trimmedInput]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addTopic = () => {
    const trimmedInput = topicInput.trim();
    if (trimmedInput && !topics.includes(trimmedInput)) {
      setTopics([...topics, trimmedInput]);
      setTopicInput('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Check edit impact first
      const impactRes = await fetch(
        `/api/assignments/${assignment.id}/check-edit-impact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skills,
            topics,
          }),
        }
      );

      const impactData = await impactRes.json();
      if (!impactRes.ok || !impactData?.success) {
        throw new Error(impactData?.error || t('error'));
      }

      const impact = impactData.data as EditImpact;
      setEditImpact(impact);

      // Tier 1: Safe changes, submit directly
      if (impact.tier === 1) {
        await performUpdate(false);
        return;
      }

      // Tier 2, 3, 4: Show confirmation dialog
      setShowConfirmation(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
      setSubmitting(false);
    }
  };

  const performUpdate = async (confirmDestructive: boolean) => {
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          skills,
          topics,
          confirmDestructiveChanges: confirmDestructive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || t('error'));
      }
      setHasUnsavedChanges(false);
      onOpenChange(false);
      const ev = new CustomEvent('assignment:updated', {
        detail: { assignmentId: assignment.id, courseId },
      });
      window.dispatchEvent(ev);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEdit = async () => {
    if (!editImpact) return;

    // Tier 3 requires confirmation flag
    const needsConfirmation = editImpact.tier === 3;
    await performUpdate(needsConfirmation);
  };

  const handleCancelEdit = () => {
    setShowConfirmation(false);
    setEditImpact(null);
    setSubmitting(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='max-w-4xl rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-medium'>
              {t('title')}
            </DialogTitle>
            <p className='text-base font-normal'>{t('description')}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-2 gap-8 mb-8'>
              {/* Left Column */}
              <div className='space-y-6'>
                <div>
                  <h3 className='font-medium text-base mb-2'>
                    {t('titleField')}
                  </h3>
                  <InputRounded
                    className='w-full'
                    placeholder={t('titlePlaceholder')}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <h3 className='font-medium text-base mb-2'>
                    {t('descriptionField')}{' '}
                    <span className='font-light'>({t('optional')})</span>
                  </h3>
                  <Textarea
                    className='bg-neutral-50 w-full h-32 resize-none'
                    placeholder={t('descriptionPlaceholder')}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onKeyDown={e => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className='space-y-6'>
                <div>
                  <h3 className='font-medium text-base mb-2'>{t('skills')}</h3>
                  <div className='flex items-center gap-x-2 mb-3'>
                    <InputRounded
                      className='flex-1'
                      placeholder={t('skillsPlaceholder')}
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                    />
                    <Button
                      type='button'
                      variant='onboarding'
                      className='rounded-full w-12 h-12 shrink-0'
                      onClick={addSkill}
                      disabled={!skillInput.trim()}
                    >
                      <Plus className='w-4 h-4' />
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        className='bg-white text-neutral-800 border border-black rounded-full px-4 py-2 shrink-0'
                      >
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-medium text-stone-900'>
                            {skill}
                          </span>
                          <X
                            className='w-3 h-3 cursor-pointer text-stone-900 hover:text-stone-700'
                            onClick={() => removeSkill(skill)}
                          />
                        </div>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className='font-medium text-base mb-2'>
                    {t('topics')}{' '}
                    <span className='font-light'>({t('optional')})</span>
                  </h3>
                  <div className='flex items-center gap-x-2 mb-3'>
                    <InputRounded
                      className='flex-1'
                      placeholder={t('topicsPlaceholder')}
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      onKeyDown={handleTopicKeyDown}
                    />
                    <Button
                      type='button'
                      variant='onboarding'
                      className='rounded-full w-12 h-12 shrink-0'
                      onClick={addTopic}
                      disabled={!topicInput.trim()}
                    >
                      <Plus className='w-4 h-4' />
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {topics.map((topic, index) => (
                      <Badge
                        key={index}
                        className='bg-white text-neutral-800 border border-black rounded-full px-4 py-2 shrink-0'
                      >
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-medium text-stone-900'>
                            {topic}
                          </span>
                          <X
                            className='w-3 h-3 cursor-pointer text-stone-900 hover:text-stone-700'
                            onClick={() => removeTopic(topic)}
                          />
                        </div>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className='rounded-md border border-red-200 bg-red-50 p-3 mb-4'
                role='alert'
                aria-live='polite'
              >
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            )}

            {/* Save Button */}
            <Button
              type='submit'
              variant='onboarding'
              className='w-full py-6 rounded-4xl font-medium'
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <LoadingSpinner size='sm' className='mr-2' />
              ) : (
                <Pencil strokeWidth={3} className='w-4 h-4 mr-2' />
              )}
              <span className='text-sm'>
                {submitting ? t('saving') : t('save')}
              </span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AssignmentEditConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        impact={editImpact}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />
    </>
  );
}
