'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { courseCreateSchema, type CourseCreateInput } from '@/lib/validations/course';
import type { Course } from '@/lib/types';

interface CreateClassModalProps {
  onClassCreated?: (course: Course) => void;
}

export default function CreateClassModal({ onClassCreated }: CreateClassModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<CourseCreateInput>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      namaMataKuliah: '',
      kelas: undefined,
      tahunAwalPeriode: new Date().getFullYear(),
      tahunAkhirPeriode: new Date().getFullYear() + 1,
      periode: undefined,
    },
  });

  const onSubmit = (values: CourseCreateInput) => {
    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);

        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create class');
        }

        const result = await response.json();
        setSuccess(true);
        
        // Call callback if provided
        if (onClassCreated) {
          onClassCreated(result.data);
        }

        // Reset form and close modal after short delay
        setTimeout(() => {
          form.reset();
          setOpen(false);
          setSuccess(false);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        form.reset();
        setError(null);
        setSuccess(false);
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="onboarding" className="rounded-full w-48 py-7">
          <Plus strokeWidth={3} className="text-white" />
          <p className="text-white font-semibold text-base leading-tight">
            Buat Kelas Baru
          </p>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Buat Kelas Baru</DialogTitle>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Kelas berhasil dibuat!</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="namaMataKuliah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mata Kuliah</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan nama mata kuliah"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RA">RA</SelectItem>
                        <SelectItem value="RB">RB</SelectItem>
                        <SelectItem value="RC">RC</SelectItem>
                        <SelectItem value="RD">RD</SelectItem>
                        <SelectItem value="RE">RE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tahunAwalPeriode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Awal</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tahun" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tahunAkhirPeriode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Akhir</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tahun" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="periode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih periode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ganjil">Ganjil</SelectItem>
                        <SelectItem value="genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending ? 'Membuat...' : 'Buat Kelas'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
