"use client";

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-[#2a1f1a] px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 py-6 text-[12px] text-[#7a6a5e]">
        <Link href="/" className="text-[#e8854a] text-sm italic font-medium">
          firexplorer
        </Link>
        <div className="flex gap-6 uppercase italic tracking-wider">
          <Link href="https://www.linkedin.com/in/landon-campos-6a1366176/recent-activity/all/" target="_blank" rel="noopener noreferrer" className="hover:text-[#c9a08a] transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
