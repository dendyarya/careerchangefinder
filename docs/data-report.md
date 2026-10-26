# Data report

Built: 2026-10-26T22:14:30+00:00

Sources: O*NET 31.0 (August 2026), BLS OEWS May 2025, NCES CIP 2020 to SOC 2018 crosswalk

## Counts

| Item | Count |
|---|---|
| occupations | 1,016 |
| not_thin | 875 |
| majors | 1,901 |
| transitions | 875 |
| wage_files | 955 |
| hubs | 12 |

## Score settings

```json
{
  "weights": {
    "skills": 0.35,
    "knowledge": 0.25,
    "activities": 0.15,
    "interests": 0.15,
    "related": 0.1
  },
  "job_zone_up_penalty": {
    "1": 5,
    "2": 15,
    "3": 25,
    "4": 30
  },
  "job_zone_down_penalty": {
    "1": 3,
    "2": 8,
    "3": 15,
    "4": 20
  },
  "pay_drop": {
    "free_pct": 10,
    "points_per_pct": 0.6,
    "max_penalty": 25
  },
  "group_wage_in_pay_change": false
}
```

## Sample transitions (top 10 per hub)

Match = our estimate (0–99). Pay change vs. the source job's median. "Group" = pay is for a broader BLS group.

### Former Teachers (baseline median $66,847)

| # | Career | Match | Median pay | Pay change | Education | Note |
|---|---|---|---|---|---|---|
| 1 | Instructional Coordinators | 81 | $77,440 | +16% | Usually needs a graduate degree |  |
| 2 | Training and Development Specialists | 78 | $69,280 | +4% | Usually needs a bachelor's degree |  |
| 3 | Child, Family, and School Social Workers | 77 | $59,550 | −11% | Usually needs a bachelor's degree |  |
| 4 | Recreational Therapists | 76 | $61,960 | −7% | Usually needs a bachelor's degree |  |
| 5 | Health Education Specialists | 76 | $64,070 | −4% | Usually needs a bachelor's degree |  |
| 6 | Educational, Guidance, and Career Counselors and Advisors | 75 | $64,330 | −4% | Usually needs a graduate degree |  |
| 7 | Music Therapists | 74 | $77,930 | — | Usually needs a bachelor's degree | Group: Therapists, All Other |
| 8 | Mental Health and Substance Abuse Social Workers | 74 | $60,280 | −10% | Usually needs a graduate degree |  |
| 9 | Probation Officers and Correctional Treatment Specialists | 73 | $66,270 | −1% | Usually needs a bachelor's degree |  |
| 10 | Low Vision Therapists, Orientation and Mobility Specialists, and Vision Rehabilitation Therapists | 73 | $100,330 | — | Usually needs a graduate degree | Group: Occupational Therapists |

Similar roles in the same field: Kindergarten Teachers, Except Special Education (98), Special Education Teachers, Secondary School (96), Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors (96), Special Education Teachers, Middle School (93), Career/Technical Education Teachers, Middle School (90)

### Former Nurses (baseline median $97,550)

| # | Career | Match | Median pay | Pay change | Education | Note |
|---|---|---|---|---|---|---|
| 1 | Genetic Counselors | 70 | $100,040 | +3% | Usually needs a graduate degree |  |
| 2 | Clinical Research Coordinators | 70 | $167,220 | — | Usually needs a bachelor's degree | Group: Natural Sciences Managers |
| 3 | Health Specialties Teachers, Postsecondary | 69 | $107,310 | +10% | Usually needs a graduate degree |  |
| 4 | Adapted Physical Education Specialists | 68 | $76,580 | — | Usually needs a bachelor's degree | Group: Special Education Teachers, All Other |
| 5 | Occupational Therapy Assistants | 68 | $72,300 | −26% | Usually needs vocational training or an associate degree |  |
| 6 | Coroners | 67 | $80,730 | — | Usually needs vocational training or an associate degree | Group: Compliance Officers |
| 7 | Medical Dosimetrists | 66 | $147,470 | +51% | Usually needs a bachelor's degree |  |
| 8 | Physical Therapist Assistants | 66 | $68,380 | −30% | Usually needs vocational training or an associate degree |  |
| 9 | Magnetic Resonance Imaging Technologists | 66 | $95,480 | −2% | Usually needs vocational training or an associate degree |  |
| 10 | Nuclear Medicine Technologists | 66 | $101,370 | +4% | Usually needs vocational training or an associate degree |  |

