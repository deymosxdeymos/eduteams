import { describe, expect, it } from 'bun:test';
import {
  canAccessAdminFeatures,
  canAccessDashboard,
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
  canAccessOnboarding,
  canAccessRole,
  canModifyUser,
  canViewUserProfile,
  getNextOnboardingStep,
  getRedirectPath,
  isCompleteProfile,
  needsDataDiri,
  needsKepribadianTest,
  needsOnboarding,
  needsRoleSelection,
} from '../authorization';
import type { ExtendedUser } from '../types';

const baseUser: ExtendedUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: false,
  image: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  isOnboarded: false,
  hasSeenWelcomeSplash: false,
  role: 'mahasiswa',
  nim: '123456789',
  onboardingData: null,
  onboardingStep: null,
  mbtiType: null,
  ei: null,
  sn: null,
  tf: null,
  pj: null,
  gender: null,
  personalityData: null,
  personalitySessions: [],
  accounts: [],
  personPreferences: [],
  preferredBy: [],
  personSkills: [],
  sessions: [],
  taskPreferences: [],
  ownedTeamRequests: [],
  teamMemberships: [],
  courses: [],
  courseEnrollments: [],
  dosenTokenUsages: [],
  createdAssignments: [],
  assignmentSubmissions: [],
  AssignmentTopicPreference: [],
};

// Mock user data for testing
const createMockUser = (
  overrides: Partial<ExtendedUser> = {}
): ExtendedUser => ({
  ...structuredClone(baseUser),
  ...overrides,
});

