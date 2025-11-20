import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConditionalLayout } from '@/components/Layout';
import App from './index';
import { InitAppWrapper } from '@/wrappers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aurora Football League - Fantasy Football NFT Game | Build Your Team & Win Rewards',
  description:
    'Join Aurora Football League - the ultimate fantasy football NFT game on MultiversX blockchain. Own NFT players, build your 5-player team (1 GK, 2 DEF, 2 ATT), compete in seasons, climb leaderboards, and win USDC prizes. True ownership, strategic gameplay, and competitive rewards await!',
  keywords: [
    'fantasy football',
    'NFT game',
    'blockchain gaming',
    'MultiversX',
    'Aurora Football League',
    'fantasy sports',
    'NFT players',
    'football NFTs',
    'crypto gaming',
    'Web3 gaming',
    'fantasy team',
    'football manager',
    'NFT collectibles',
    'blockchain sports',
    'crypto rewards',
    'USDC prizes',
    'leaderboard competition',
    'football strategy game',
    'NFT ownership',
    'decentralized gaming'
  ],
  authors: [{ name: 'Aurora Football League' }],
  openGraph: {
    title: 'Aurora Football League - Fantasy Football NFT Game',
    description: 'Build your fantasy football team with NFT players. Compete in seasons, climb leaderboards, and win USDC prizes on MultiversX blockchain.',
    type: 'website',
    siteName: 'Aurora Football League'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aurora Football League - Fantasy Football NFT Game',
    description: 'Build your fantasy football team with NFT players. Compete in seasons and win rewards!'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1
  },
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className={inter.className}>
      <body>
        <InitAppWrapper>
          <App>
            <Suspense>
              <ConditionalLayout>{children}</ConditionalLayout>
            </Suspense>
          </App>
        </InitAppWrapper>
      </body>
    </html>
  );
}
