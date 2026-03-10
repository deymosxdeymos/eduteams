import type { TeamFormationProviderName } from '../types';
import { edu2comTeamFormationProvider } from './edu2com';
import { localTeamFormationProvider } from './local';
import type { TeamFormationProvider } from './provider';

export function getTeamFormationProvider(
  providerName: TeamFormationProviderName
): TeamFormationProvider {
  if (providerName === 'local') {
    return localTeamFormationProvider;
  }

  return edu2comTeamFormationProvider;
}
