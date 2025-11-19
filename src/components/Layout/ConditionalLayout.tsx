'use client';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Layout } from './Layout';
import { RouteNamesEnum } from '@/localConstants';

export const ConditionalLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith(RouteNamesEnum.app);

  // Don't apply the general Layout (with MultiversX header) for app routes
  if (isAppRoute) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
};

