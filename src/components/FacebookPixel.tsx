'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _fbq?: any;
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '';

/**
 * Standard Facebook Pixel event dispatcher with eventID deduplication support.
 * Always pass a unique eventID so the server-side CAPI call can deduplicate.
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

/**
 * Generates a unique event ID for Pixel ↔ CAPI deduplication.
 */
export function generateEventId(): string {
  return 'evt_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
}

/**
 * Reads _fbp and _fbc cookies from the browser (improves Meta match quality).
 */
export function getFbCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {};
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  };
}

export default function FacebookPixel() {
  // Fire PageView once on mount (manual, since autoConfig is off)
  useEffect(() => {
    if (FB_PIXEL_ID && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, []);

  if (!FB_PIXEL_ID) {
    // Safe shim — fbq calls won't crash when pixel is not configured
    return (
      <Script
        id="fb-pixel-shim"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.fbq = window.fbq || function() {
              (window.fbq.q = window.fbq.q || []).push(arguments);
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
          fbq('init', '${FB_PIXEL_ID}');
          /* Explicit manual tracking only — prevents duplicate ghost button-click events */
        `
      }}
    />
  );
}