Similar roles in the same field: Critical Care Nurses (95), Acute Care Nurses (94), Nurse Practitioners (87), Nurse Midwives (86), Clinical Nurse Specialists (85)

### Former Accountants (baseline median $83,680)

| # | Career | Match | Median pay | Pay change | Education | Note |
|---|---|---|---|---|---|---|
| 1 | Treasurers and Controllers | 92 | $166,570 | — | Usually needs a bachelor's degree | Group: Financial Managers |
| 2 | Financial Managers | 92 | $166,570 | +99% | Usually needs a bachelor's degree |  |
| 3 | Compensation, Benefits, and Job Analysis Specialists | 86 | $78,210 | −7% | Usually needs a bachelor's degree |  |
| 4 | Management Analysts | 84 | $101,860 | +22% | Usually needs a bachelor's degree |  |
| 5 | Securities, Commodities, and Financial Services Sales Agents | 82 | $78,660 | −6% | Usually needs a bachelor's degree |  |
| 6 | Actuaries | 82 | $130,000 | +55% | Usually needs a bachelor's degree |  |
| 7 | Document Management Specialists | 81 | $116,580 | — | Usually needs a bachelor's degree | Group: Computer Occupations, All Other |
| 8 | Claims Adjusters, Examiners, and Investigators | 80 | $78,000 | −7% | Usually needs a bachelor's degree |  |
| 9 | Purchasing Managers | 79 | $148,080 | +77% | Usually needs a bachelor's degree |  |
| 10 | Compliance Managers | 79 | $141,900 | — | Usually needs a bachelor's degree | Group: Managers, All Other |

Similar roles in the same field: Financial Examiners (93), Budget Analysts (92), Credit Analysts (91), Personal Financial Advisors (88), Insurance Underwriters (83)

### Former Retail Workers (baseline median $34,291)

| # | Career | Match | Median pay | Pay change | Education | Note |
|---|---|---|---|---|---|---|
| 1 | Tellers | 93 | $43,030 | +25% | Usually needs a high school diploma |  |
| 2 | Customer Service Representatives | 90 | $44,770 | +31% | Usually needs a high school diploma |  |
| 3 | Door-to-Door Sales Workers, News and Street Vendors, and Related Workers | 90 | $41,380 | +21% | Usually needs a high school diploma |  |
| 4 | Gambling Cage Workers | 88 | $37,580 | +10% | Usually needs a high school diploma |  |
| 5 | Postal Service Clerks | 88 | $62,130 | +81% | Usually needs a high school diploma |  |
| 6 | First-Line Supervisors of Retail Sales Workers | 88 | $48,520 | +41% | Usually needs a high school diploma |  |
| 7 | Stockers and Order Fillers | 86 | $37,330 | +9% | Usually needs a high school diploma |  |
| 8 | Demonstrators and Product Promoters | 86 | $39,320 | +15% | Usually needs a high school diploma |  |
| 9 | Telemarketers | 85 | $35,450 | +3% | Usually needs a high school diploma |  |
| 10 | Hotel, Motel, and Resort Desk Clerks | 85 | $35,070 | +2% | Usually needs a high school diploma |  |

Similar roles in the same field: Counter and Rental Clerks (91), Parts Salespersons (83), Gambling Change Persons and Booth Cashiers (82)

### Former Police Officers (baseline median $76,210)

