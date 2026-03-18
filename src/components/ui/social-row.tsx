import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const socials = [
  { name: "Facebook", icon: Facebook },
  { name: "Twitter/X", icon: Twitter },
  { name: "Instagram", icon: Instagram },
  { name: "LinkedIn", icon: Linkedin },
];

export function SocialRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-row items-center gap-3 ${className}`}>
      {socials.map(({ name, icon: Icon }) => (
        <span
          key={name}
          role="img"
          aria-label={`${name} (Coming soon)`}
          title="Coming soon"
          className="bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-colors cursor-default"
        >
          <Icon className="text-white" size={22} />
        </span>
      ))}
    </div>
  );
}