describe('Authorization Functions', () => {
  describe('canAccessDashboard', () => {
    it('returns true for onboarded user with role', () => {
      const user = createMockUser({ isOnboarded: true, role: 'mahasiswa' });
      expect(canAccessDashboard(user)).toBe(true);
    });

    it('returns false for non-onboarded user', () => {
      const user = createMockUser({ isOnboarded: false, role: 'mahasiswa' });
      expect(canAccessDashboard(user)).toBe(false);
    });

    it('returns false for user without role', () => {
      const user = createMockUser({ isOnboarded: true, role: undefined });
      expect(canAccessDashboard(user)).toBe(false);
    });

    it('returns false for user without role and not onboarded', () => {
      const user = createMockUser({ isOnboarded: false, role: undefined });
      expect(canAccessDashboard(user)).toBe(false);
    });
  });

  describe('canAccessOnboarding', () => {
    it('returns true for non-onboarded user', () => {
      const user = createMockUser({ isOnboarded: false });
      expect(canAccessOnboarding(user)).toBe(true);
    });

    it('returns false for onboarded user', () => {
      const user = createMockUser({ isOnboarded: true });
      expect(canAccessOnboarding(user)).toBe(false);
    });
  });

  describe('canAccessRole', () => {
    it('returns true when user has matching role', () => {
      const user = createMockUser({ role: 'mahasiswa' });
      expect(canAccessRole(user, 'mahasiswa')).toBe(true);
    });

    it('returns false when user has different role', () => {
      const user = createMockUser({ role: 'mahasiswa' });
      expect(canAccessRole(user, 'dosen')).toBe(false);
    });

    it('returns false when user has no role', () => {
      const user = createMockUser({ role: undefined });
      expect(canAccessRole(user, 'mahasiswa')).toBe(false);
    });
  });

  describe('canAccessMahasiswaFeatures', () => {
    it('returns true for onboarded mahasiswa', () => {
      const user = createMockUser({ role: 'mahasiswa', isOnboarded: true });
      expect(canAccessMahasiswaFeatures(user)).toBe(true);
    });

    it('returns false for non-onboarded mahasiswa', () => {
      const user = createMockUser({ role: 'mahasiswa', isOnboarded: false });
      expect(canAccessMahasiswaFeatures(user)).toBe(false);
    });

    it('returns false for dosen', () => {
      const user = createMockUser({ role: 'dosen', isOnboarded: true });
      expect(canAccessMahasiswaFeatures(user)).toBe(false);
    });

    it('returns false for admin', () => {
      const user = createMockUser({ role: 'admin', isOnboarded: true });
      expect(canAccessMahasiswaFeatures(user)).toBe(false);
    });
  });

  describe('canAccessDosenFeatures', () => {
    it('returns true for onboarded dosen', () => {
      const user = createMockUser({ role: 'dosen', isOnboarded: true });
      expect(canAccessDosenFeatures(user)).toBe(true);
    });

    it('returns false for non-onboarded dosen', () => {
      const user = createMockUser({ role: 'dosen', isOnboarded: false });
      expect(canAccessDosenFeatures(user)).toBe(false);
    });

    it('returns false for mahasiswa', () => {
      const user = createMockUser({ role: 'mahasiswa', isOnboarded: true });
      expect(canAccessDosenFeatures(user)).toBe(false);
    });

    it('returns false for admin', () => {
      const user = createMockUser({ role: 'admin', isOnboarded: true });
      expect(canAccessDosenFeatures(user)).toBe(false);
    });
  });

  describe('canAccessAdminFeatures', () => {
    it('returns true for admin user', () => {
      const user = createMockUser({ role: 'admin' });
      expect(canAccessAdminFeatures(user)).toBe(true);
    });

    it('returns false for mahasiswa', () => {
      const user = createMockUser({ role: 'mahasiswa' });
      expect(canAccessAdminFeatures(user)).toBe(false);
    });

    it('returns false for dosen', () => {
      const user = createMockUser({ role: 'dosen' });
      expect(canAccessAdminFeatures(user)).toBe(false);
    });

    it('returns false for user without role', () => {
      const user = createMockUser({ role: undefined });
      expect(canAccessAdminFeatures(user)).toBe(false);
    });
  });

  describe('canModifyUser', () => {
    it('returns true when user modifies their own profile', () => {
      const user = createMockUser({ id: 'user-123' });
      expect(canModifyUser(user, 'user-123')).toBe(true);
    });

    it('returns true when admin modifies another user', () => {
      const admin = createMockUser({ id: 'admin-123', role: 'admin' });
      expect(canModifyUser(admin, 'user-456')).toBe(true);
    });

    it('returns false when non-admin tries to modify another user', () => {
      const user = createMockUser({ id: 'user-123', role: 'mahasiswa' });
      expect(canModifyUser(user, 'user-456')).toBe(false);
    });
  });

  describe('canViewUserProfile', () => {
    it('returns true when user views their own profile', () => {
      const user = createMockUser({ id: 'user-123' });
      expect(canViewUserProfile(user, 'user-123')).toBe(true);
    });

    it('returns true when admin views another user profile', () => {
      const admin = createMockUser({ id: 'admin-123', role: 'admin' });
      expect(canViewUserProfile(admin, 'user-456')).toBe(true);
    });

    it('returns true when dosen views another user profile', () => {
      const dosen = createMockUser({ id: 'dosen-123', role: 'dosen' });
      expect(canViewUserProfile(dosen, 'user-456')).toBe(true);
    });

    it('returns false when mahasiswa tries to view another user profile', () => {
      const mahasiswa = createMockUser({ id: 'user-123', role: 'mahasiswa' });
      expect(canViewUserProfile(mahasiswa, 'user-456')).toBe(false);
    });
  });

  describe('isCompleteProfile', () => {
    it('returns true for user with all required fields', () => {
      const user = createMockUser({
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa',
        isOnboarded: true,
      });
      expect(isCompleteProfile(user)).toBe(true);
    });

    it('returns false when name is missing', () => {
      const user = createMockUser({ name: undefined });
      expect(isCompleteProfile(user)).toBe(false);
    });

    it('returns false when email is missing', () => {
      const user = createMockUser({ email: undefined });
      expect(isCompleteProfile(user)).toBe(false);
    });

    it('returns false when role is missing', () => {
      const user = createMockUser({ role: undefined });
      expect(isCompleteProfile(user)).toBe(false);
    });

    it('returns false when not onboarded', () => {
      const user = createMockUser({ isOnboarded: false });
      expect(isCompleteProfile(user)).toBe(false);
    });
  });

  describe('needsOnboarding', () => {
    it('returns true for non-onboarded user', () => {
      const user = createMockUser({ isOnboarded: false });
      expect(needsOnboarding(user)).toBe(true);
    });

    it('returns false for onboarded user', () => {
      const user = createMockUser({ isOnboarded: true });
      expect(needsOnboarding(user)).toBe(false);
    });
  });

  describe('needsRoleSelection', () => {
    it('returns true when user has no role', () => {
      const user = createMockUser({ role: undefined });
      expect(needsRoleSelection(user)).toBe(true);
    });

    it('returns false when user has role', () => {
      const user = createMockUser({ role: 'mahasiswa' });
      expect(needsRoleSelection(user)).toBe(false);
    });
  });

  describe('needsDataDiri', () => {
    it('returns true for mahasiswa without nim', () => {
      const user = createMockUser({ role: 'mahasiswa', nim: undefined });
      expect(needsDataDiri(user)).toBe(true);
    });

    it('returns true for dosen without name', () => {
      const user = createMockUser({ role: 'dosen', name: undefined, gender: 'MALE' });
      expect(needsDataDiri(user)).toBe(true);
    });

    it('returns true for dosen without gender', () => {
      const user = createMockUser({ role: 'dosen', name: 'Test', gender: null });
      expect(needsDataDiri(user)).toBe(true);
    });

    it('returns false for mahasiswa with nim', () => {
      const user = createMockUser({ role: 'mahasiswa', nim: '123456789' });
      expect(needsDataDiri(user)).toBe(false);
    });

    it('returns false for dosen with name and gender', () => {
      const user = createMockUser({ role: 'dosen', name: 'Test', gender: 'MALE' });
      expect(needsDataDiri(user)).toBe(false);
    });

    it('returns false for admin (no data-diri required)', () => {
      const user = createMockUser({ role: 'admin', nim: undefined });
      expect(needsDataDiri(user)).toBe(false);
    });

    it('returns false for user without role', () => {
      const user = createMockUser({ role: undefined, nim: undefined });
      expect(needsDataDiri(user)).toBe(false);
    });
  });

  describe('needsKepribadianTest', () => {
    it('returns true for mahasiswa who is not onboarded', () => {
      const user = createMockUser({ role: 'mahasiswa', isOnboarded: false });
      expect(needsKepribadianTest(user)).toBe(true);
    });

    it('returns false for onboarded mahasiswa', () => {
      const user = createMockUser({ role: 'mahasiswa', isOnboarded: true });
      expect(needsKepribadianTest(user)).toBe(false);
    });

    it('returns false for dosen', () => {
      const user = createMockUser({ role: 'dosen', isOnboarded: false });
      expect(needsKepribadianTest(user)).toBe(false);
    });

    it('returns false for admin', () => {
      const user = createMockUser({ role: 'admin', isOnboarded: false });
      expect(needsKepribadianTest(user)).toBe(false);
    });
  });

  describe('getNextOnboardingStep', () => {
    it('returns resume page for user without role', () => {
      const user = createMockUser({ role: undefined });
      expect(getNextOnboardingStep(user)).toBe('/onboarding/resume');
    });

    it('returns data-diri for mahasiswa without nim', () => {
      const user = createMockUser({ role: 'mahasiswa', nim: undefined });
      expect(getNextOnboardingStep(user)).toBe(
        '/onboarding/data-diri/mahasiswa'
      );
    });

    it('returns data-diri for dosen without name or gender', () => {
      const user = createMockUser({ role: 'dosen', name: undefined, gender: null });
      expect(getNextOnboardingStep(user)).toBe('/onboarding/data-diri/dosen');
    });

    it('returns kepribadian test for mahasiswa with nim but not onboarded', () => {
      const user = createMockUser({
        role: 'mahasiswa',
        nim: '123456789',
        isOnboarded: false,
      });
      expect(getNextOnboardingStep(user)).toBe('/onboarding/kepribadian');
    });

    it('returns resume for dosen with name and gender but not onboarded', () => {
      const user = createMockUser({
        role: 'dosen',
        name: 'Test',
        gender: 'MALE',
        isOnboarded: false,
      });
      expect(getNextOnboardingStep(user)).toBe('/onboarding/resume');
    });

    it('returns null for fully onboarded user', () => {
      const user = createMockUser({
        role: 'mahasiswa',
        nim: '123456789',
        isOnboarded: true,
      });
      expect(getNextOnboardingStep(user)).toBe(null);
    });

    it('returns resume for admin user', () => {
      const user = createMockUser({
        role: 'admin',
        nim: undefined,
        isOnboarded: false,
      });
      expect(getNextOnboardingStep(user)).toBe('/onboarding/resume');
    });
  });

  describe('getRedirectPath', () => {
    it('returns next onboarding step when available', () => {
      const user = createMockUser({ role: undefined });
      expect(getRedirectPath(user)).toBe('/onboarding/resume');
    });

    it('returns dashboard when no next step', () => {
      const user = createMockUser({
        role: 'mahasiswa',
        nim: '123456789',
        isOnboarded: true,
      });
      expect(getRedirectPath(user)).toBe('/dashboard');
    });
  });
});
