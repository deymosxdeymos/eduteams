import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test';
import type { DosenCourseSummary } from '@/lib/dashboard/courses';
import type { DashboardStatistics } from '@/lib/dashboard/statistics';

const refreshMock = mock(() => {});
let statisticsProps: any;
let classGridProps: any;
let searchInputProps: any;
let Content: (props: { statistics: DashboardStatistics; courses: DosenCourseSummary[] }) => JSX.Element;
let restoreFns: Array<() => void> = [];

const baseStatistics: DashboardStatistics = {
  totalAssignments: 3,
  totalTeams: 6,
  avgTeamQuality: 0.45,
  qualitySummary: {
    min: 0.12,
    max: 0.9,
    mean: 0.54,
    n: 10,
  },
};

const buildCourse = (overrides: Partial<DosenCourseSummary> = {}): DosenCourseSummary => ({
  id: 'course-1',
  namaMataKuliah: 'Algoritma',
  kelas: 'RA',
  tahunAwalPeriode: 2024,
  tahunAkhirPeriode: 2025,
  periode: 'ganjil',
  dosenId: 'teacher-1',
  shareToken: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  studentCount: 35,
  dosen: {
    id: 'teacher-1',
    name: 'Teacher One',
    email: 'teacher@example.com',
  },
  ...overrides,
});

beforeAll(async () => {
  const navigationModule = await import('next/navigation');
  const originalUseRouter = navigationModule.useRouter;
  const useRouterSpy = spyOn(navigationModule, 'useRouter');
  useRouterSpy.mockImplementation(() => {
    const router = originalUseRouter();
    return {
      ...router,
      refresh: refreshMock,
    };
  });
  restoreFns.push(() => useRouterSpy.mockRestore());

  const statisticsModule = await import('@/components/dashboard/statistics-cards');
  const originalStatisticsCards = statisticsModule.StatisticsCards;
  const statisticsSpy = spyOn(statisticsModule, 'StatisticsCards');
  statisticsSpy.mockImplementation(props => {
    statisticsProps = props;
    return originalStatisticsCards(props);
  });
  restoreFns.push(() => statisticsSpy.mockRestore());

  const classGridModule = await import('@/components/dashboard/class-grid');
  const originalClassGrid = classGridModule.ClassGrid;
  const classGridSpy = spyOn(classGridModule, 'ClassGrid');
  classGridSpy.mockImplementation(props => {
    classGridProps = props;
    return originalClassGrid(props);
  });
  restoreFns.push(() => classGridSpy.mockRestore());

  const searchInputModule = await import('@/components/dashboard/search-input');
  const originalSearchInput = searchInputModule.SearchInput;
  const searchInputSpy = spyOn(searchInputModule, 'SearchInput');
  searchInputSpy.mockImplementation(props => {
    searchInputProps = props;
    return originalSearchInput(props);
  });
  restoreFns.push(() => searchInputSpy.mockRestore());

  ({ default: Content } = await import('@/components/dashboard/content'));
});

afterAll(() => {
  for (const restore of restoreFns) {
    restore();
  }
  restoreFns = [];
});

beforeEach(() => {
  statisticsProps = undefined;
  classGridProps = undefined;
  searchInputProps = undefined;
  refreshMock.mockReset();
});

