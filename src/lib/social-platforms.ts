// 18 most popular social platforms with brand info
export type SocialPlatform = {
  key: string;
  name: string;
  // emoji fallback; we render Lucide icons where possible
  icon: string;
  color: string;
  placeholder: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "facebook",
    name: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    placeholder: "https://facebook.com/your-page",
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: "instagram",
    color: "#E1306C",
    placeholder: "https://instagram.com/your-handle",
  },
  {
    key: "twitter",
    name: "X (Twitter)",
    icon: "twitter",
    color: "#000000",
    placeholder: "https://x.com/your-handle",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    color: "#0A66C2",
    placeholder: "https://linkedin.com/company/your-company",
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: "youtube",
    color: "#FF0000",
    placeholder: "https://youtube.com/@your-channel",
  },
  {
    key: "tiktok",
    name: "TikTok",
    icon: "music",
    color: "#000000",
    placeholder: "https://tiktok.com/@your-handle",
  },
  {
    key: "threads",
    name: "Threads",
    icon: "at-sign",
    color: "#000000",
    placeholder: "https://threads.net/@your-handle",
  },
  {
    key: "pinterest",
    name: "Pinterest",
    icon: "image",
    color: "#E60023",
    placeholder: "https://pinterest.com/your-handle",
  },
  {
    key: "snapchat",
    name: "Snapchat",
    icon: "ghost",
    color: "#FFFC00",
    placeholder: "https://snapchat.com/add/your-handle",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    icon: "message-circle",
    color: "#25D366",
    placeholder: "https://wa.me/your-number",
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: "send",
    color: "#229ED9",
    placeholder: "https://t.me/your-handle",
  },
  {
    key: "wechat",
    name: "WeChat",
    icon: "message-square",
    color: "#07C160",
    placeholder: "your-wechat-id",
  },
  {
    key: "line",
    name: "Line",
    icon: "message-square-text",
    color: "#06C755",
    placeholder: "https://line.me/ti/p/your-id",
  },
  {
    key: "zalo",
    name: "Zalo",
    icon: "circle-user",
    color: "#0068FF",
    placeholder: "https://zalo.me/your-number",
  },
  {
    key: "discord",
    name: "Discord",
    icon: "gamepad-2",
    color: "#5865F2",
    placeholder: "https://discord.gg/your-invite",
  },
  {
    key: "reddit",
    name: "Reddit",
    icon: "globe",
    color: "#FF4500",
    placeholder: "https://reddit.com/r/your-sub",
  },
  {
    key: "github",
    name: "GitHub",
    icon: "github",
    color: "#181717",
    placeholder: "https://github.com/your-handle",
  },
  {
    key: "behance",
    name: "Behance",
    icon: "palette",
    color: "#1769FF",
    placeholder: "https://behance.net/your-handle",
  },
];

export const PLATFORMS_MAP = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, p]));
