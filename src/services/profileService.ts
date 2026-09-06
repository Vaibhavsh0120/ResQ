import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockProfile } from '@/data/mockProfile';
import { ProfileData } from '@/types';

export async function fetchProfile(): Promise<ProfileData> {
  if (config.useMockData) {
    return mockDelay(mockProfile);
  }
  return apiRequest<ProfileData>(config.endpoints.profile);
}

export async function updateProfile(profile: ProfileData): Promise<ProfileData> {
  if (config.useMockData) {
    return mockDelay(profile);
  }
  return apiRequest<ProfileData>(config.endpoints.profile, {
    method: 'PUT',
    body: profile,
  });
}
