import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/Button';
import { RouteNamesEnum } from '@/localConstants';
import { UnlockPanelManager, useGetLoginInfo } from '@/lib';
import { useCallback, useMemo } from 'react';

export const ConnectButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useGetLoginInfo();

  const unlockPanelManager = useMemo(() => {
    return UnlockPanelManager.init({
      loginHandler: () => {
        // After successful login, redirect to app if on homepage, otherwise refresh
        if (pathname === RouteNamesEnum.home) {
          router.push(RouteNamesEnum.app);
        } else {
          // Refresh to update login state
          router.refresh();
        }
      },
      onClose: () => {
        // Modal closed, do nothing
      }
    });
  }, [router, pathname]);

  const handleClick = useCallback(() => {
    if (isLoggedIn) {
      return;
    }
    unlockPanelManager.openUnlockPanel();
  }, [isLoggedIn, unlockPanelManager]);

  return <Button onClick={handleClick}>Connect</Button>;
};
