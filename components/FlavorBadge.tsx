'use client';

import type { FlavorProfile } from '@/types';
import { flavorProfiles } from '@/lib/data/repertoire';
import { Badge } from '@/components/ui/badge';

interface FlavorBadgeProps {
  profile: FlavorProfile;
}

export function FlavorBadge({ profile }: FlavorBadgeProps) {
  const data = flavorProfiles[profile];
  if (!data) return null;

  return (
    <Badge variant="secondary" className="text-[10px] gap-1">
      <span>{data.emoji}</span>
      <span>{data.name}</span>
    </Badge>
  );
}
