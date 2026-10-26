/**
 * Big Five trait wording for the test and the 10 result pages. Plain, non-clinical descriptions
 * (to be expanded and reviewed in Tahap 7). IPIP factor names; no "NEO", no MBTI types.
 */
export type TraitId = "extraversion" | "agreeableness" | "conscientiousness" | "emotional-stability" | "openness";
export type End = "high" | "low";

export interface TraitInfo {
  id: TraitId;
  name: string;
  /** what the trait is about, one sentence */
  about: string;
  high: { label: string; short: string; listTitle: string; strengths: string[] };
  low: { label: string; short: string; listTitle: string; strengths: string[] };
}

export const TRAITS: TraitInfo[] = [
  {
    id: "extraversion",
    name: "Extraversion",
    about: "How much you seek out people, activity and attention.",
    high: {
      label: "High Extraversion",
      short:
        "You draw energy from people and activity. You tend to speak up, start conversations and enjoy a busy day.",
      listTitle: "Careers with a lot of people contact and leadership",
      strengths: ["Starting conversations", "Leading groups", "Building networks", "Thinking out loud"],
    },
    low: {
      label: "Low Extraversion (Introversion)",
      short:
        "You prefer calmer settings and smaller groups, and you often think before you speak. Quiet focus suits you.",
      listTitle: "Careers that need training but less social contact",
      strengths: ["Deep focus", "Listening", "Working on your own", "Careful thinking"],
    },
  },
  {
    id: "agreeableness",
    name: "Agreeableness",
    about: "How much you put cooperation and other people’s feelings first.",
    high: {
      label: "High Agreeableness",
      short: "You tend to be warm, cooperative and considerate of other people’s feelings.",
      listTitle: "Careers built on cooperation and empathy",
      strengths: ["Teamwork", "Patience", "Helping others", "Calming tense situations"],
    },
    low: {
      label: "Low Agreeableness",
      short: "You tend to be direct and skeptical, and comfortable with debate and tough decisions.",
      listTitle: "Careers that need training but less day-to-day cooperation",
      strengths: ["Plain speaking", "Critical thinking", "Negotiating", "Making hard calls"],
    },
  },
  {
    id: "conscientiousness",
    name: "Conscientiousness",
    about: "How organized, careful and dependable you tend to be.",
    high: {
      label: "High Conscientiousness",
      short: "You tend to be organized, careful and reliable, and you like finishing tasks on time.",
      listTitle: "Careers where detail and dependability matter most",
      strengths: ["Planning", "Attention to detail", "Following through", "Keeping standards"],
    },
    low: {
      label: "Low Conscientiousness",
      short: "You tend to be flexible and spontaneous, and you prefer freedom over fixed routines.",
      listTitle: "Careers that need training but fewer fixed routines",
      strengths: ["Adapting quickly", "Improvising", "Trying new approaches", "Staying relaxed about change"],
    },
  },
  {
    id: "emotional-stability",
    name: "Emotional Stability",
    about: "How calm and steady you tend to feel under pressure.",
    high: {
      label: "High Emotional Stability",
      short: "You tend to stay calm under pressure and recover quickly from setbacks.",
      listTitle: "Careers that ask for calm under pressure",
      strengths: ["Staying calm", "Handling setbacks", "Steady decisions", "Working under time pressure"],
    },
    low: {
      label: "Low Emotional Stability",
      short:
        "You tend to feel stress and worry more strongly than most. Settings with steady demands can suit you. This is a personality trait, not a diagnosis.",
      listTitle: "Careers that need training but have lower stress demands",
      strengths: [
        "Noticing risks early",
        "Taking problems seriously",
        "Empathy for others’ stress",
        "Careful preparation",
      ],
    },
  },
  {
    id: "openness",
    name: "Openness (Intellect/Imagination)",
    about: "How much you enjoy ideas, imagination and new experiences.",
    high: {
      label: "High Openness",
      short: "You enjoy ideas, imagination and new experiences, and you like abstract thinking.",
      listTitle: "Careers that reward curiosity and new ideas",
      strengths: ["Curiosity", "Creative thinking", "Learning fast", "Seeing the big picture"],
    },
    low: {
      label: "Low Openness",
      short: "You prefer the practical and the familiar, and you like clear, concrete tasks.",
      listTitle: "Careers that need training and value practical, proven methods",
      strengths: ["Practical sense", "Consistency", "Using proven methods", "Getting things done"],
    },
  },
];

export const traitById = (id: string) => TRAITS.find((t) => t.id === id);

export const RESULT_SLUGS = TRAITS.flatMap((t) => [`high-${t.id}`, `low-${t.id}`]);

export function parseResultSlug(slug: string): { trait: TraitInfo; end: End } | null {
  const m = /^(high|low)-(.+)$/.exec(slug);
  if (!m) return null;
  const trait = traitById(m[2]!);
  return trait ? { trait, end: m[1] as End } : null;
}
