import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLanguage } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "vi";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 hover:bg-accent/50" title="Language">
          <img
            src={
              current === "en" ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/vn.png"
            }
            srcSet={
              current === "en"
                ? "https://flagcdn.com/w80/us.png 2x"
                : "https://flagcdn.com/w80/vn.png 2x"
            }
            width="20"
            alt={current === "en" ? "English" : "Tiếng Việt"}
            className="rounded-[2px]"
          />
          <span className="text-sm font-medium hidden sm:inline-block">
            {current === "en" ? "EN" : "VI"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setLanguage("vi")}
          className={`gap-3 p-2 cursor-pointer ${current === "vi" ? "font-bold text-primary bg-primary/5" : ""}`}
        >
          <img
            src="https://flagcdn.com/w40/vn.png"
            srcSet="https://flagcdn.com/w80/vn.png 2x"
            width="20"
            alt="Tiếng Việt"
            className="rounded-[2px]"
          />
          <span>Tiếng Việt</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`gap-3 p-2 cursor-pointer ${current === "en" ? "font-bold text-primary bg-primary/5" : ""}`}
        >
          <img
            src="https://flagcdn.com/w40/us.png"
            srcSet="https://flagcdn.com/w80/us.png 2x"
            width="20"
            alt="English"
            className="rounded-[2px]"
          />
          <span>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
