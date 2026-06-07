import { cn } from '@/lib/utils/cn';
import BkashLogo from '@/components/payment/Bkash-logo.png';
import NagadLogo from '@/components/payment/nagad.png';
import RocketLogo from '@/components/payment/rocket.png';
import Image from 'next/image';
type LogoProps = { className?: string; title?: string };

/** bKash-style mark: magenta tile + “bk” wordmark (replace with official asset via public/payments if needed). */
export function BkashLogoMark({ className, title = 'bKash' }: LogoProps) {
  return (
    <Image
      src={BkashLogo}
      alt="bKash"
      width={92}
      height={60}
      className={cn('h-10 w-28 shrink-0 self-center opacity-95 drop-shadow-sm', className)}
    />
  );
}

/** Nagad-inspired mark: orange tile + N. */
export function NagadLogoMark({ className, title = 'Nagad' }: LogoProps) {
  return (
    <Image
      src={NagadLogo}
      alt="Nagad"
      width={92}
      height={60}
      className={cn('h-10 w-28 shrink-0 self-center opacity-95 drop-shadow-sm', className)}
    />
  );
}

/** Rocket (DBBL)–style mark: purple + stylized R. */
export function RocketLogoMark({ className, title = 'Rocket' }: LogoProps) {
  return (
    <Image
      src={RocketLogo}
      alt="Rocket"
      width={92}
      height={60}
      className={cn('h-10 w-28 shrink-0 self-center opacity-95 drop-shadow-sm', className)}
    />
  );
}
