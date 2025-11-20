'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useNetwork } from '@/context/NetworkContext';
import Link from 'next/link';
import { Home, Lock, ArrowUp, Coin, ChevronDown, CreditCard, Keyboard } from '@nsmr/pixelart-react';
import { useEffect, useState } from 'react';
import { isFeatureFree } from '@/lib/invite-codes/helpers';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface RouteItem {
  title: string;
  icon?: React.ElementType;
  url: string;
  submenu?: RouteItem[];
  hidden?: boolean;
}

export const route = {
  api: [
    '/api',
    '/api/update-extensions',
    '/api/create-token',
    '/create',
    '/create/review',
    '/update-extensions',
    '/solana-multisender',
    '/solana-batch-transfer',
    '/solana-token-transfer',
  ],
  mainnet: [
    {
      title: 'Utilities',
      icon: CreditCard,
      submenu: [
        {
          title: 'Gasless Transfer',
          url: '/',
        },
        {
          title: 'Swap to SOL',
          url: '/swap-sol',
        },
        {
          title: 'Swap All Token to SOL',
          url: '/swap-all',
        },
        {
          title: 'Launch Token DBC Meteora',
          url: '/dbc/token',
        },
        {
          title: 'Increase Holders',
          url: '/increase-holders',
        },
        {
          title: 'Close account',
          url: '/close-account',
        },
        {
          title: 'Multisender',
          url: '/solana-multisender',
        },
        {
          title: 'Local Web3 Wallet Manager',
          url: '/local-wallet-manager',
        },
        {
          title: 'Wallet Asset Migration',
          url: '/wallet-asset-migration',
        },
        {
          title: 'Mint Additional Supply',
          url: '/mint-additional-supply',
        },
      ],
    },
    {
      title: 'Developer',
      icon: Keyboard,
      submenu: [
        {
          title: 'Buy Sol Devnet ',
          url: '/sell-sol-devnet',
        },
        {
          title: 'Raydium CPMM',
          url: '/create-pool/raydium-cpmm',
        },
        {
          title: 'Meteora DAMM V2',
          url: '/create-pool/meteora-damm',
        },
        {
          title: 'Create Token',
          url: '/create',
        },
        {
          title: 'Update Extensions',
          url: '/update-extensions',
        },
        {
          title: 'Burn Token',
          url: '/burn-token',
        },
        {
          title: 'Permanent Delegate',
          url: '/permanent-delegate-recovery',
        },
      ],
    },
    {
      title: 'Review Token',
      icon: Coin,
      url: '/create/review',
      hidden: true,
    },
  ],

  devnet: [
    {
      title: 'Dashboard',
      icon: Home,
      url: '/?cluster=devnet',
    },
    {
      title: 'Lock LP',
      icon: Lock,
      url: '/lock-lp?cluster=devnet',
    },
    {
      title: 'Withdraw LP',
      icon: ArrowUp,
      url: '/withdraw-lp?cluster=devnet',
    },
    {
      title: 'Multisender',
      icon: CreditCard,
      url: '/solana-multisender?cluster=devnet',
    },
    {
      title: 'Token',
      icon: Coin,
      submenu: [
        {
          title: 'Create Token',
          url: '/create?cluster=devnet',
        },
        {
          title: 'Update Extensions',
          url: '/update-extensions?cluster=devnet',
        },
        {
          title: 'Burn Token',
          url: '/burn-token?cluster=devnet',
        },
        {
          title: 'Permanent Delegate',
          url: '/permanent-delegate-recovery?cluster=devnet',
        },
      ],
    },
    {
      title: 'Review Token',
      icon: Coin,
      url: '/create/review?cluster=devnet',
      hidden: true,
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const { network } = useNetwork();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [freeFeatures, setFreeFeatures] = useState<Set<string>>(new Set());

  const navMain = network === WalletAdapterNetwork.Devnet ? route.devnet : route.mainnet;

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const isSubmenuActive = (submenuItems: RouteItem[]) => {
    if (!pathname) return false;
    return submenuItems.some((item) => {
      if (!item.url) return false;
      return pathname.split('?')[0] === item.url.split('?')[0];
    });
  };

  useEffect(() => {
    const checkFreeFeatures = () => {
      const features = new Set<string>();

      const allFeatures = [
        'Gasless Transfer',
        'Swap to SOL',
        'Swap All Token to SOL',
        'Launch Token DBC Meteora',
        'Increase Holders',
        'Close account',
        'Multisender',
        'Local Web3 Wallet Manager',
        'Wallet Asset Migration',
        'Buy Sol Devnet',
        'Raydium CPMM',
        'Meteora DAMM V2',
        'Create Token',
        'Update Extensions',
        'Burn Token',
        'Permanent Delegate',
        'Mint Additional Supply',
      ];

      allFeatures.forEach((feature) => {
        if (isFeatureFree(feature)) {
          features.add(feature);
        }
      });

      setFreeFeatures(features);
    };

    checkFreeFeatures();

    window.addEventListener('storage', checkFreeFeatures);

    window.addEventListener('invite-code-activated', checkFreeFeatures);

    return () => {
      window.removeEventListener('storage', checkFreeFeatures);
      window.removeEventListener('invite-code-activated', checkFreeFeatures);
    };
  }, []);

  return (
    <Sidebar className="border-r border-gray-800">
      <SidebarHeader className="border-b border-gray-800 h-[60px]">
        <div className="flex items-center gap-2 px-4 py-2">
          <Link
            href={
              network === WalletAdapterNetwork.Devnet
                ? route.devnet[0].url!
                : route.mainnet[0].submenu![0].url!
            }
            className="text-2xl cursor-pointer"
          >
            TOOL3
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navMain
                  .filter((item) => !item.hidden)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.submenu ? (
                        <>
                          <SidebarMenuButton
                            onClick={() => toggleSubmenu(item.title)}
                            isActive={isSubmenuActive(item.submenu)}
                            className="flex items-center justify-between w-full"
                          >
                            <div className="flex items-center">
                              {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                              <span>{item.title}</span>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </SidebarMenuButton>

                          {(openSubmenu === item.title || isSubmenuActive(item.submenu)) && (
                            <SidebarMenuSub>
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={
                                      pathname && subItem.url
                                        ? pathname.split('?')[0] === subItem.url.split('?')[0]
                                        : false
                                    }
                                  >
                                    <Link href={subItem.url || '#'}>
                                      <span>{subItem.title}</span>
                                      {freeFeatures.has(subItem.title) && (
                                        <span className="ml-auto">
                                          <Sparkles size={12} className="text-white-300/80" />
                                        </span>
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={
                            pathname && item.url
                              ? pathname.split('?')[0] === item.url.split('?')[0]
                              : false
                          }
                        >
                          <Link href={item.url || '#'} className="flex items-center">
                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="p-4">
          <Link
            href="https://t.me/+oIOsdVtqdeg0ODc1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm hover:underline"
          >
            <Image
              src="/image/telegram.png"
              alt="Telegram"
              className="mr-2 object-contain"
              width={16}
              height={16}
            />
            Feedbacks?
          </Link>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
