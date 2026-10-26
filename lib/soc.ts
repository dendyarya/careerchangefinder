/** SOC 2018 major groups (BLS) used for "Careers by Industry" and breadcrumbs. */
export interface SocGroup {
  code: string; // "29"
  slug: string;
  name: string; // official SOC major group title (without "Occupations")
  short: string; // menu label
}

export const SOC_GROUPS: SocGroup[] = [
  { code: "11", slug: "management", name: "Management", short: "Management" },
  { code: "13", slug: "business-finance", name: "Business and Financial Operations", short: "Business & Finance" },
  { code: "15", slug: "computer-math", name: "Computer and Mathematical", short: "Computer & Math" },
  {
    code: "17",
    slug: "architecture-engineering",
    name: "Architecture and Engineering",
    short: "Architecture & Engineering",
  },
  { code: "19", slug: "science", name: "Life, Physical, and Social Science", short: "Science" },
  {
    code: "21",
    slug: "community-social-service",
    name: "Community and Social Service",
    short: "Community & Social Service",
  },
  { code: "23", slug: "legal", name: "Legal", short: "Legal" },
  { code: "25", slug: "education", name: "Educational Instruction and Library", short: "Education" },
  { code: "27", slug: "arts-media", name: "Arts, Design, Entertainment, Sports, and Media", short: "Arts & Media" },
  { code: "29", slug: "healthcare", name: "Healthcare Practitioners and Technical", short: "Healthcare" },
  { code: "31", slug: "healthcare-support", name: "Healthcare Support", short: "Healthcare Support" },
  { code: "33", slug: "protective-service", name: "Protective Service", short: "Protective Service" },
  { code: "35", slug: "food-service", name: "Food Preparation and Serving Related", short: "Food Service" },
  {
    code: "37",
    slug: "building-grounds",
    name: "Building and Grounds Cleaning and Maintenance",
    short: "Building & Grounds",
  },
  { code: "39", slug: "personal-care", name: "Personal Care and Service", short: "Personal Care" },
  { code: "41", slug: "sales", name: "Sales and Related", short: "Sales" },
  { code: "43", slug: "office-admin", name: "Office and Administrative Support", short: "Office & Admin" },
  { code: "45", slug: "farming", name: "Farming, Fishing, and Forestry", short: "Farming" },
  { code: "47", slug: "construction", name: "Construction and Extraction", short: "Construction" },
  {
    code: "49",
    slug: "installation-repair",
    name: "Installation, Maintenance, and Repair",
    short: "Installation & Repair",
  },
  { code: "51", slug: "production", name: "Production", short: "Production" },
  { code: "53", slug: "transportation", name: "Transportation and Material Moving", short: "Transportation" },
];

export const socGroupOf = (code: string) => SOC_GROUPS.find((g) => g.code === code.slice(0, 2));

export const RIASEC_NAMES: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};
