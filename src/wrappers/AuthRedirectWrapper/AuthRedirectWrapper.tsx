'use client';
import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { useGetIsLoggedIn } from '@/lib';
import { RouteNamesEnum } from '@/localConstants';
import { useRouter, usePathname } from 'next/navigation';

interface AuthRedirectWrapperPropsType extends PropsWithChildren {
  requireAuth?: boolean;
}

export const AuthRedirectWrapper = ({
  children,
  requireAuth = true
}: AuthRedirectWrapperPropsType) => {
  const isLoggedIn = useGetIsLoggedIn();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if auth is required and user is not logged in
    if (!isLoggedIn && requireAuth) {
      // Only redirect if we're not already on the home page
      if (pathname !== RouteNamesEnum.home) {
        router.push(RouteNamesEnum.home);
      }
    }
    // If requireAuth is false, the page works for both logged-in and logged-out users
    // No redirect needed
  }, [isLoggedIn, requireAuth, pathname, router]);

  return <>{children}</>;
};
