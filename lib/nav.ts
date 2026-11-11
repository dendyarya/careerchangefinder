/** Menu bar v4 (plan doc "Plan Website: Pindah Karier & Pilih Jurusan"). One source for header, drawer and footer. */

export interface NavLink {
  label: string;
  href: string;
}
export interface NavGroup {
  title: string;
  links: NavLink[];
  columns?: 1 | 2;
  more?: NavLink;
}
export interface NavMenu {
  id: string;
  label: string;
  href: string;
  groups: NavGroup[];
  /** a plain link in the menu bar, no dropdown */
  link?: boolean;
  promo?: { title: string; text: string; cta: string; href: string };
}

const fromJob = (label: string, slug: string): NavLink => ({ label, href: `/career-change/from-${slug}` });

export const MENUS: NavMenu[] = [
  {
    id: "career-change",
    label: "Career Change",
    href: "/career-change",
    groups: [
      {
        title: "Career Change Tools",
        links: [
          { label: "Career Change Tool", href: "/career-change/tool" },
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
          { label: "Career Change Quiz", href: "/career-change/quiz" },
          { label: "Jobs Similar To…", href: "/jobs-similar-to" },
        ],
      },
      {
        title: "Jobs for Former…",
        columns: 2,
        links: [
          fromJob("Teachers", "teacher"),
          fromJob("Nurses", "nurse"),
          fromJob("Accountants", "accountant"),
          fromJob("Lawyers", "lawyer"),
          fromJob("Software Developers", "software-developer"),
          fromJob("Police Officers", "police-officer"),
          fromJob("Pharmacists", "pharmacist"),
          fromJob("Social Workers", "social-worker"),
          fromJob("Retail Workers", "retail-worker"),
          fromJob("Salespeople", "salesperson"),
          fromJob("Engineers", "engineer"),
          fromJob("Admin Assistants", "administrative-assistant"),
        ],
        more: { label: "See all careers →", href: "/career-change/from" },
      },
      {
        title: "Career Change to…",
        links: [
          { label: "Tech", href: "/career-change/to-tech" },
          { label: "Healthcare", href: "/career-change/to-healthcare" },
          { label: "Nursing", href: "/career-change/to-nursing" },
          { label: "Skilled Trades", href: "/career-change/to-skilled-trades" },
          { label: "Remote Work", href: "/career-change/to-remote-work" },
          { label: "Government Jobs", href: "/career-change/to-government" },
        ],
      },
      {
        title: "By Situation",
        links: [
          { label: "Career Change at 30", href: "/career-change/at-30" },
          { label: "Career Change at 40", href: "/career-change/at-40" },
          { label: "Career Change at 50", href: "/career-change/at-50" },
          { label: "Jobs for Veterans", href: "/career-change/veterans" },
          { label: "Returning to Work", href: "/career-change/return-to-work" },
          { label: "Second Careers for Retirees", href: "/career-change/retirees" },
          { label: "Without a Degree", href: "/career-change/no-degree" },
        ],
      },
    ],
    promo: {
      title: "Not sure where to go?",
      text: "The Free Career Test turns your interests into a shortlist of careers you can move into.",
      cta: "Start the test",
      href: "/career-test",
    },
  },
  {
    id: "careers",
    label: "Careers",
    href: "/careers",
    groups: [
      {
        title: "Browse",
        links: [
          { label: "All Careers A–Z", href: "/careers/a-z" },
          { label: "High-Paying Jobs", href: "/careers/salary/high-paying" },
          { label: "High-Paying Jobs Without a Degree", href: "/careers/salary/high-paying-no-degree" },
        ],
      },
      {
        title: "Careers by Industry",
        columns: 2,
        links: [
          { label: "Management", href: "/careers/industry/management" },
          { label: "Business & Finance", href: "/careers/industry/business-finance" },
          { label: "Computer & Math", href: "/careers/industry/computer-math" },
          { label: "Engineering", href: "/careers/industry/architecture-engineering" },
          { label: "Science", href: "/careers/industry/science" },
          { label: "Healthcare", href: "/careers/industry/healthcare" },
          { label: "Education", href: "/careers/industry/education" },
          { label: "Arts & Media", href: "/careers/industry/arts-media" },
          { label: "Construction", href: "/careers/industry/construction" },
          { label: "Office & Admin", href: "/careers/industry/office-admin" },
        ],
        more: { label: "All 22 industries →", href: "/careers/industry" },
      },
      {
        title: "Careers by Education",
        links: [
          { label: "Jobs Without a Degree", href: "/careers/education/no-degree" },
          { label: "Jobs With a Certificate", href: "/careers/education/certificate" },
          { label: "Jobs With a Bachelor's Degree", href: "/careers/education/bachelors" },
          { label: "Jobs With a Master's Degree", href: "/careers/education/masters" },
        ],
      },
      {
        title: "Careers by Personality",
        links: [
          { label: "Jobs for Introverts", href: "/careers/personality/introverts" },
          { label: "Jobs for Extroverts", href: "/careers/personality/extroverts" },
          { label: "Creative Jobs", href: "/careers/personality/creative" },
          { label: "Hands-On Jobs", href: "/careers/personality/hands-on" },
          { label: "Low-Stress Jobs", href: "/careers/personality/low-stress" },
        ],
        more: { label: "Careers by Holland Code →", href: "/careers/holland-code" },
      },
    ],
  },
  {
    id: "tests",
    label: "Tests",
    href: "/tests",
    groups: [
      {
        title: "Career Tests",
        links: [
          { label: "Free Career Test", href: "/career-test" },
          { label: "Career Change Quiz", href: "/career-change/quiz" },
        ],
      },
      { title: "College Tests", links: [{ label: "College Major Quiz", href: "/college-major-quiz" }] },
      {
        title: "Personality Tests",
        links: [{ label: "Big Five Personality Test", href: "/big-five-personality-test" }],
      },
      {
        title: "Test Results Explained",
        links: [
          { label: "Big Five Traits Explained", href: "/tests/results/big-five" },
          { label: "Holland Codes Explained", href: "/tests/results/holland-codes" },
        ],
      },
    ],
    promo: {
      title: "Free Career Test",
      text: "Based on the O*NET Interest Profiler. About 10 minutes, no sign-up.",
      cta: "Take the test",
      href: "/career-test",
    },
  },
  {
    id: "majors",
    label: "Majors",
    href: "/majors",
    groups: [
      {
        title: "Find a Major",
        links: [
          { label: "College Major Quiz", href: "/college-major-quiz" },
          { label: "All Majors A–Z", href: "/majors/a-z" },
        ],
      },
      {
        title: "Majors by Field",
        columns: 2,
        links: [
          { label: "Business", href: "/majors/field/business" },
          { label: "Health", href: "/majors/field/health" },
          { label: "Engineering", href: "/majors/field/engineering" },
          { label: "Computer Science", href: "/majors/field/computer-science" },
          { label: "Education", href: "/majors/field/education" },
          { label: "Psychology", href: "/majors/field/psychology" },
          { label: "Biology", href: "/majors/field/biology" },
          { label: "Communications", href: "/majors/field/communications" },
          { label: "Arts & Design", href: "/majors/field/arts-design" },
          { label: "Social Sciences", href: "/majors/field/social-sciences" },
          { label: "Trades & Technical", href: "/majors/field/trades-technical" },
        ],
      },
      {
        title: "More Ways to Explore",
        links: [
          { label: "Majors by Personality", href: "/majors/personality" },
          { label: "Majors by Holland Code", href: "/majors/holland-code" },
          { label: "What Can I Do With a Degree?", href: "/majors/degrees" },
        ],
      },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    href: "/guides",
    groups: [
      {
        title: "Career Change Guides",
        links: [
          { label: "How to Change Careers", href: "/guides/how-to-change-careers" },
          { label: "Is It Too Late to Change Careers?", href: "/guides/is-it-too-late-to-change-careers" },
          { label: "Change Careers Without a Pay Cut", href: "/guides/how-to-change-careers-without-a-pay-cut" },
          { label: "Best Careers to Switch To", href: "/guides/best-careers-to-switch-to" },
          { label: "Transferable Skills List", href: "/guides/transferable-skills-list" },
          { label: "Career Change Resume", href: "/guides/career-change-resume" },
          { label: "Career Change Cover Letter", href: "/guides/career-change-cover-letter" },
        ],
      },
      {
        title: "Choosing a Major",
        links: [
          { label: "How to Choose a Major", href: "/guides/how-to-choose-a-major" },
          { label: "Is a College Degree Worth It?", href: "/guides/is-a-college-degree-worth-it" },
          { label: "What Is a Holland Code?", href: "/guides/holland-code-riasec-explained" },
          { label: "What Major Should I Choose?", href: "/guides/what-major-should-i-choose" },
          { label: "Should I Change My Major?", href: "/guides/should-i-change-my-major" },
          { label: "Does Your Major Matter?", href: "/guides/does-your-major-matter" },
          { label: "Trade School vs College", href: "/guides/trade-school-vs-college" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Glossary", href: "/glossary" },
          { label: "Methodology", href: "/methodology" },
          { label: "Data Sources & Licenses", href: "/data-sources" },
        ],
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    href: "/research",
    groups: [
      {
        title: "Data Studies",
        links: [
          { label: "Same Job, Different Pay", href: "/research/same-job-different-pay" },
          { label: "Better-Paying Careers Within Reach", href: "/research/better-paying-careers" },
        ],
        more: { label: "All research →", href: "/research" },
      },
      {
        title: "About Our Data",
        links: [
          { label: "Methodology", href: "/methodology" },
          { label: "Data Sources & Licenses", href: "/data-sources" },
          { label: "Glossary", href: "/glossary" },
        ],
      },
    ],
    promo: {
      title: "Use our data",
      text: "Journalists and researchers may quote and chart any figure with a link. Tables come as CSV downloads.",
      cta: "See all studies",
      href: "/research",
    },
  },
  { id: "news", label: "News", href: "/news", groups: [], link: true },
];

export const CTA: NavLink = { label: "Free Career Test", href: "/career-test" };

export const FOOTER_COLUMNS: NavGroup[] = [
  {
    title: "Career Change",
    links: [
      { label: "Career Change Tool", href: "/career-change/tool" },
      { label: "Transferable Skills", href: "/transferable-skills" },
      { label: "Career Change Quiz", href: "/career-change/quiz" },
      { label: "Jobs Similar To", href: "/jobs-similar-to" },
    ],
  },
  {
    title: "Careers",
    links: [
      { label: "All Careers A–Z", href: "/careers/a-z" },
      { label: "Jobs Without a Degree", href: "/careers/education/no-degree" },
      { label: "Jobs for Introverts", href: "/careers/personality/introverts" },
      { label: "High-Paying Jobs", href: "/careers/salary/high-paying" },
    ],
  },
  {
    title: "Tests & Majors",
    links: [
      { label: "Free Career Test", href: "/career-test" },
      { label: "College Major Quiz", href: "/college-major-quiz" },
      { label: "Big Five Personality Test", href: "/big-five-personality-test" },
      { label: "All Majors A–Z", href: "/majors/a-z" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About", href: "/about" },
      { label: "Research", href: "/research" },
      { label: "News", href: "/news" },
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "Methodology", href: "/methodology" },
      { label: "Data Sources & Licenses", href: "/data-sources" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Contact", href: "/contact" },
      { label: "Alternatives", href: "/alternatives" },
    ],
  },
];

export const POPULAR_SEARCHES: NavLink[] = [
  { label: "Registered nurse", href: "/careers/registered-nurses" },
  { label: "Jobs without a degree", href: "/careers/education/no-degree" },
  { label: "Career change at 40", href: "/career-change/at-40" },
  { label: "Data scientist", href: "/careers/data-scientists" },
];
