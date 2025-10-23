'use client';

import { useEffect } from 'react';

export default function ChatwootWidget() {
  useEffect(() => {
    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: 'en',
      type: 'standard',
    };

    (function (d, t) {
      const BASE_URL = 'https://app.chatwoot.com';
      const g = d.createElement(t);
      const s = d.getElementsByTagName(t)[0];
      g.setAttribute('src', BASE_URL + '/packs/js/sdk.js');
      g.setAttribute('async', 'truet');
      g.onload = function () {
        window.chatwootSDK.run({
          websiteToken: '4NZFZ4KPKKavuDHNrpyBJax7',
          baseUrl: BASE_URL,
        });
      };
      if (s.parentNode) s.parentNode.insertBefore(g, s);
    })(document, 'script');
  }, []);

  return null;
}