| # | Career | Match | Median pay | Pay change | Education | Note |
|---|---|---|---|---|---|---|
| 1 | First-Line Supervisors of Police and Detectives | 84 | $106,040 | +39% | Usually needs a high school diploma |  |
| 2 | First-Line Supervisors of Correctional Officers | 80 | $77,970 | +2% | Usually needs vocational training or an associate degree |  |
| 3 | Coroners | 79 | $80,730 | — | Usually needs vocational training or an associate degree | Group: Compliance Officers |
| 4 | First-Line Supervisors of Firefighting and Prevention Workers | 77 | $93,530 | +23% | Usually needs vocational training or an associate degree |  |
| 5 | Compliance Officers | 75 | $80,730 | +6% | Usually needs a bachelor's degree |  |
| 6 | Fire Inspectors and Investigators | 74 | $75,920 | 0% | Usually needs vocational training or an associate degree |  |
| 7 | Air Traffic Controllers | 72 | $148,080 | +94% | Usually needs vocational training or an associate degree |  |
| 8 | Flight Attendants | 70 | $63,580 | −17% | Usually needs a high school diploma |  |
| 9 | Probation Officers and Correctional Treatment Specialists | 70 | $66,270 | −13% | Usually needs a bachelor's degree |  |
| 10 | Insurance Appraisers, Auto Damage | 68 | $78,240 | +3% | Usually needs vocational training or an associate degree |  |

Similar roles in the same field: Transit and Railroad Police (94), Detectives and Criminal Investigators (90), Customs and Border Protection Officers (87), Bailiffs (85), Police Identification and Records Officers (81)

## Thin occupations (noindex, not in sitemap)

141 of 1016 occupations lack BLS pay, full O*NET profiles, or are "All Other" groups.

