'use client';

import { Check, Copy, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';

interface ShareClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData?: {
    namaMataKuliah: string;
    kelas: string;
    shareToken?: string | null;
  };
}

export function ShareClassModal({
  isOpen,
  onClose,
  courseData,
}: ShareClassModalProps) {
  const t = useTranslations('dashboard.assignments.shareClass');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const shareToken = courseData?.shareToken;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = shareToken ? `${baseUrl}/join-class/${shareToken}` : '';

  const copyToClipboard = async (text: string, type: 'url' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='rounded-3xl sm:max-w-xl'
        showCloseButton={false}
      >
        <DialogHeader className='relative'>
          <DialogTitle className='text-xl font-semibold'>
            {t('title')}
          </DialogTitle>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='absolute top-0 right-0 rounded-full'
          >
            <X className='h-4 w-4' />
          </Button>
        </DialogHeader>

        <div className='space-y-4'>
          <p className='text-sm text-black'>{t('description')}</p>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('classLink')}</label>
            <div className='flex gap-2 text-gray-400'>
              <InputRounded
                value={shareUrl}
                readOnly
                className={`flex-1 transition-[background-color,border-color,transform] duration-200 ${
                  copiedUrl
                    ? 'bg-green-50 border-green-300 scale-[1.02]'
                    : 'bg-gray-50 border-gray-200 scale-100'
                }`}
                style={{
                  transitionTimingFunction:
                    'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(shareUrl, 'url')}
                className='shrink-0 rounded-full w-12 h-12 active:scale-[0.97] transition-transform duration-200'
                disabled={!shareToken}
              >
                <div className='relative w-4 h-4'>
                  <Copy
                    className={`absolute inset-0 transition-[opacity,transform,filter] duration-200 ${
                      copiedUrl
                        ? 'scale-50 opacity-0 blur-sm'
                        : 'scale-100 opacity-100 blur-0'
                    }`}
                    style={{
                      transitionTimingFunction:
                        'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  />
                  <Check
                    className={`absolute inset-0 transition-[opacity,transform,filter] duration-200 ${
                      copiedUrl
                        ? 'scale-100 opacity-100 blur-0'
                        : 'scale-50 opacity-0 blur-sm'
                    }`}
                    style={{
                      transitionTimingFunction:
                        'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  />
                </div>
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('classToken')}</label>
            <div className='flex gap-2 text-gray-400'>
              <InputRounded
                value={shareToken || ''}
                readOnly
                className={`flex-1 transition-[background-color,border-color,transform] duration-200 ${
                  copiedToken
                    ? 'bg-green-50 border-green-300 scale-[1.02]'
                    : 'bg-gray-50 border-gray-200 scale-100'
                }`}
                style={{
                  transitionTimingFunction:
                    'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(shareToken || '', 'token')}
                className='shrink-0 rounded-full w-12 h-12 active:scale-[0.97] transition-transform duration-200'
                disabled={!shareToken}
              >
                <div className='relative w-4 h-4'>
                  <Copy
                    className={`absolute inset-0 transition-[opacity,transform,filter] duration-200 ${
                      copiedToken
                        ? 'scale-50 opacity-0 blur-sm'
                        : 'scale-100 opacity-100 blur-0'
                    }`}
                    style={{
                      transitionTimingFunction:
                        'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  />
                  <Check
                    className={`absolute inset-0 transition-[opacity,transform,filter] duration-200 ${
                      copiedToken
                        ? 'scale-100 opacity-100 blur-0'
                        : 'scale-50 opacity-0 blur-sm'
                    }`}
                    style={{
                      transitionTimingFunction:
                        'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
