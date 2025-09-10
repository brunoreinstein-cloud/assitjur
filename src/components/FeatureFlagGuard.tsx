import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface Props {
  flag: string;
  children: React.ReactNode;
}

export const FeatureFlagGuard: React.FC<Props> = ({ flag, children }) => {
  const enabled = useFeatureFlag(flag);
  if (!enabled) return null;
  return <>{children}</>;
};

export default FeatureFlagGuard;
