"use client";

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-[#2a1f1a] px-6 pt-2 pb-[calc(3.5rem+var(--safe-area-bottom))] md:pb-5">
      <div className="mx-auto flex max-w-6xl min-h-8 items-center justify-center gap-6 text-[12px] md:text-[13px] text-[#7a6a5e]">
        <Link href="/" className="text-[#e8854a] text-sm md:text-base italic hover:text-[#e36920] transition-all duration-300 font-medium">
          firexplorer
        </Link>
        <div className="flex gap-6 uppercase italic tracking-wider">
          <Link href="https://www.linkedin.com/in/landon-campos-6a1366176" target="_blank" rel="noopener noreferrer" className="hover:text-[#c9a08a] transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
