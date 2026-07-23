import { HeaderSocialIcons } from '@/components/layout/HeaderSocialIcons';
import { EnvelopeIcon, PhoneIcon } from './HeaderIcons';

interface HeaderTopBarProps {
  contactEmail: string;
  contactPhone: string;
  socialLinks: Parameters<typeof HeaderSocialIcons>[0]['links'];
}

export function HeaderTopBar({ contactEmail, contactPhone, socialLinks }: HeaderTopBarProps) {
  if (!contactEmail && !contactPhone && socialLinks.length === 0) return null;

  return (
    <div className="hidden md:flex items-center justify-between bg-[#1e2a3a] px-4 py-1.5 text-xs text-gray-200 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {contactPhone ? (
          <a
            href={`tel:${contactPhone.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <PhoneIcon /> <span>{contactPhone}</span>
          </a>
        ) : null}
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <EnvelopeIcon /> <span>{contactEmail}</span>
          </a>
        ) : null}
      </div>
        <HeaderSocialIcons links={socialLinks} />
    </div>
  );
}