describe('Dashboard Content', () => {
  it('renders statistics, search input, and class grid when courses exist', () => {
    const courses = [
      buildCourse({ id: 'course-1', namaMataKuliah: 'Algoritma' }),
      buildCourse({ id: 'course-2', namaMataKuliah: 'Basis Data', kelas: 'RB' }),
    ];

    render(<Content statistics={baseStatistics} courses={courses} />);

    expect(statisticsProps.statistics).toBe(baseStatistics);
    expect(searchInputProps.searchValue).toBe('');
    expect(typeof searchInputProps.onSearchChange).toBe('function');
    expect(classGridProps.classes).toHaveLength(2);
    expect(classGridProps.showNoResults).toBe(false);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Algoritma')).toBeInTheDocument();
    expect(screen.getByText('Basis Data')).toBeInTheDocument();
  });

  it('renders empty state when there are no courses', () => {
    render(<Content statistics={baseStatistics} courses={[]} />);

    expect(
      screen.getByText("You haven't created any classes yet")
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create a class to start team formation')
    ).toBeInTheDocument();
    expect(searchInputProps).toBeUndefined();
  });

  it('filters classes based on search input', async () => {
    const courses = [
      buildCourse({ id: 'course-1', namaMataKuliah: 'Algoritma' }),
      buildCourse({ id: 'course-2', namaMataKuliah: 'Statistika', kelas: 'RC' }),
    ];

    render(<Content statistics={baseStatistics} courses={courses} />);

    expect(classGridProps.classes).toHaveLength(2);

    await act(async () => {
      searchInputProps.onSearchChange('stat');
    });

    expect(classGridProps.classes).toHaveLength(1);
    expect(classGridProps.classes[0]?.title).toBe('Statistika');
    expect(classGridProps.showNoResults).toBe(false);

    await act(async () => {
      searchInputProps.onSearchChange('zzz');
    });

    expect(classGridProps.classes).toHaveLength(0);
    expect(classGridProps.showNoResults).toBe(true);
    expect(screen.getByText('Tidak ada kelas yang ditemukan')).toBeInTheDocument();
  });

  it('updates the class list when a new course is created', async () => {
    const courses = [buildCourse({ id: 'existing' })];

    render(<Content statistics={baseStatistics} courses={courses} />);

    const newCoursePayload = {
      id: 'new-course',
      namaMataKuliah: 'Pemrograman',
      kelas: 'RC',
      tahunAwalPeriode: 2025,
      tahunAkhirPeriode: 2026,
      enrollments: [{}, {}],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      dosen: {
        id: 'teacher-2',
        name: 'Teacher Two',
        email: 'teacher2@example.com',
      },
    };

    await act(async () => {
      searchInputProps.onClassCreated?.(newCoursePayload);
    });

    expect(classGridProps.classes[0]?.id).toBe('new-course');
    expect(classGridProps.classes[0]?.studentCount).toBe(2);
    expect(classGridProps.classes[0]?.classCode).toBe('RC');
    expect(refreshMock.mock.calls.length).toBe(1);
  });

  it('prefers refreshed server data once an optimistic course is loaded from props', async () => {
    const courses = [buildCourse({ id: 'existing' })];
    const { rerender } = render(
      <Content statistics={baseStatistics} courses={courses} />
    );

    await act(async () => {
      searchInputProps.onClassCreated?.({
        id: 'new-course',
        namaMataKuliah: 'Pemrograman',
        kelas: 'RC',
        studentCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        dosen: {
          id: 'teacher-2',
          name: 'Teacher Two',
          email: 'teacher2@example.com',
        },
      });
    });

    expect(classGridProps.classes[0]?.id).toBe('new-course');
    expect(classGridProps.classes[0]?.studentCount).toBe(0);

    await act(async () => {
      rerender(
        <Content
          statistics={baseStatistics}
          courses={[
            buildCourse({ id: 'existing' }),
            buildCourse({
              id: 'new-course',
              namaMataKuliah: 'Pemrograman',
              kelas: 'RC',
              studentCount: 3,
              dosenId: 'teacher-2',
              dosen: {
                id: 'teacher-2',
                name: 'Teacher Two',
                email: 'teacher2@example.com',
              },
            }),
          ]}
        />
      );
    });

    expect(classGridProps.classes).toHaveLength(2);
    expect(classGridProps.classes[0]?.id).toBe('existing');
    expect(classGridProps.classes[1]?.id).toBe('new-course');
    expect(classGridProps.classes[1]?.studentCount).toBe(3);
    expect(refreshMock.mock.calls.length).toBe(1);
  });

  it('ignores invalid payloads but still refreshes the router', async () => {
    const courses = [buildCourse({ id: 'course-1', namaMataKuliah: 'Algoritma' })];

    render(<Content statistics={baseStatistics} courses={courses} />);

    await act(async () => {
      searchInputProps.onClassCreated?.({ namaMataKuliah: 'Invalid' });
    });

    expect(classGridProps.classes).toHaveLength(1);
    expect(classGridProps.classes[0]?.title).toBe('Algoritma');
    expect(refreshMock.mock.calls.length).toBe(1);
  });

  it('syncs course list when courses prop changes', async () => {
    const { rerender } = render(
      <Content statistics={baseStatistics} courses={[buildCourse({ id: 'course-1' })]} />
    );

    expect(classGridProps.classes).toHaveLength(1);

    const updatedCourses = [
      buildCourse({ id: 'course-2', namaMataKuliah: 'Data Mining', kelas: 'RD' }),
    ];

    await act(async () => {
      rerender(<Content statistics={baseStatistics} courses={updatedCourses} />);
    });

    expect(classGridProps.classes).toHaveLength(1);
    expect(classGridProps.classes[0]?.title).toBe('Data Mining');
  });
});
