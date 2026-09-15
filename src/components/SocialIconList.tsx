import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  AtSign,
  Image as ImageIcon,
  Ghost,
  MessageCircle,
  Send,
  MessageSquare,
  MessageSquareText,
  CircleUser,
  Gamepad2,
  Globe,
  Github,
  Palette,
} from "lucide-react";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  music: Music,
  "at-sign": AtSign,
  image: ImageIcon,
  ghost: Ghost,
  "message-circle": MessageCircle,
  send: Send,
  "message-square": MessageSquare,
  "message-square-text": MessageSquareText,
  "circle-user": CircleUser,
  "gamepad-2": Gamepad2,
  globe: Globe,
  github: Github,
  palette: Palette,
};

interface Props {
  socials: Record<string, string>;
  size?: "sm" | "md";
}

export function SocialIconList({ socials, size = "md" }: Props) {
  const entries = Object.entries(socials).filter(([, url]) => !!url);
  if (entries.length === 0) return null;

  const sizeClass = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, url]) => {
        const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
        if (!platform) return null;
        const Icon = ICON_MAP[platform.icon] ?? Globe;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={platform.name}
            className={`${sizeClass} rounded-full flex items-center justify-center text-white transition-bounce hover:scale-110 hover:shadow-pink`}
            style={{ background: platform.color }}
          >
            <Icon className={iconClass} />
          </a>
        );
      })}
    </div>
  );
}
