'use client';

import { useMemo, useState } from 'react';
import { AssignmentTeamsContent } from './assignment-teams-content';

interface TeamMemberUser {
  id: string;
  name: string | null;
  email?: string | null;
  mbtiType?: string | null;
  nim?: string | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
}

interface TeamMemberItem {
  id: string;
  user: TeamMemberUser;
}

interface Team {
  id: string;
  quality?: number | null;
  createdAt: Date;
  members: TeamMemberItem[];
  topicId?: string;
  topicName?: string;
  groupNumber?: number;
}

interface AssignmentTeamsClientProps {
  teams: Team[];
  assignmentId: string;
  courseId: string;
  topicNames: Record<string, string>;
  taskIdByIndex: string[];
  isStudent?: boolean;
  searchValue?: string;
  canManage?: boolean;
}

export function AssignmentTeamsClient({
  teams,
  assignmentId,
  courseId,
  topicNames,
  taskIdByIndex,
  isStudent = false,
  searchValue: externalSearchValue = '',
  canManage = false,
}: AssignmentTeamsClientProps) {
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const searchValue = externalSearchValue || internalSearchValue;
  const _setSearchValue = externalSearchValue
    ? () => {}
    : setInternalSearchValue;

  // Attach topic metadata to each team before filtering
  const teamsWithTopics = useMemo(() => {
    return teams.map((team, idx) => {
      const topicId = taskIdByIndex[idx] || '';
      const topicName = topicNames[topicId] || '-';
      return { ...team, topicId, topicName, groupNumber: idx + 1 };
    });
  }, [teams, taskIdByIndex, topicNames]);

  const filteredTeams = useMemo(() => {
    const trimmedSearchValue = searchValue.trim();
    if (!trimmedSearchValue) {
      return teamsWithTopics;
    }

    const searchTerm = trimmedSearchValue.toLowerCase();

    return teamsWithTopics.filter(team =>
      team.members.some(member => {
        const name = member.user.name?.toLowerCase() ?? '';
        const nim = member.user.nim?.toLowerCase() ?? '';
        return name.includes(searchTerm) || nim.includes(searchTerm);
      })
    );
  }, [teamsWithTopics, searchValue]);

  const hasSearchResults =
    searchValue.trim() === '' || filteredTeams.length > 0;

  return (
    <AssignmentTeamsContent
      teams={filteredTeams}
      assignmentId={assignmentId}
      courseId={courseId}
      isStudent={isStudent}
      searchValue={searchValue}
      hasSearchResults={hasSearchResults}
      canManage={canManage}
    />
  );
}
