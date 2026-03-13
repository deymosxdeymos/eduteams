import { HttpError } from "@/lib/utils/errors";
import { completeTeamFormationRequest, failTeamFormationRequest } from "../complete-request";
import type { BuiltTeamFormationPayload } from "../types";
import type { TeamFormationProvider } from "./provider";

function totalSkillLevel(skills: Array<{ level: number }>) {
  return skills.reduce((sum, skill) => sum + skill.level, 0);
}

function buildSnakeDraftSlots(teamSizes: number[]) {
  const remaining = [...teamSizes];
  const slots: number[] = [];
  let reverse = false;

  while (remaining.some((size) => size > 0)) {
    const indices = [...remaining.keys()];
    if (reverse) {
      indices.reverse();
    }

    for (const index of indices) {
      if (remaining[index] > 0) {
        slots.push(index);
        remaining[index] -= 1;
      }
    }

    reverse = !reverse;
  }

  return slots;
}

export function buildLocalTeamsResponse(builtPayload: BuiltTeamFormationPayload) {
  const sortedPeople = [...builtPayload.people].sort((left, right) => {
    const skillDiff = totalSkillLevel(right.skills) - totalSkillLevel(left.skills);
    if (skillDiff !== 0) {
      return skillDiff;
    }
    return left.id.localeCompare(right.id);
  });

  const teams = builtPayload.tasks.map((task) => ({
    taskId: task.id,
    quality: null,
    people: [] as Array<{ id: string; skillIds: string[] }>,
  }));
  const slots = buildSnakeDraftSlots(builtPayload.tasks.map((task) => task.teamSize));

  sortedPeople.forEach((person, index) => {
    const teamIndex = slots[index];
    const team = teams[teamIndex];
    team?.people.push({
      id: person.id,
      skillIds: person.skills.map((skill) => skill.id),
    });
  });

  return { teams };
}

export const localTeamFormationProvider: TeamFormationProvider = {
  name: "local",
  async launch(request, builtPayload) {
    try {
      await completeTeamFormationRequest(request.id, buildLocalTeamsResponse(builtPayload));

      return {
        requestId: request.id,
        provider: "local",
        mode: "sync",
        status: "COMPLETED",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete local team formation";
      await failTeamFormationRequest(request.id, `Local team formation failed: ${message}`);
      throw new HttpError(500, "Gagal menyelesaikan pembentukan kelompok lokal.");
    }
  },
};
