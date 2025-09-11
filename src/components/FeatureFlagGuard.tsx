import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface Props {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlagGuard: React.FC<Props> = ({
  flag,
  children,
  fallback = null,
}) => {
  const enabled = useFeatureFlag(flag);
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
};

export default FeatureFlagGuard;
