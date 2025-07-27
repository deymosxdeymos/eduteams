import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const socials = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: Facebook,
  },
  {
    name: 'Twitter/X',
    href: 'https://x.com',
    icon: Twitter,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: Instagram,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: Linkedin,
  },
];

export function SocialRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-row items-center gap-3 ${className}`}>
      {socials.map(({ name, href, icon: Icon }) => (
        <a
          key={name}
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={name}
          className='bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-colors'
        >
          <Icon className='text-white' size={22} />
        </a>
      ))}
    </div>
  );
}
