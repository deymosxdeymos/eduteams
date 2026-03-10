import type {
  BuiltTeamFormationPayload,
  PersistedTeamFormationRequest,
  TeamFormationLaunchResult,
  TeamFormationProviderName,
} from '../types';

export interface TeamFormationProvider {
  readonly name: TeamFormationProviderName;
  launch(
    request: PersistedTeamFormationRequest,
    builtPayload: BuiltTeamFormationPayload
  ): Promise<TeamFormationLaunchResult>;
}
