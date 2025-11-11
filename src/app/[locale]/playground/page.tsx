'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState } from 'react';
import { MBTIOverviewLayout } from '@/components/dashboard/mbti-overview-layout';
import { StudentProfileContent } from '@/components/dashboard/student-profile-content';
import { TeamDetailModalContent } from '@/components/dashboard/team-detail-modal-content';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ExtendedUser } from '@/lib/types';

// Dummy student data
// Note: ei, sn, tf, pj scores are normalized values between -1 and 1
// Positive values indicate: E, N, F, P
// Negative values indicate: I, S, T, J
const dummyStudent: ExtendedUser = {
  id: 'dummy-student-1',
  name: 'Budi Santoso',
  email: 'budi.santoso@example.com',
  role: null,
  nim: '12345678',
  isOnboarded: true,
  onboardingStep: null,
  mbtiType: 'ESFJ',
  ei: 0.34, // E (67% = 0.34 normalized)
  sn: -0.52, // S (76% = -0.52 normalized)
  tf: 0.48, // F (74% = 0.48 normalized)
  pj: -0.6, // J (80% = -0.60 normalized)
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
  emailVerified: true,
  gender: 'MALE',
  hasSeenWelcomeSplash: true,
  onboardingData: null,
  personalityData: null,
};

// Dummy team data for team detail modal
const dummyTeamMembers = [
  {
    ...dummyStudent,
    id: 'member-1',
    name: 'Rafif Aditya',
    nim: '12114090',
    mbtiType: 'INTJ' as const,
    ei: -0.4,
    sn: 0.52,
    tf: -0.48,
    pj: -0.6,
    topSkills: ['Quality Assurance', 'Project Manager'],
    preferredTopics: ['Topik 1', 'Topik 2'],
  },
  {
    ...dummyStudent,
    id: 'member-2',
    name: 'Siti Nurhaliza',
    nim: '12114091',
    gender: 'FEMALE' as const,
    mbtiType: 'ENFP' as const,
    ei: 0.6,
    sn: 0.3,
    tf: 0.5,
    pj: 0.4,
    topSkills: ['UI/UX Design', 'Frontend Development'],
    preferredTopics: ['Kesehatan', 'Pendidikan'],
  },
  {
    ...dummyStudent,
    id: 'member-3',
    name: 'Ahmad Pratama',
    nim: '12114092',
    mbtiType: 'ISTJ' as const,
    ei: -0.5,
    sn: -0.6,
    tf: -0.3,
    pj: -0.7,
    topSkills: ['Backend Development', 'Database Design'],
    preferredTopics: ['Teknologi', 'Bisnis'],
  },
];

export default function PlaygroundPage() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'profile' | 'mbti'>(
    'profile'
  );
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  return (
    <NuqsAdapter>
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-8'>
        <div className='max-w-4xl mx-auto text-center space-y-4'>
          <h1 className='text-4xl font-bold text-gray-900'>
            The playground is empty. The swings are still. The slides gather
            dust.
          </h1>
        </div>

        {/* Student Profile Modal */}
        <Dialog
          open={isStudentModalOpen}
          onOpenChange={open => {
            setIsStudentModalOpen(open);
            if (!open) {
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
                ? 'Student Profile'
                : 'MBTI Distribution'}
            </DialogTitle>
            {modalContent === 'profile' ? (
              <StudentProfileContent
                student={dummyStudent}
                canManage={true}
                onRemoveStudent={() => {
                  console.log('Remove student clicked');
                  alert('Remove student action triggered!');
                }}
                onClose={() => setIsStudentModalOpen(false)}
                onShowMBTI={() => setModalContent('mbti')}
                isModal
              />
            ) : (
              <div className='overflow-hidden'>
                <MBTIOverviewLayout
                  user={dummyStudent}
                  isModal
                  isCompact
                  onRequestClose={() => setModalContent('profile')}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Team Detail Modal */}
        <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
          <DialogContent
            className='w-[90vw] max-w-[1400px] rounded-3xl p-0 border-0 gap-0'
            showCloseButton={false}
          >
            <DialogTitle className='sr-only'>Team Detail</DialogTitle>
            <TeamDetailModalContent
              teamId='team-1'
              groupNumber={1}
              taskName='Tugas Kelompok 1'
              className='Pemrograman Web A'
              qualityScore={0.8}
              topicName='Kesehatan'
              members={dummyTeamMembers}
              onClose={() => setIsTeamModalOpen(false)}
              onPreviousTeam={() => {
                setCurrentTeamIndex(prev => Math.max(0, prev - 1));
              }}
              onNextTeam={() => {
                setCurrentTeamIndex(prev => prev + 1);
              }}
              hasPrevious={currentTeamIndex > 0}
              hasNext={currentTeamIndex < 2}
            />
          </DialogContent>
        </Dialog>
      </div>
    </NuqsAdapter>
  );
}
