'use client';

import { Search, SortDesc } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { GroupCard } from '@/components/dashboard/group-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GroupListItem, SortKey } from '@/types/manage';

interface StudentManageShellProps {
  items: GroupListItem[];
  isLoading?: boolean;
}

const tabKeys = ['kelompok-saya', 'menunggu', 'belum-dikerjakan'] as const;
type TabKey = (typeof tabKeys)[number];

function getTabLabel(key: TabKey): string {
  switch (key) {
    case 'kelompok-saya':
      return 'Kelompok Saya';
    case 'menunggu':
      return 'Menunggu Pembagian';
    case 'belum-dikerjakan':
      return 'Belum Dikerjakan';
  }
}

function filterAndSort(
  items: GroupListItem[],
  activeTab: TabKey,
  sortKey: SortKey,
  query: string
): GroupListItem[] {
  let filtered = items.filter(item => {
    switch (activeTab) {
      case 'kelompok-saya':
        return item.status === 'my-group';
      case 'menunggu':
        return item.status === 'waiting';
      case 'belum-dikerjakan':
        return item.status === 'not-started';
      default:
        return false;
    }
  });

  if (query) {
    filtered = filtered.filter(
      item =>
        item.taskTitle.toLowerCase().includes(query.toLowerCase()) ||
        item.className.toLowerCase().includes(query.toLowerCase())
    );
  }

  return filtered.sort((a, b) => {
    if (sortKey === 'name') {
      return a.taskTitle.localeCompare(b.taskTitle);
    }
    return a.academicYear.localeCompare(b.academicYear);
  });
}

export function StudentManageShell({
  items,
  isLoading,
}: StudentManageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = (searchParams.get('tab') as TabKey) || 'kelompok-saya';
  const sort = (searchParams.get('sort') as SortKey) || 'name';
  const query = searchParams.get('q') || '';

  const updateUrl = (updates: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    });
    router.push(`${pathname}?${sp.toString()}`);
  };

  const handleTabChange = (value: string) => {
    updateUrl({ tab: value });
  };

  const handleSortChange = (value: SortKey) => {
    updateUrl({ sort: value });
  };

  const handleSearchChange = (value: string) => {
    updateUrl({ q: value });
  };

  const filtered = filterAndSort(items, tab, sort, query);

  // Calculate count of items with 'not-started' status for badge
  const notStartedCount = items.filter(
    item => item.status === 'not-started'
  ).length;

  return (
    <div className='flex flex-col h-full'>
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className='flex-1 flex flex-col'
      >
        <TabsList className='w-full bg-transparent rounded-none p-0 shadow-none text-neutral-700 justify-between'>
          {tabKeys.map(key => (
            <TabsTrigger
              key={key}
              value={key}
              className='group flex-1 bg-transparent hover:bg-transparent border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none text-neutral-700 hover:text-neutral-900 transition-colors flex flex-col items-center gap-1 data-[state=active]:text-blue-600'
            >
              <span className='flex items-center gap-2 group-hover:underline'>
                {getTabLabel(key)}
                {key === 'belum-dikerjakan' && notStartedCount > 0 && (
                  <Badge
                    variant='destructive'
                    className='h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]'
                  >
                    {notStartedCount}
                  </Badge>
                )}
              </span>
              <span className='hidden group-data-[state=active]:block bg-blue-500 h-3 w-full rounded-full' />
            </TabsTrigger>
          ))}
        </TabsList>

        <div className='flex flex-col sm:flex-row gap-4 mt-6 mb-6'>
          <div className='flex-1 sm:flex-initial'>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger
                size='sm'
                className='min-w-[180px] rounded-full bg-accent/30 gap-2 !h-11'
              >
                <SortDesc className='size-4 text-muted-foreground' />
                <SelectValue placeholder='Urutkan' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='name'>Nama</SelectItem>
                <SelectItem value='year'>Tahun Akademik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='relative flex-1'>
            <Input
              type='search'
              value={query}
              onChange={event => handleSearchChange(event.target.value)}
              placeholder='Mencari kelas...'
              className='h-11 rounded-full pl-4 pr-11'
            />
            <Search className='absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          </div>
        </div>

        {tabKeys.map(key => {
          // Use multi-column grid for "kelompok-saya" tab, single column for others
          const gridClass =
            key === 'kelompok-saya'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'grid grid-cols-1 gap-4';

          return (
            <TabsContent key={key} value={key} className='flex-1 mt-0'>
              {isLoading ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className='h-32 bg-muted rounded-lg animate-pulse'
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-64 text-center'>
                  <p className='text-muted-foreground'>
                    Tidak ada kelas ditemukan.
                  </p>
                </div>
              ) : (
                <div className={gridClass}>
                  {filtered.map(item => (
                    <GroupCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
