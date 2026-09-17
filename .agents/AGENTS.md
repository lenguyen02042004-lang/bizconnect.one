# STRICT PRODUCTION RULE: ABSOLUTELY NO MOCK OR HARDCODED DATA

- The application is in PRODUCTION.
- NEVER use mock data, dummy data, or hardcoded fallbacks (e.g. 'DEFAULT_DESCRIPTION', 'lorem ipsum', mock business lists, static arrays of fake data).
- If data from the database is missing or empty, render it as empty or hide the corresponding UI element. DO NOT insert fake data to 'make it look good'.
- Delete any existing mock files when encountered.

# DATA SCRAPING RULES
- All scraper scripts MUST be placed in `scripts/scraper/`.
- When writing a new scraper or updating an existing one, ALWAYS import shared utilities (like `supabase` client, `setupSystemAccount`, `getCountryCode`, etc.) from `scripts/scraper/utils.mjs`. Do not duplicate database connection logic or common string manipulations in individual scraper files.
- Refer to `scripts/scraper/README.md` for full scraper guidelines.
