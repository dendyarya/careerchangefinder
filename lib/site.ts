export const SITE = {
  name: "Career Change Finder",
  url: "https://careerchangefinder.com",
  description:
    "Free career change tools built on U.S. government data: find jobs that use your skills, compare pay, and take a free career test.",
  // SITE_ENV=production is set only on the production server (Tahap 10B).
  indexable: process.env.SITE_ENV === "production",
} as const;