- 11-1031.00 Legislators — no BLS median
- 11-9039.00 Education Administrators, All Other — All Other
- 11-9179.00 Personal Service Managers, All Other — All Other
- 11-9199.00 Managers, All Other — All Other
- 13-1021.00 Buyers and Purchasing Agents, Farm Products — no BLS median
- 13-1022.00 Wholesale and Retail Buyers, Except Farm Products — no BLS median
- 13-1023.00 Purchasing Agents, Except Wholesale, Retail, and Farm Products — no BLS median
- 13-1199.00 Business Operations Specialists, All Other — All Other
- 13-2022.00 Appraisers of Personal and Business Property — no BLS median
- 13-2023.00 Appraisers and Assessors of Real Estate — no BLS median
- 13-2051.00 Financial and Investment Analysts — incomplete O*NET profile
- 13-2054.00 Financial Risk Specialists — incomplete O*NET profile
- 13-2099.00 Financial Specialists, All Other — All Other
- 15-1299.00 Computer Occupations, All Other — All Other
- 15-2099.00 Mathematical Science Occupations, All Other — All Other
- 17-2199.00 Engineers, All Other — All Other
- 17-3019.00 Drafters, All Other — All Other
- 17-3028.00 Calibration Technologists and Technicians — incomplete O*NET profile
- 17-3029.00 Engineering Technologists and Technicians, Except Drafters, All Other — All Other
- 19-1029.00 Biological Scientists, All Other — All Other
- 19-1099.00 Life Scientists, All Other — All Other
- 19-2099.00 Physical Scientists, All Other — All Other
- 19-3039.00 Psychologists, All Other — All Other
- 19-3099.00 Social Scientists and Related Workers, All Other — All Other
- 19-4044.00 Hydrologic Technicians — incomplete O*NET profile
- 19-4099.00 Life, Physical, and Social Science Technicians, All Other — All Other
- 21-1011.00 Substance Abuse and Behavioral Disorder Counselors — no BLS median
- 21-1014.00 Mental Health Counselors — no BLS median
- 21-1019.00 Counselors, All Other — All Other
- 21-1029.00 Social Workers, All Other — All Other
- 21-1099.00 Community and Social Service Specialists, All Other — All Other
- 21-2099.00 Religious Workers, All Other — All Other
- 23-2099.00 Legal Support Workers, All Other — All Other
- 25-1069.00 Social Sciences Teachers, Postsecondary, All Other — All Other
- 25-1199.00 Postsecondary Teachers, All Other — All Other
- 25-2055.00 Special Education Teachers, Kindergarten — no BLS median
- 25-2056.00 Special Education Teachers, Elementary School — no BLS median
- 25-2059.00 Special Education Teachers, All Other — All Other
- 25-3099.00 Teachers and Instructors, All Other — All Other
- 25-9042.00 Teaching Assistants, Preschool, Elementary, Middle, and Secondary School, Except Special Education — no BLS median
- 25-9043.00 Teaching Assistants, Special Education — no BLS median
- 25-9049.00 Teaching Assistants, All Other — no BLS median, All Other
- 25-9099.00 Educational Instruction and Library Workers, All Other — All Other
- 27-1019.00 Artists and Related Workers, All Other — All Other
- 27-1029.00 Designers, All Other — All Other
- 27-2011.00 Actors — no BLS median
- 27-2031.00 Dancers — no BLS median
- 27-2042.00 Musicians and Singers — no BLS median
- 27-2091.00 Disc Jockeys, Except Radio — no BLS median
- 27-2099.00 Entertainers and Performers, Sports and Related Workers, All Other — no BLS median, All Other
- 27-3099.00 Media and Communication Workers, All Other — All Other
- 27-4015.00 Lighting Technicians — incomplete O*NET profile
- 27-4099.00 Media and Communication Equipment Workers, All Other — All Other
- 29-1029.00 Dentists, All Other Specialists — All Other
- 29-1129.00 Therapists, All Other — All Other
- 29-1212.00 Cardiologists — incomplete O*NET profile
- 29-1229.00 Physicians, All Other — All Other
- 29-1242.00 Orthopedic Surgeons, Except Pediatric — incomplete O*NET profile
- 29-1243.00 Pediatric Surgeons — incomplete O*NET profile
- 29-1249.00 Surgeons, All Other — All Other
- 29-1299.00 Healthcare Diagnosing or Treating Practitioners, All Other — All Other
- 29-2011.00 Medical and Clinical Laboratory Technologists — no BLS median
- 29-2011.01 Cytogenetic Technologists — no BLS median
- 29-2011.02 Cytotechnologists — no BLS median
- 29-2011.04 Histotechnologists — no BLS median
- 29-2012.00 Medical and Clinical Laboratory Technicians — no BLS median
- 29-2012.01 Histology Technicians — no BLS median
- 29-2042.00 Emergency Medical Technicians — incomplete O*NET profile
- 29-2099.00 Health Technologists and Technicians, All Other — All Other
- 29-9021.00 Health Information Technologists and Medical Registrars — incomplete O*NET profile
- 29-9099.00 Healthcare Practitioners and Technical Workers, All Other — All Other
- 31-1121.00 Home Health Aides — no BLS median
- 31-1122.00 Personal Care Aides — no BLS median
- 31-9099.00 Healthcare Support Workers, All Other — All Other
- 33-1099.00 First-Line Supervisors of Protective Service Workers, All Other — All Other
- 33-9099.00 Protective Service Workers, All Other — All Other
- 35-2019.00 Cooks, All Other — All Other
- 35-9099.00 Food Preparation and Serving Related Workers, All Other — All Other
- 37-2019.00 Building Cleaning Workers, All Other — All Other
- 37-3019.00 Grounds Maintenance Workers, All Other — All Other
- 39-3019.00 Gambling Service Workers, All Other — All Other
- 39-3099.00 Entertainment Attendants and Related Workers, All Other — All Other
- 39-4012.00 Crematory Operators — incomplete O*NET profile
- 39-7011.00 Tour Guides and Escorts — no BLS median
- 39-7012.00 Travel Guides — no BLS median
- 39-9099.00 Personal Care and Service Workers, All Other — All Other
- 41-9099.00 Sales and Related Workers, All Other — All Other
- 43-2099.00 Communications Equipment Operators, All Other — All Other
- 43-3099.00 Financial Clerks, All Other — All Other
- 43-4199.00 Information and Record Clerks, All Other — All Other
- 43-9199.00 Office and Administrative Support Workers, All Other — All Other
- 45-2099.00 Agricultural Workers, All Other — All Other
- 45-3031.00 Fishing and Hunting Workers — no BLS median
- 45-4029.00 Logging Workers, All Other — All Other
- 47-3019.00 Helpers, Construction Trades, All Other — All Other
- 47-4091.00 Segmental Pavers — no BLS median
- 47-4099.00 Construction and Related Workers, All Other — no BLS median, All Other
- 47-4099.03 Weatherization Installers and Technicians — no BLS median
- 47-5049.00 Underground Mining Machine Operators, All Other — All Other
- 47-5099.00 Extraction Workers, All Other — All Other
- 49-9069.00 Precision Instrument and Equipment Repairers, All Other — All Other
- 49-9099.00 Installation, Maintenance, and Repair Workers, All Other — All Other
- 51-2022.00 Electrical and Electronic Equipment Assemblers — no BLS median
- 51-2023.00 Electromechanical Equipment Assemblers — no BLS median
- 51-2092.00 Team Assemblers — no BLS median
- 51-2099.00 Assemblers and Fabricators, All Other — no BLS median, All Other
- 51-3099.00 Food Processing Workers, All Other — All Other
- 51-4199.00 Metal Workers and Plastic Workers, All Other — All Other
- 51-6099.00 Textile, Apparel, and Furnishings Workers, All Other — All Other
- 51-7099.00 Woodworkers, All Other — All Other
- 51-8099.00 Plant and System Operators, All Other — All Other
- 51-9199.00 Production Workers, All Other — All Other
- 53-1042.00 First-Line Supervisors of Helpers, Laborers, and Material Movers, Hand — no BLS median
- 53-1042.01 Recycling Coordinators — no BLS median
- 53-1043.00 First-Line Supervisors of Material-Moving Machine and Vehicle Operators — no BLS median
- 53-1044.00 First-Line Supervisors of Passenger Attendants — no BLS median
- 53-1049.00 First-Line Supervisors of Transportation Workers, All Other — no BLS median, All Other
- 53-3054.00 Taxi Drivers — incomplete O*NET profile
- 53-3099.00 Motor Vehicle Operators, All Other — All Other
- 53-4099.00 Rail Transportation Workers, All Other — All Other
- 53-6099.00 Transportation Workers, All Other — All Other
- 53-7199.00 Material Moving Workers, All Other — All Other
- 55-1011.00 Air Crew Officers — no BLS median
- 55-1012.00 Aircraft Launch and Recovery Officers — no BLS median
- 55-1013.00 Armored Assault Vehicle Officers — no BLS median
- 55-1014.00 Artillery and Missile Officers — no BLS median
- 55-1015.00 Command and Control Center Officers — no BLS median
- 55-1016.00 Infantry Officers — no BLS median
- 55-1017.00 Special Forces Officers — no BLS median
- 55-1019.00 Military Officer Special and Tactical Operations Leaders, All Other — no BLS median, All Other
- 55-2011.00 First-Line Supervisors of Air Crew Members — no BLS median
- 55-2012.00 First-Line Supervisors of Weapons Specialists/Crew Members — no BLS median
- 55-2013.00 First-Line Supervisors of All Other Tactical Operations Specialists — no BLS median, All Other
- 55-3011.00 Air Crew Members — no BLS median
- 55-3012.00 Aircraft Launch and Recovery Specialists — no BLS median
- 55-3013.00 Armored Assault Vehicle Crew Members — no BLS median
- 55-3014.00 Artillery and Missile Crew Members — no BLS median
- 55-3015.00 Command and Control Center Specialists — no BLS median
- 55-3016.00 Infantry — no BLS median
- 55-3018.00 Special Forces — no BLS median
- 55-3019.00 Military Enlisted Tactical Operations and Air/Weapons Specialists and Crew Members, All Other — no BLS median, All Other
