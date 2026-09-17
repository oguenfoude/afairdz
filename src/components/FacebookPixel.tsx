'use client';

import Script from 'next/script';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _fbq?: any;
  }
}

export const FB_PIXEL_ID =  '613015005205444';

/**
 * Standard Facebook Pixel event dispatcher with eventID deduplication support
 */
export const trackFBPixel = (
  event: string, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>,
  options?: { eventID?: string }
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (data && options) {
      window.fbq('track', event, data, options);
    } else if (data) {
      window.fbq('track', event, data);
    } else {
      window.fbq('track', event);
    }
  }
};

export default function FacebookPixel() {
  if (!FB_PIXEL_ID) {
    // When no pixel ID is set yet, render a safe shim so window.fbq calls don't crash
    return (
      <Script
        id="fb-pixel-shim"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.fbq = window.fbq || function() {
              (window.fbq.q = window.fbq.q || []).push(arguments);
              console.log('[FB Pixel Event]', arguments[0], arguments[1] || '');
            };
          `
        }}
      />
    );
  }

  return (
    <Script
      id="fb-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('set', 'autoConfig', false, '${FB_PIXEL_ID}');
          fbq('set', 'allowAutoConfig', false, '${FB_PIXEL_ID}');
          fbq('init', '${FB_PIXEL_ID}');
          /* Visit, PageView and automatic button clicks disabled: only manual Purchase event counts */
        `
      }}
    />
  );
}
