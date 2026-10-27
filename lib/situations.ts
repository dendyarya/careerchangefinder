/** Published "Career change at/to …" situation pages. */
import { AGE_SLUGS } from "@/lib/agePages";
import { FIELD_SLUGS } from "@/lib/fieldPages";
import { isPublished } from "@/lib/published";

export const SITUATION_SLUGS: string[] = [...AGE_SLUGS, ...FIELD_SLUGS, "to-government", "to-remote-work"].filter((s) =>
  isPublished("career-change-situations", s),
);
