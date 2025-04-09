'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css' // Import nprogress styles

// Configure NProgress (optional)
NProgress.configure({ showSpinner: false });

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress bar on mount/navigation start
    NProgress.start();

    // Complete progress bar when pathname or searchParams change (navigation complete)
    NProgress.done();

    // Cleanup function
    return () => {
      // If component unmounts before navigation finishes (unlikely but possible)
      // NProgress.done(); 
    };
  }, [pathname, searchParams]); // Depend on pathname and searchParams

  // Customize NProgress appearance using CSS overrides in your global CSS if needed
  // Example in globals.css:
  /*
  #nprogress .bar {
    background: #your_accent_color !important; 
    height: 3px !important;
  }
  */

  return null; // This component doesn't render anything itself
} 