'use client';

import { Copy, X } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ShareClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
}

interface ShareTokenData {
  token: string;
  shareUrl: string;
  courseName: string;
  className: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function ShareClassModal({
  isOpen,
  onClose,
  classId,
}: ShareClassModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const { data, error } = useSWR(
    isOpen ? `/api/courses/${classId}/share-token` : null,
    fetcher
  );

  const shareData: ShareTokenData = data?.data;

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

  if (error) {
    console.error('Failed to load share token:', error);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='rounded-3xl sm:max-w-xl'
        showCloseButton={false}
      >
        <DialogHeader className='relative'>
          <DialogTitle className='text-xl font-semibold'>
            Bagikan Kelas
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
          <p className='text-sm text-black'>
            Silakan salin dan bagikan tautan atau token berikut kepada mahasiswa
            untuk mengakses kelas ini. Pastikan mahasiswa hanya menerima
            informasi ini dari sumber resmi.
          </p>

          {shareData ? (
            <>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tautan Kelas</label>
                <div className='flex gap-2 text-gray-400'>
                  <InputRounded
                    value={shareData.shareUrl}
                    readOnly
                    className='flex-1 bg-gray-50'
                  />
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => copyToClipboard(shareData.shareUrl, 'url')}
                    className='shrink-0 rounded-full w-12 h-12'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
                {copiedUrl && (
                  <p className='text-xs text-green-600'>
                    Tautan berhasil disalin!
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Token Kelas</label>
                <div className='flex gap-2 text-gray-400'>
                  <InputRounded
                    value={shareData.token}
                    readOnly
                    className='flex-1 bg-gray-50'
                  />
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => copyToClipboard(shareData.token, 'token')}
                    className='shrink-0 rounded-full w-12 h-12'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
                {copiedToken && (
                  <p className='text-xs text-green-600'>
                    Token berhasil disalin!
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className='text-center py-4'>
              <LoadingSpinner size='md' color='#3b82f6' className='mx-auto' />
              <p className='text-sm text-gray-500 mt-2'>Memuat data...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
