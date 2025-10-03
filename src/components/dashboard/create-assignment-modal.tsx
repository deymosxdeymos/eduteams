'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import { Textarea } from '@/components/ui/textarea';

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export function CreateAssignmentModal({
  open,
  onOpenChange,
  classId,
}: CreateAssignmentModalProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-medium'>
            Buat Tugas Baru?
          </DialogTitle>
          <p className='text-base font-normal'>
            Silahkan isi seluruh data di bawah untuk membuat tugas baru
          </p>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-8 mb-8'>
          {/* Left Column */}
          <div className='space-y-6'>
            <div>
              <h3 className='font-medium text-base mb-2'>Nama Tugas</h3>
              <InputRounded
                className='w-full'
                placeholder='Tugas Besar'
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <h3 className='font-medium text-base mb-2'>
                Deskripsi <span className='font-light'>(opsional)</span>
              </h3>
              <Textarea
                className='bg-neutral-50 w-full h-32 resize-none'
                placeholder='Deskripsi'
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-6'>
            <div>
              <h3 className='font-medium text-base mb-2'>
                Spesifikasi Keahlian
              </h3>
              <div className='flex items-center gap-x-2 mb-3'>
                <InputRounded
                  className='flex-1'
                  placeholder='Keahlian'
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <Button
                  variant='onboarding'
                  className='rounded-full w-12 h-12 flex-shrink-0'
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
                    className='bg-white text-neutral-800 border border-black rounded-full px-4 py-2 flex-shrink-0'
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
                Preferensi Topik <span className='font-light'>(opsional)</span>
              </h3>
              <div className='flex items-center gap-x-2 mb-3'>
                <InputRounded
                  className='flex-1'
                  placeholder='Preferensi Topik'
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                />
                <Button
                  variant='onboarding'
                  className='rounded-full w-12 h-12 flex-shrink-0'
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
                    className='bg-white text-neutral-800 border border-black rounded-full px-4 py-2 flex-shrink-0'
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
        {error && <p className='text-red-600 text-sm mb-2'>{error}</p>}

        {/* Create Button */}
        <Button
          variant='onboarding'
          className='w-full py-6 rounded-4xl font-medium'
          disabled={submitting || !title.trim()}
          onClick={async () => {
            try {
              setSubmitting(true);
              setError(null);
              const res = await fetch(`/api/courses/${classId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: title.trim(),
                  description: description.trim() || undefined,
                  skills,
                  topics,
                }),
              });
              const data = await res.json();
              if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Gagal membuat tugas');
              }
              // Reset form and close
              setTitle('');
              setDescription('');
              setSkills([]);
              setTopics([]);
              onOpenChange(false);
              // Let caller refresh via SWR (handled in parent by mutate)
              const ev = new CustomEvent('assignment:created', {
                detail: { classId },
              });
              window.dispatchEvent(ev);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Plus strokeWidth={3} className='w-4 h-4 mr-2' />
          <span className='text-sm'>
            {submitting ? 'Membuat…' : 'Buat Tugas'}
          </span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
