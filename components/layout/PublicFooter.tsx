'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SITE_FOOTER_BLURB } from '@/lib/seo/siteCopy';
import { SITE_NAME } from '@/lib/seo/site';
import type { PublicStoreSettings } from '@/lib/api/storeSettings';
import { getPublicStoreSettings } from '@/lib/api/storeSettings';
import { useEffect, useState } from 'react';
import { usePublicHeader } from './header';
import { HeaderSocialIcons } from './HeaderSocialIcons';
import { EnvelopeIcon, PhoneIcon } from './header/HeaderIcons';
import { ChevronDown } from "lucide-react";

function PhoneHandsetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function toPhoneHref(value: string): string {
  const compact = value.replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return `tel:${compact}`;
  return `tel:${compact.replace(/\+/g, '')}`;
}

export function PublicFooter({ settings }: { settings?: PublicStoreSettings | null }) {
  const [liveSettings, setLiveSettings] = useState<PublicStoreSettings | null>(settings ?? null);
  const header = usePublicHeader(settings);

  const [open, setOpen] = useState({
    info: false,
    policy: false,
  });



  useEffect(() => {
    let cancelled = false;
    getPublicStoreSettings()
      .then((data) => {
        if (!cancelled) setLiveSettings(data);
      })
      .catch(() => {
        // Keep existing/fallback branding when API is temporarily unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const year = new Date().getFullYear();
  const brandName = liveSettings?.siteTitle?.trim() || SITE_NAME;
  const brandLogo = liveSettings?.siteLogo?.trim() || '/icon.png';
  const supportNumber = liveSettings?.emailFooterSupportNumber?.trim() || '';
  const supportNumberHref = toPhoneHref(supportNumber);
  return (
    <footer className="mt-auto border-t border-white/10 bg-black text-white">
      <div className="mx-auto w-full sm:max-w-[90%] px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:gap-10 sm:grid-cols-4">
          <div className="">
            <div className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10 shadow-sm ring-1 ring-white/20">
                <Image
                  src={brandLogo}
                  alt=""
                  width={80}
                  height={80}
                  className="object-contain"
                  unoptimized
                />
              </span>
              <span className="text-4xl font-extrabold uppercase">{brandName}</span>
              
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
              {SITE_FOOTER_BLURB}
            </p>
            {supportNumberHref ? (
              <a
                href={supportNumberHref}
                className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-white/20"
              >
                <PhoneHandsetIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate tabular-nums">{supportNumber}</span>
              </a>
            ) : null}
            <div className="pt-4">
              <p className="py-4 text-xl font-semibold uppercase tracking-wider">Follow us</p>
              <HeaderSocialIcons links={header.socialLinks} footer={true}/>
            </div>

          </div>

          <div className='ml-0 sm:ml-10 mt-10 sm:mt-0'>
            <h2 className="text-md font-extrabold uppercase tracking-wider text-gray-200 mb-4">
              Need Help?
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
              <a
            href={`tel:${header.contactPhone.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <PhoneIcon /> <span>{header.contactPhone}</span>
          </a>
              </li>
              <li>
              <a
            href={`mailto:${header.contactEmail}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <EnvelopeIcon /> <span>{header.contactEmail}</span>
          </a>
              </li>
              
            </ul>
          </div>

 {/* Information */}
 <div className="mt-5 sm:mt-0 border-b border-gray-700 md:border-none pb-0 md:pb-0">
        <button
          onClick={() =>
            setOpen((prev) => ({ ...prev, info: !prev.info }))
          }
          className="w-full flex items-center justify-between md:cursor-default"
        >
          <h2 className="text-md font-extrabold uppercase tracking-wider text-gray-200">
            Information
          </h2>

          <ChevronDown
            className={`w-5 h-5 text-gray-300 transition-transform md:hidden ${
              open.info ? "rotate-180" : ""
            }`}
          />
        </button>

        <ul
          className={`mt-4 space-y-3 text-sm overflow-hidden transition-all duration-300 ${
            open.info ? "max-h-96" : "max-h-0 md:max-h-96"
          }`}
        >
          <li>
            <Link
              href="/shop"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Browse Shop
            </Link>
          </li>
          <li>
            <Link
              href="/search"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              About UR Shop
            </Link>
          </li>
          <li>
            <Link
              href="/cart"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Store Location
            </Link>
          </li>
          <li className='pb-4'>
            <Link
              href="/dashboard"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Social Responsibility
            </Link>
          </li>
        </ul>
      </div>

      {/* Policy */}
      <div className="border-b border-gray-700 md:border-none pb-0 md:pb-0">
        <button
          onClick={() =>
            setOpen((prev) => ({ ...prev, policy: !prev.policy }))
          }
          className="w-full flex items-center justify-between md:cursor-default mt-5 md:mt-0"
        >
          <h2 className="text-md font-extrabold uppercase tracking-wider text-gray-200">
            Policy
          </h2>

          <ChevronDown
            className={`w-5 h-5 text-gray-300 transition-transform md:hidden ${
              open.policy ? "rotate-180" : ""
            }`}
          />
        </button>

        <ul
          className={`mt-4 space-y-3 text-sm overflow-hidden transition-all duration-300 ${
            open.policy ? "max-h-96" : "max-h-0 md:max-h-96"
          }`}
        >
          <li>
            <Link
              href="/login"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              href="/register"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Return and Exchange Policy
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Terms and Conditions
            </Link>
          </li>
          <li className='pb-4'>
            <Link
              href="/dashboard"
              className="text-gray-200 hover:text-red-500 transition-colors"
            >
              Safety Advisory
            </Link>
          </li>
        </ul>
      </div>

        </div>
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-gray-400">© {year} {brandName}. All rights reserved.</p>
          <p className="text-xs text-gray-400 sm:text-right">
            Secure payments · Instant digital delivery
          </p>
        </div>
        <div className="mt-0  pt-8 text-center">
          <p className="text-base text-gray-400">
            Developed by{' '}
            <Link
              href="https://my-portfolio-asfaqur-rahman.web.app"
              target="_blank"
              rel="noopener noreferrer"
              className=" font-semibold text-red-500 transition-colors hover:text-red-300 underline"
            >
              Asfaqur Rahman
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
