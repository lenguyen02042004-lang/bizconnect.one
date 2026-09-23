import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi";
import en from "./locales/en";

const getInitialLanguage = () => {
  // Keep SSR and the first client render identical. Browser preferences are
  // applied after hydration by the language switcher.
  return "vi";
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: "vi",
    interpolation: { escapeValue: false },
  });
}

export const setLanguage = (lng: "vi" | "en") => {
  i18n.changeLanguage(lng);
  if (typeof window !== "undefined") localStorage.setItem("lang", lng);
};

export default i18n;
