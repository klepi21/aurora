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

  return (
    <Button 
      onClick={handleClick}
      className='px-8 py-3 text-base font-semibold bg-gradient-to-r from-[#3EB489] to-[#8ED6C1] hover:from-[#3EB489]/90 hover:to-[#8ED6C1]/90 text-white rounded-xl shadow-lg hover:shadow-[#3EB489]/50 transition-all duration-300 transform hover:scale-105'
    >
      Connect Wallet
    </Button>
  );
};
