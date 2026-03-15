'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings } from '@/types';

export interface Profile {
  id: string;
  name: string;
  settings: UserSettings;
  foodPreferences: { id: string; rating: string }[];
}

interface ProfileStore {
  profiles: Profile[];
  activeProfileId: string;
  addProfile: (name: string) => void;
  switchProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  updateActiveProfileSettings: (settings: Partial<UserSettings>) => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  firstName: '',
  language: 'fr',
  rules: {
    antiRedundancy: true,
    starchWarning: true,
  },
};

const DEFAULT_PROFILE: Profile = {
  id: 'default',
  name: 'Moi',
  settings: DEFAULT_SETTINGS,
  foodPreferences: [],
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: 'default',

      addProfile: (name: string) => {
        const newProfile: Profile = {
          id: `profile-${Date.now()}`,
          name,
          settings: { ...DEFAULT_SETTINGS },
          foodPreferences: [],
        };
        set((state) => ({ profiles: [...state.profiles, newProfile] }));
      },

      switchProfile: (id: string) => {
        const { profiles } = get();
        const exists = profiles.some((p) => p.id === id);
        if (exists) {
          set({ activeProfileId: id });
        }
      },

      deleteProfile: (id: string) => {
        const { profiles, activeProfileId } = get();
        // Cannot delete the last profile
        if (profiles.length <= 1) return;
        const updated = profiles.filter((p) => p.id !== id);
        const newActiveId =
          activeProfileId === id ? updated[0].id : activeProfileId;
        set({ profiles: updated, activeProfileId: newActiveId });
      },

      updateActiveProfileSettings: (settings: Partial<UserSettings>) => {
        const { profiles, activeProfileId } = get();
        set({
          profiles: profiles.map((p) =>
            p.id === activeProfileId
              ? { ...p, settings: { ...p.settings, ...settings } }
              : p
          ),
        });
      },
    }),
    {
      name: 'assembleat-profiles',
    }
  )
);
