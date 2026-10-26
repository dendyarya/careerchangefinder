"""Settings for the data build. Change weights here, not in build.py."""

ONET_VERSION = "31_0"
ONET_LABEL = "O*NET 31.0 (August 2026)"
BLS_LABEL = "BLS OEWS May 2025"
BLS_NATIONAL = "national_M2025_dl.xlsx"
BLS_STATE = "state_M2025_dl.xlsx"
NCES_LABEL = "NCES CIP 2020 to SOC 2018 crosswalk"

# Similarity score: weighted Pearson correlations of importance profiles.
WEIGHTS = {
    "skills": 0.35,      # Transferable Skills (importance)
    "knowledge": 0.25,   # Knowledge (importance)
    "activities": 0.15,  # Work Activities (importance)
    "interests": 0.15,   # Career Interest Types (RIASEC)
    "related": 0.10,     # O*NET Related Occupations bonus
}
RELATED_TIER_BONUS = {"Primary-Short": 1.0, "Primary-Long": 0.7, "Supplemental": 0.4}

# Job Zone adjustments, in score points (0-100 scale).
JOB_ZONE_UP_PENALTY = {1: 5, 2: 15, 3: 25, 4: 30}   # target needs N zones more prep
JOB_ZONE_DOWN_PENALTY = {1: 3, 2: 8, 3: 15, 4: 20}  # step down in level

# Pay drops hurt a career change: beyond -10%, lose 0.6 points per extra %, max 25.
# (Gate 2A: raised from 20% / 0.3 / 15 so Nurse targets are not dominated by big pay cuts.)
PAY_DROP_FREE_PCT = 10
PAY_DROP_POINTS_PER_PCT = 0.6
PAY_DROP_MAX_PENALTY = 25
# Gate 2A: a pay figure for a broader BLS group is shown with a label, but it is
# never used for "pay change" or for the pay-drop penalty.
GROUP_WAGE_IN_PAY_CHANGE = False

TOP_N = 25

# Careers with long, licensed professional training. Hidden as targets unless
# the source job is already in the same SOC minor group (e.g. 29-1).
HEAVY_LICENSE_PREFIXES = (
    "29-1011", "29-1021", "29-1022", "29-1023", "29-1024", "29-1029",  # chiropractors, dentists
    "29-1041", "29-1051", "29-1071", "29-1081", "29-1131", "29-1161", "29-1171",
    "29-12",                                            # physicians and surgeons
    "23-1011", "23-1012", "23-1021", "23-1022", "23-1023",  # lawyers, judges
    "19-3033", "19-3034", "19-3039",                    # licensed psychologists
)

# Popular "Jobs for Former ..." hubs: slug -> O*NET codes and display names.
# field_keywords: target titles containing these words count as "same field"
# (shown separately as similar roles), because the page is about leaving the field.
HUBS = {
    "teacher": {"singular": "Teacher", "plural": "Teachers",
                "codes": ["25-2021.00", "25-2022.00", "25-2031.00"],
                "field_keywords": ["Teacher", "Tutor", "Teaching", "Instructors"]},
    "nurse": {"singular": "Nurse", "plural": "Nurses", "codes": ["29-1141.00"],
              "field_keywords": ["Nurse", "Nursing"]},
    "accountant": {"singular": "Accountant", "plural": "Accountants", "codes": ["13-2011.00"]},
    "lawyer": {"singular": "Lawyer", "plural": "Lawyers", "codes": ["23-1011.00"]},
    "software-developer": {"singular": "Software Developer", "plural": "Software Developers",
                           "codes": ["15-1252.00"]},
    "police-officer": {"singular": "Police Officer", "plural": "Police Officers",
                       "codes": ["33-3051.00"]},
    "pharmacist": {"singular": "Pharmacist", "plural": "Pharmacists", "codes": ["29-1051.00"]},
    "social-worker": {"singular": "Social Worker", "plural": "Social Workers",
                      "codes": ["21-1021.00", "21-1022.00", "21-1023.00"]},
    "retail-worker": {"singular": "Retail Worker", "plural": "Retail Workers",
                      "codes": ["41-2031.00", "41-2011.00"]},
    "salesperson": {"singular": "Salesperson", "plural": "Salespeople", "codes": ["41-4012.00"]},
    "engineer": {"singular": "Engineer", "plural": "Engineers",
                 "codes": ["17-2141.00", "17-2051.00", "17-2071.00"]},
    "administrative-assistant": {"singular": "Administrative Assistant",
                                 "plural": "Administrative Assistants",
                                 "codes": ["43-6014.00", "43-6011.00"]},
}

# Work Context factors shown as "the hard parts" (scale 1-5, higher = more).
DOWNSIDE_FACTORS = {
    "Time Pressure": "Tight deadlines are common",
    "Consequence of Error": "Mistakes can have serious consequences",
    "Conflict Situations": "Dealing with conflict is part of the job",
    "Dealing with Violent or Physically Aggressive People": "May deal with aggressive people",
    "Exposed to Disease or Infections": "Exposure to disease or infection",
    "Exposed to Hazardous Conditions": "Exposure to hazardous conditions",
    "Spend Time Standing": "Long hours on your feet",
    "Outdoors, Exposed to All Weather Conditions": "Work outdoors in all weather",
}
DOWNSIDE_THRESHOLD = 3.5

JOB_ZONE_LABEL = {
    1: "Usually needs little or no preparation",
    2: "Usually needs a high school diploma",
    3: "Usually needs vocational training or an associate degree",
    4: "Usually needs a bachelor's degree",
    5: "Usually needs a graduate degree",
}

ATTRIBUTION = {
    "onet": "This site incorporates information from the O*NET 31.0 Database by the U.S. "
            "Department of Labor, Employment and Training Administration (USDOL/ETA). "
            "Used under the CC BY 4.0 license. O*NET is a trademark of USDOL/ETA.",
    "bls": "Wage data: U.S. Bureau of Labor Statistics, Occupational Employment and Wage "
           "Statistics, May 2025.",
    "nces": "Majors: U.S. Department of Education, Institute of Education Sciences, "
            "CIP 2020 to SOC 2018 crosswalk.",
}
