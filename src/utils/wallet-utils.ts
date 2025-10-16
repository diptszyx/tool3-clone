export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const openWalletApp = (walletName: string) => {
  const currentUrl = window.location.href;

  const deeplinks: Record<string, string> = {
    Phantom: `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`,
    Solflare: `https://solflare.com/ul/v1/browse/${encodeURIComponent(
      currentUrl
    )}`,
  };

  if (deeplinks[walletName]) {
    window.location.href = deeplinks[walletName];
  }
};
