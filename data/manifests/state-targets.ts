/**
 * State statute targets for all 50 US states + District of Columbia.
 *
 * Each entry identifies a state and lists the cybersecurity/privacy-related
 * statutes to fetch and parse. Categories:
 *   - breach_notification: Data breach notification laws (all 51 jurisdictions)
 *   - privacy: Comprehensive consumer privacy laws (~19 states)
 *   - cybersecurity: Cybersecurity-specific mandates or safe harbors
 *
 * Parser types reflect the state's legislative website platform:
 *   - leginfo:     California leginfo.legislature.ca.gov
 *   - legislature:  Generic state legislature sites (most common)
 *   - simple-html: Fallback for simple HTML pages
 *   - custom:      States with unusual site structures
 */

export interface StatuteRef {
  /** Full name of the statute */
  name: string;
  /** Short identifier */
  shortName: string;
  /** Legal citation */
  citation: string;
  /** Statute category */
  category: 'breach_notification' | 'privacy' | 'cybersecurity';
  /** URL to official text on state legislature website */
  url: string;
  /** Parser to use */
  parserType: 'leginfo' | 'legislature' | 'simple-html' | 'custom';
  /** ISO date when statute became effective */
  effectiveDate: string;
  /** ISO date of last known amendment */
  lastAmended: string;
  /** Enforcement status */
  status: 'in_force' | 'amended' | 'repealed';
}

export interface StateTarget {
  /** ISO 3166-2 code, e.g. 'US-CA' */
  code: string;
  /** Full state name */
  name: string;
  /** Two-letter abbreviation */
  abbreviation: string;
  /** Statutes to fetch for this state */
  statutes: StatuteRef[];
}

export const STATE_TARGETS: StateTarget[] = [
  // ── Alabama ────────────────────────────────────────────────────────
  {
    code: 'US-AL',
    name: 'Alabama',
    abbreviation: 'AL',
    statutes: [
      {
        name: 'Alabama Data Breach Notification Act',
        shortName: 'AL Breach',
        citation: 'Ala. Code § 8-38-1 et seq.',
        category: 'breach_notification',
        url: 'https://alisondb.legislature.state.al.us/alison/CodeOfAlabama/1975/Coatoc.htm',
        parserType: 'legislature',
        effectiveDate: '2018-06-01',
        lastAmended: '2018-03-28',
        status: 'in_force',
      },
    ],
  },

  // ── Alaska ─────────────────────────────────────────────────────────
  {
    code: 'US-AK',
    name: 'Alaska',
    abbreviation: 'AK',
    statutes: [
      {
        name: 'Alaska Personal Information Protection Act',
        shortName: 'AK Breach',
        citation: 'Alaska Stat. § 45.48.010 et seq.',
        category: 'breach_notification',
        url: 'https://www.akleg.gov/basis/statutes.asp#45.48',
        parserType: 'legislature',
        effectiveDate: '2009-07-01',
        lastAmended: '2009-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Arizona ────────────────────────────────────────────────────────
  {
    code: 'US-AZ',
    name: 'Arizona',
    abbreviation: 'AZ',
    statutes: [
      {
        name: 'Arizona Data Breach Notification Law',
        shortName: 'AZ Breach',
        citation: 'Ariz. Rev. Stat. § 18-552',
        category: 'breach_notification',
        url: 'https://www.azleg.gov/ars/18/00552.htm',
        parserType: 'legislature',
        effectiveDate: '2006-12-31',
        lastAmended: '2018-08-03',
        status: 'in_force',
      },
    ],
  },

  // ── Arkansas ───────────────────────────────────────────────────────
  {
    code: 'US-AR',
    name: 'Arkansas',
    abbreviation: 'AR',
    statutes: [
      {
        name: 'Arkansas Personal Information Protection Act',
        shortName: 'AR Breach',
        citation: 'Ark. Code § 4-110-101 et seq.',
        category: 'breach_notification',
        url: 'https://www.arkleg.state.ar.us/Bills/FTPDocument?path=%2FACS%2F2005%2FPublic%2FACT1526.pdf',
        parserType: 'legislature',
        effectiveDate: '2005-08-12',
        lastAmended: '2019-04-16',
        status: 'in_force',
      },
    ],
  },

  // ── California ─────────────────────────────────────────────────────
  {
    code: 'US-CA',
    name: 'California',
    abbreviation: 'CA',
    statutes: [
      {
        name: 'California Data Breach Notification Law',
        shortName: 'CA Breach',
        citation: 'Cal. Civ. Code § 1798.82',
        category: 'breach_notification',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.82.&lawCode=CIV',
        parserType: 'leginfo',
        effectiveDate: '2003-07-01',
        lastAmended: '2023-01-01',
        status: 'in_force',
      },
      {
        name: 'California Consumer Privacy Act / California Privacy Rights Act',
        shortName: 'CCPA/CPRA',
        citation: 'Cal. Civ. Code § 1798.100 et seq.',
        category: 'privacy',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5',
        parserType: 'leginfo',
        effectiveDate: '2020-01-01',
        lastAmended: '2023-01-01',
        status: 'in_force',
      },
    ],
  },

  // ── Colorado ───────────────────────────────────────────────────────
  {
    code: 'US-CO',
    name: 'Colorado',
    abbreviation: 'CO',
    statutes: [
      {
        name: 'Colorado Consumer Data Breach Notification',
        shortName: 'CO Breach',
        citation: 'Colo. Rev. Stat. § 6-1-716',
        category: 'breach_notification',
        url: 'https://leg.colorado.gov/sites/default/files/images/olls/crs2023-title-06.pdf',
        parserType: 'legislature',
        effectiveDate: '2006-09-01',
        lastAmended: '2018-09-01',
        status: 'in_force',
      },
      {
        name: 'Colorado Privacy Act',
        shortName: 'CPA',
        citation: 'Colo. Rev. Stat. § 6-1-1301 et seq.',
        category: 'privacy',
        url: 'https://leg.colorado.gov/bills/sb21-190',
        parserType: 'legislature',
        effectiveDate: '2023-07-01',
        lastAmended: '2023-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Connecticut ────────────────────────────────────────────────────
  {
    code: 'US-CT',
    name: 'Connecticut',
    abbreviation: 'CT',
    statutes: [
      {
        name: 'Connecticut Data Breach Notification Law',
        shortName: 'CT Breach',
        citation: 'Conn. Gen. Stat. § 36a-701b',
        category: 'breach_notification',
        url: 'https://www.cga.ct.gov/current/pub/chap_669.htm#sec_36a-701b',
        parserType: 'legislature',
        effectiveDate: '2005-10-01',
        lastAmended: '2021-10-01',
        status: 'in_force',
      },
      {
        name: 'Connecticut Data Privacy Act',
        shortName: 'CTDPA',
        citation: 'Conn. Gen. Stat. § 42-515 et seq.',
        category: 'privacy',
        url: 'https://www.cga.ct.gov/current/pub/chap_743dd.htm',
        parserType: 'legislature',
        effectiveDate: '2023-07-01',
        lastAmended: '2023-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Delaware ───────────────────────────────────────────────────────
  {
    code: 'US-DE',
    name: 'Delaware',
    abbreviation: 'DE',
    statutes: [
      {
        name: 'Delaware Computer Security Breaches',
        shortName: 'DE Breach',
        citation: 'Del. Code tit. 6, § 12B-101 et seq.',
        category: 'breach_notification',
        url: 'https://delcode.delaware.gov/title6/c012b/index.html',
        parserType: 'legislature',
        effectiveDate: '2005-06-28',
        lastAmended: '2017-08-17',
        status: 'in_force',
      },
      {
        name: 'Delaware Personal Data Privacy Act',
        shortName: 'DPDPA',
        citation: 'Del. Code tit. 6, ch. 12D',
        category: 'privacy',
        url: 'https://delcode.delaware.gov/title6/c012d/index.html',
        parserType: 'legislature',
        effectiveDate: '2025-01-01',
        lastAmended: '2024-09-11',
        status: 'in_force',
      },
    ],
  },

  // ── District of Columbia ───────────────────────────────────────────
  {
    code: 'US-DC',
    name: 'District of Columbia',
    abbreviation: 'DC',
    statutes: [
      {
        name: 'DC Security Breach Notification Act',
        shortName: 'DC Breach',
        citation: 'D.C. Code § 28-3851 et seq.',
        category: 'breach_notification',
        url: 'https://code.dccouncil.gov/us/dc/council/code/titles/28/chapters/38/subchapters/II',
        parserType: 'custom',
        effectiveDate: '2007-03-08',
        lastAmended: '2020-06-17',
        status: 'in_force',
      },
    ],
  },

  // ── Florida ────────────────────────────────────────────────────────
  {
    code: 'US-FL',
    name: 'Florida',
    abbreviation: 'FL',
    statutes: [
      {
        name: 'Florida Information Protection Act',
        shortName: 'FIPA',
        citation: 'Fla. Stat. § 501.171',
        category: 'breach_notification',
        url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.171.html',
        parserType: 'legislature',
        effectiveDate: '2014-07-01',
        lastAmended: '2014-06-20',
        status: 'in_force',
      },
    ],
  },

  // ── Georgia ────────────────────────────────────────────────────────
  {
    code: 'US-GA',
    name: 'Georgia',
    abbreviation: 'GA',
    statutes: [
      {
        name: 'Georgia Personal Identity Protection Act',
        shortName: 'GA Breach',
        citation: 'Ga. Code § 10-1-912',
        category: 'breach_notification',
        url: 'https://www.legis.ga.gov/api/legislation/document/20052006/24776',
        parserType: 'legislature',
        effectiveDate: '2005-05-05',
        lastAmended: '2005-05-05',
        status: 'in_force',
      },
    ],
  },

  // ── Hawaii ─────────────────────────────────────────────────────────
  {
    code: 'US-HI',
    name: 'Hawaii',
    abbreviation: 'HI',
    statutes: [
      {
        name: 'Hawaii Security Breach of Personal Information',
        shortName: 'HI Breach',
        citation: 'Haw. Rev. Stat. § 487N-2',
        category: 'breach_notification',
        url: 'https://www.capitol.hawaii.gov/hrscurrent/Vol11_Ch0476-0490/HRS0487N/HRS_0487N-0002.htm',
        parserType: 'legislature',
        effectiveDate: '2007-01-01',
        lastAmended: '2008-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Idaho ──────────────────────────────────────────────────────────
  {
    code: 'US-ID',
    name: 'Idaho',
    abbreviation: 'ID',
    statutes: [
      {
        name: 'Idaho Data Breach Notification Act',
        shortName: 'ID Breach',
        citation: 'Idaho Code § 28-51-104 et seq.',
        category: 'breach_notification',
        url: 'https://legislature.idaho.gov/statutesrules/idstat/Title28/T28CH51/',
        parserType: 'legislature',
        effectiveDate: '2006-07-01',
        lastAmended: '2006-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Illinois ───────────────────────────────────────────────────────
  {
    code: 'US-IL',
    name: 'Illinois',
    abbreviation: 'IL',
    statutes: [
      {
        name: 'Illinois Personal Information Protection Act',
        shortName: 'IL Breach',
        citation: '815 ILCS 530/',
        category: 'breach_notification',
        url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2702&ChapterID=67',
        parserType: 'legislature',
        effectiveDate: '2006-06-27',
        lastAmended: '2020-01-01',
        status: 'in_force',
      },
    ],
  },

  // ── Indiana ────────────────────────────────────────────────────────
  {
    code: 'US-IN',
    name: 'Indiana',
    abbreviation: 'IN',
    statutes: [
      {
        name: 'Indiana Disclosure of Security Breach',
        shortName: 'IN Breach',
        citation: 'Ind. Code § 24-4.9-1-1 et seq.',
        category: 'breach_notification',
        url: 'http://iga.in.gov/laws/2024/ic/titles/24#24-4.9',
        parserType: 'legislature',
        effectiveDate: '2006-07-01',
        lastAmended: '2023-07-01',
        status: 'in_force',
      },
      {
        name: 'Indiana Consumer Data Protection Act',
        shortName: 'INCDPA',
        citation: 'Ind. Code § 24-15-1-1 et seq.',
        category: 'privacy',
        url: 'http://iga.in.gov/laws/2024/ic/titles/24#24-15',
        parserType: 'legislature',
        effectiveDate: '2026-01-01',
        lastAmended: '2023-05-01',
        status: 'in_force',
      },
    ],
  },

  // ── Iowa ───────────────────────────────────────────────────────────
  {
    code: 'US-IA',
    name: 'Iowa',
    abbreviation: 'IA',
    statutes: [
      {
        name: 'Iowa Breach of Security Notification',
        shortName: 'IA Breach',
        citation: 'Iowa Code § 715C.1 et seq.',
        category: 'breach_notification',
        url: 'https://www.legis.iowa.gov/law/iowaCode/sections?codeChapter=715C',
        parserType: 'legislature',
        effectiveDate: '2008-07-01',
        lastAmended: '2014-07-01',
        status: 'in_force',
      },
      {
        name: 'Iowa Consumer Data Protection Act',
        shortName: 'IACDPA',
        citation: 'Iowa Code ch. 715D',
        category: 'privacy',
        url: 'https://www.legis.iowa.gov/law/iowaCode/sections?codeChapter=715D',
        parserType: 'legislature',
        effectiveDate: '2025-01-01',
        lastAmended: '2023-03-29',
        status: 'in_force',
      },
    ],
  },

  // ── Kansas ─────────────────────────────────────────────────────────
  {
    code: 'US-KS',
    name: 'Kansas',
    abbreviation: 'KS',
    statutes: [
      {
        name: 'Kansas Consumer Protection — Breach of Security',
        shortName: 'KS Breach',
        citation: 'Kan. Stat. § 50-7a01 et seq.',
        category: 'breach_notification',
        url: 'https://www.ksrevisor.org/statutes/chapters/ch50/050_007a_0001.html',
        parserType: 'legislature',
        effectiveDate: '2006-07-01',
        lastAmended: '2006-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Kentucky ───────────────────────────────────────────────────────
  {
    code: 'US-KY',
    name: 'Kentucky',
    abbreviation: 'KY',
    statutes: [
      {
        name: 'Kentucky Data Breach Notification',
        shortName: 'KY Breach',
        citation: 'Ky. Rev. Stat. § 365.732',
        category: 'breach_notification',
        url: 'https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=54484',
        parserType: 'legislature',
        effectiveDate: '2014-07-15',
        lastAmended: '2014-07-15',
        status: 'in_force',
      },
      {
        name: 'Kentucky Consumer Data Protection Act',
        shortName: 'KYCDPA',
        citation: 'Ky. Rev. Stat. ch. 367.500 et seq.',
        category: 'privacy',
        url: 'https://apps.legislature.ky.gov/law/statutes/chapter.aspx?id=39365',
        parserType: 'legislature',
        effectiveDate: '2026-01-01',
        lastAmended: '2024-04-04',
        status: 'in_force',
      },
    ],
  },

  // ── Louisiana ──────────────────────────────────────────────────────
  {
    code: 'US-LA',
    name: 'Louisiana',
    abbreviation: 'LA',
    statutes: [
      {
        name: 'Louisiana Database Security Breach Notification Law',
        shortName: 'LA Breach',
        citation: 'La. Rev. Stat. § 51:3071 et seq.',
        category: 'breach_notification',
        url: 'https://www.legis.la.gov/legis/Law.aspx?d=322028',
        parserType: 'legislature',
        effectiveDate: '2006-01-01',
        lastAmended: '2018-08-01',
        status: 'in_force',
      },
    ],
  },

  // ── Maine ──────────────────────────────────────────────────────────
  {
    code: 'US-ME',
    name: 'Maine',
    abbreviation: 'ME',
    statutes: [
      {
        name: 'Maine Notice of Risk to Personal Data Act',
        shortName: 'ME Breach',
        citation: 'Me. Rev. Stat. tit. 10, § 1348 et seq.',
        category: 'breach_notification',
        url: 'https://legislature.maine.gov/statutes/10/title10sec1348.html',
        parserType: 'legislature',
        effectiveDate: '2006-01-31',
        lastAmended: '2019-09-19',
        status: 'in_force',
      },
    ],
  },

  // ── Maryland ───────────────────────────────────────────────────────
  {
    code: 'US-MD',
    name: 'Maryland',
    abbreviation: 'MD',
    statutes: [
      {
        name: 'Maryland Personal Information Protection Act',
        shortName: 'MD Breach',
        citation: 'Md. Code, Com. Law § 14-3501 et seq.',
        category: 'breach_notification',
        url: 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcl&section=14-3504',
        parserType: 'legislature',
        effectiveDate: '2008-01-01',
        lastAmended: '2022-06-01',
        status: 'in_force',
      },
      {
        name: 'Maryland Online Data Privacy Act',
        shortName: 'MODPA',
        citation: 'Md. Code, Com. Law § 14-4601 et seq.',
        category: 'privacy',
        url: 'https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/sb0541?ys=2024RS',
        parserType: 'legislature',
        effectiveDate: '2025-10-01',
        lastAmended: '2024-05-09',
        status: 'in_force',
      },
    ],
  },

  // ── Massachusetts ──────────────────────────────────────────────────
  {
    code: 'US-MA',
    name: 'Massachusetts',
    abbreviation: 'MA',
    statutes: [
      {
        name: 'Massachusetts Data Breach Notification Law',
        shortName: 'MA Breach',
        citation: 'Mass. Gen. Laws ch. 93H',
        category: 'breach_notification',
        url: 'https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXV/Chapter93H',
        parserType: 'legislature',
        effectiveDate: '2007-10-31',
        lastAmended: '2019-04-11',
        status: 'in_force',
      },
      {
        name: 'Massachusetts Standards for Protection of Personal Information',
        shortName: 'MA 201 CMR 17.00',
        citation: '201 CMR 17.00',
        category: 'cybersecurity',
        url: 'https://www.mass.gov/regulations/201-CMR-17-standards-for-the-protection-of-personal-information-of-residents-of-the-commonwealth',
        parserType: 'simple-html',
        effectiveDate: '2010-03-01',
        lastAmended: '2010-03-01',
        status: 'in_force',
      },
    ],
  },

  // ── Michigan ───────────────────────────────────────────────────────
  {
    code: 'US-MI',
    name: 'Michigan',
    abbreviation: 'MI',
    statutes: [
      {
        name: 'Michigan Identity Theft Protection Act',
        shortName: 'MI Breach',
        citation: 'Mich. Comp. Laws § 445.72',
        category: 'breach_notification',
        url: 'https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-72',
        parserType: 'legislature',
        effectiveDate: '2007-07-02',
        lastAmended: '2007-07-02',
        status: 'in_force',
      },
    ],
  },

  // ── Minnesota ──────────────────────────────────────────────────────
  {
    code: 'US-MN',
    name: 'Minnesota',
    abbreviation: 'MN',
    statutes: [
      {
        name: 'Minnesota Data Breach Notification',
        shortName: 'MN Breach',
        citation: 'Minn. Stat. § 325E.61',
        category: 'breach_notification',
        url: 'https://www.revisor.mn.gov/statutes/cite/325E.61',
        parserType: 'legislature',
        effectiveDate: '2006-01-01',
        lastAmended: '2023-07-01',
        status: 'in_force',
      },
      {
        name: 'Minnesota Consumer Data Privacy Act',
        shortName: 'MNCDPA',
        citation: 'Minn. Stat. ch. 325O',
        category: 'privacy',
        url: 'https://www.revisor.mn.gov/statutes/cite/325O',
        parserType: 'legislature',
        effectiveDate: '2025-07-31',
        lastAmended: '2024-05-24',
        status: 'in_force',
      },
    ],
  },

  // ── Mississippi ────────────────────────────────────────────────────
  {
    code: 'US-MS',
    name: 'Mississippi',
    abbreviation: 'MS',
    statutes: [
      {
        name: 'Mississippi Data Breach Notification Law',
        shortName: 'MS Breach',
        citation: 'Miss. Code § 75-24-29',
        category: 'breach_notification',
        url: 'https://law.justia.com/codes/mississippi/title-75/chapter-24/in-general/section-75-24-29/',
        parserType: 'simple-html',
        effectiveDate: '2011-07-01',
        lastAmended: '2011-07-01',
        status: 'in_force',
      },
    ],
  },

  // ── Missouri ───────────────────────────────────────────────────────
  {
    code: 'US-MO',
    name: 'Missouri',
    abbreviation: 'MO',
    statutes: [
      {
        name: 'Missouri Breach Notification Law',
        shortName: 'MO Breach',
        citation: 'Mo. Rev. Stat. § 407.1500',
        category: 'breach_notification',
        url: 'https://revisor.mo.gov/main/OneSection.aspx?section=407.1500',
        parserType: 'legislature',
        effectiveDate: '2009-08-28',
        lastAmended: '2009-08-28',
        status: 'in_force',
      },
    ],
  },

  // ── Montana ────────────────────────────────────────────────────────
  {
    code: 'US-MT',
    name: 'Montana',
    abbreviation: 'MT',
    statutes: [
      {
        name: 'Montana Data Breach Notification',
        shortName: 'MT Breach',
        citation: 'Mont. Code § 30-14-1704',
        category: 'breach_notification',
        url: 'https://leg.mt.gov/bills/mca/title_0300/chapter_0140/part_0170/section_0040/0300-0140-0170-0040.html',
        parserType: 'legislature',
        effectiveDate: '2006-03-01',
        lastAmended: '2015-10-01',
        status: 'in_force',
      },
      {
        name: 'Montana Consumer Data Privacy Act',
        shortName: 'MTCDPA',
        citation: 'Mont. Code § 30-14-2801 et seq.',
        category: 'privacy',
        url: 'https://leg.mt.gov/bills/mca/title_0300/chapter_0140/part_0280/sections_index.html',
        parserType: 'legislature',
        effectiveDate: '2024-10-01',
        lastAmended: '2023-05-19',
        status: 'in_force',
      },
    ],
  },

  // ── Nebraska ───────────────────────────────────────────────────────
  {
    code: 'US-NE',
    name: 'Nebraska',
    abbreviation: 'NE',
    statutes: [
      {
        name: 'Nebraska Financial Data Protection and Consumer Notification Act',
        shortName: 'NE Breach',
        citation: 'Neb. Rev. Stat. § 87-801 et seq.',
        category: 'breach_notification',
        url: 'https://nebraskalegislature.gov/laws/statutes.php?statute=87-801',
        parserType: 'legislature',
        effectiveDate: '2006-07-14',
        lastAmended: '2016-07-21',
        status: 'in_force',
      },
      {
        name: 'Nebraska Data Privacy Act',
        shortName: 'NEDPA',
        citation: 'Neb. Rev. Stat. § 87-1101 et seq.',
        category: 'privacy',
        url: 'https://nebraskalegislature.gov/laws/statutes.php?statute=87-1101',
        parserType: 'legislature',
        effectiveDate: '2025-01-01',
        lastAmended: '2024-04-17',
        status: 'in_force',
      },
    ],
  },

  // ── Nevada ─────────────────────────────────────────────────────────
  {
    code: 'US-NV',
    name: 'Nevada',
    abbreviation: 'NV',
    statutes: [
      {
        name: 'Nevada Data Breach Notification',
        shortName: 'NV Breach',
        citation: 'Nev. Rev. Stat. § 603A.010 et seq.',
        category: 'breach_notification',
        url: 'https://www.leg.state.nv.us/nrs/nrs-603a.html',
        parserType: 'legislature',
        effectiveDate: '2006-01-01',
        lastAmended: '2019-10-01',
        status: 'in_force',
      },
    ],
  },

  // ── New Hampshire ──────────────────────────────────────────────────
  {
    code: 'US-NH',
    name: 'New Hampshire',
    abbreviation: 'NH',
    statutes: [
      {
        name: 'New Hampshire Data Breach Notification',
        shortName: 'NH Breach',
        citation: 'N.H. Rev. Stat. § 359-C:19 et seq.',
        category: 'breach_notification',
        url: 'https://www.gencourt.state.nh.us/rsa/html/XXXI/359-C/359-C-mrg.htm',
        parserType: 'legislature',
        effectiveDate: '2007-01-01',
        lastAmended: '2019-09-10',
        status: 'in_force',
      },
      {
        name: 'New Hampshire Privacy Act',
        shortName: 'NHPA',
        citation: 'N.H. Rev. Stat. ch. 507-H',
        category: 'privacy',
        url: 'https://www.gencourt.state.nh.us/rsa/html/LII/507-H/507-H-mrg.htm',
        parserType: 'legislature',
        effectiveDate: '2025-01-01',
        lastAmended: '2024-09-06',
        status: 'in_force',
      },
    ],
  },

  // ── New Jersey ─────────────────────────────────────────────────────
  {
    code: 'US-NJ',
    name: 'New Jersey',
    abbreviation: 'NJ',
    statutes: [
      {
        name: 'New Jersey Data Breach Notification Law',
        shortName: 'NJ Breach',
        citation: 'N.J. Stat. § 56:8-161 et seq.',
        category: 'breach_notification',
        url: 'https://www.njleg.state.nj.us/Bills/2004/AL05/198_.HTM',
        parserType: 'legislature',
        effectiveDate: '2006-01-01',
        lastAmended: '2019-09-17',
        status: 'in_force',
      },
      {
        name: 'New Jersey Data Privacy Act',
        shortName: 'NJDPA',
        citation: 'N.J. Stat. § 56:8-166.1 et seq.',
        category: 'privacy',
        url: 'https://www.njleg.state.nj.us/Bills/2024/S0332_R3.HTM',
        parserType: 'legislature',
        effectiveDate: '2025-01-15',
        lastAmended: '2024-01-16',
        status: 'in_force',
      },
    ],
  },

  // ── New Mexico ─────────────────────────────────────────────────────
  {
    code: 'US-NM',
    name: 'New Mexico',
    abbreviation: 'NM',
    statutes: [
      {
        name: 'New Mexico Data Breach Notification Act',
        shortName: 'NM Breach',
        citation: 'N.M. Stat. § 57-12C-1 et seq.',
        category: 'breach_notification',
        url: 'https://nmonesource.com/nmos/nmsa/en/item/4352/index.do#!fragment/zoupio-_Toc128411024',
        parserType: 'custom',
        effectiveDate: '2017-06-16',
        lastAmended: '2017-06-16',
        status: 'in_force',
      },
    ],
  },

  // ── New York ───────────────────────────────────────────────────────
  {
    code: 'US-NY',
    name: 'New York',
    abbreviation: 'NY',
    statutes: [
      {
        name: 'New York Information Security Breach and Notification Act',
        shortName: 'NY Breach',
        citation: 'N.Y. Gen. Bus. Law § 899-aa',
        category: 'breach_notification',
        url: 'https://www.nysenate.gov/legislation/laws/GBS/899-AA',
        parserType: 'legislature',
        effectiveDate: '2005-12-07',
        lastAmended: '2019-10-23',
        status: 'in_force',
      },
      {
        name: 'Stop Hacks and Improve Electronic Data Security Act',
        shortName: 'SHIELD Act',
        citation: 'N.Y. Gen. Bus. Law § 899-bb',
        category: 'cybersecurity',
        url: 'https://www.nysenate.gov/legislation/laws/GBS/899-BB',
        parserType: 'legislature',
        effectiveDate: '2020-03-21',
        lastAmended: '2019-07-25',
        status: 'in_force',
      },
    ],
  },

  // ── North Carolina ─────────────────────────────────────────────────
  {
    code: 'US-NC',
    name: 'North Carolina',
    abbreviation: 'NC',
    statutes: [
      {
        name: 'North Carolina Identity Theft Protection Act',
        shortName: 'NC Breach',
        citation: 'N.C. Gen. Stat. § 75-61 et seq.',
        category: 'breach_notification',
        url: 'https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/BySection/Chapter_75/GS_75-65.pdf',
        parserType: 'legislature',
        effectiveDate: '2005-12-01',
        lastAmended: '2005-12-01',
        status: 'in_force',
      },
    ],
  },

  // ── North Dakota ───────────────────────────────────────────────────
  {
    code: 'US-ND',
    name: 'North Dakota',
    abbreviation: 'ND',
    statutes: [
      {
        name: 'North Dakota Data Breach Notification',
        shortName: 'ND Breach',
        citation: 'N.D. Cent. Code § 51-30-01 et seq.',
        category: 'breach_notification',
        url: 'https://www.ndlegis.gov/cencode/t51c30.pdf',
        parserType: 'simple-html',
        effectiveDate: '2005-06-01',
        lastAmended: '2019-08-01',
        status: 'in_force',
      },
    ],
  },

  // ── Ohio ───────────────────────────────────────────────────────────
  {
    code: 'US-OH',
    name: 'Ohio',
    abbreviation: 'OH',
    statutes: [
      {
        name: 'Ohio Data Breach Notification',
        shortName: 'OH Breach',
        citation: 'Ohio Rev. Code § 1349.19',
        category: 'breach_notification',
        url: 'https://codes.ohio.gov/ohio-revised-code/section-1349.19',
        parserType: 'legislature',
        effectiveDate: '2006-02-17',
        lastAmended: '2018-11-02',
        status: 'in_force',
      },
      {
        name: 'Ohio Data Protection Act (Cybersecurity Safe Harbor)',
        shortName: 'OH DPA',
        citation: 'Ohio Rev. Code § 1354.01 et seq.',
        category: 'cybersecurity',
        url: 'https://codes.ohio.gov/ohio-revised-code/chapter-1354',
        parserType: 'legislature',
        effectiveDate: '2018-11-02',
        lastAmended: '2018-08-03',
        status: 'in_force',
      },
    ],
  },

  // ── Oklahoma ───────────────────────────────────────────────────────
  {
    code: 'US-OK',
    name: 'Oklahoma',
    abbreviation: 'OK',
    statutes: [
      {
        name: 'Oklahoma Security Breach Notification Act',
        shortName: 'OK Breach',
        citation: 'Okla. Stat. tit. 24, § 161 et seq.',
        category: 'breach_notification',
        url: 'https://www.oscn.net/applications/oscn/deliverdocument.asp?citeID=440863',
        parserType: 'custom',
        effectiveDate: '2006-11-01',
        lastAmended: '2008-11-01',
        status: 'in_force',
      },
    ],
  },

  // ── Oregon ─────────────────────────────────────────────────────────
  {
    code: 'US-OR',
    name: 'Oregon',
    abbreviation: 'OR',
    statutes: [
      {
        name: 'Oregon Consumer Identity Theft Protection Act',
        shortName: 'OR Breach',
        citation: 'Or. Rev. Stat. § 646A.604',
        category: 'breach_notification',
        url: 'https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html',
        parserType: 'legislature',
        effectiveDate: '2007-10-01',
        lastAmended: '2019-09-29',
        status: 'in_force',
      },
      {
        name: 'Oregon Consumer Privacy Act',
        shortName: 'OCPA',
        citation: 'Or. Rev. Stat. § 646A.570 et seq.',
        category: 'privacy',
        url: 'https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html',
        parserType: 'legislature',
        effectiveDate: '2024-07-01',
        lastAmended: '2023-07-18',
        status: 'in_force',
      },
    ],
  },

  // ── Pennsylvania ───────────────────────────────────────────────────
  {
    code: 'US-PA',
    name: 'Pennsylvania',
    abbreviation: 'PA',
    statutes: [
      {
        name: 'Pennsylvania Breach of Personal Information Notification Act',
        shortName: 'PA Breach',
        citation: '73 Pa. Stat. § 2303',
        category: 'breach_notification',
        url: 'https://www.legis.state.pa.us/cfdocs/legis/LI/uconsCheck.cfm?txtType=HTM&yr=2005&sessInd=0&smthLwInd=0&act=94&chpt=0&sctn=3&subsctn=0',
        parserType: 'legislature',
        effectiveDate: '2006-06-20',
        lastAmended: '2022-11-03',
        status: 'in_force',
      },
    ],
  },

  // ── Rhode Island ───────────────────────────────────────────────────
  {
    code: 'US-RI',
    name: 'Rhode Island',
    abbreviation: 'RI',
    statutes: [
      {
        name: 'Rhode Island Identity Theft Protection Act',
        shortName: 'RI Breach',
        citation: 'R.I. Gen. Laws § 11-49.3-1 et seq.',
        category: 'breach_notification',
        url: 'http://webserver.rilegislature.gov/Statutes/TITLE11/11-49.3/INDEX.htm',
        parserType: 'legislature',
        effectiveDate: '2006-07-10',
        lastAmended: '2016-06-29',
        status: 'in_force',
      },
      {
        name: 'Rhode Island Data Transparency and Privacy Protection Act',
        shortName: 'RIDTPPA',
        citation: 'R.I. Gen. Laws § 6-48.1-1 et seq.',
        category: 'privacy',
        url: 'http://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/INDEX.htm',
        parserType: 'legislature',
        effectiveDate: '2026-01-01',
        lastAmended: '2024-06-25',
        status: 'in_force',
      },
    ],
  },

  // ── South Carolina ─────────────────────────────────────────────────
  {
    code: 'US-SC',
    name: 'South Carolina',
    abbreviation: 'SC',
    statutes: [
      {
        name: 'South Carolina Financial Identity Fraud and Identity Theft Protection Act',
        shortName: 'SC Breach',
        citation: 'S.C. Code § 39-1-90',
        category: 'breach_notification',
        url: 'https://www.scstatehouse.gov/code/t39c001.php',
        parserType: 'legislature',
        effectiveDate: '2009-07-01',
        lastAmended: '2013-06-07',
        status: 'in_force',
      },
    ],
  },

  // ── South Dakota ───────────────────────────────────────────────────
  {
    code: 'US-SD',
    name: 'South Dakota',
    abbreviation: 'SD',
    statutes: [
      {
        name: 'South Dakota Data Breach Notification',
        shortName: 'SD Breach',
        citation: 'S.D. Codified Laws § 22-40-19 et seq.',
        category: 'breach_notification',
        url: 'https://sdlegislature.gov/Statutes/Codified_Laws/2078844',
        parserType: 'legislature',
        effectiveDate: '2018-07-01',
        lastAmended: '2018-03-21',
        status: 'in_force',
      },
    ],
  },

  // ── Tennessee ──────────────────────────────────────────────────────
  {
    code: 'US-TN',
    name: 'Tennessee',
    abbreviation: 'TN',
    statutes: [
      {
        name: 'Tennessee Data Breach Notification',
        shortName: 'TN Breach',
        citation: 'Tenn. Code § 47-18-2107',
        category: 'breach_notification',
        url: 'https://www.tn.gov/content/dam/tn/attorneygeneral/documents/foi/breach-notification-statutes.pdf',
        parserType: 'simple-html',
        effectiveDate: '2005-07-01',
        lastAmended: '2017-07-01',
        status: 'in_force',
      },
      {
        name: 'Tennessee Information Protection Act',
        shortName: 'TIPA',
        citation: 'Tenn. Code § 47-18-3201 et seq.',
        category: 'privacy',
        url: 'https://publications.tnsosfiles.com/acts/113/pub/pc0408.pdf',
        parserType: 'simple-html',
        effectiveDate: '2025-07-01',
        lastAmended: '2023-05-11',
        status: 'in_force',
      },
    ],
  },

  // ── Texas ──────────────────────────────────────────────────────────
  {
    code: 'US-TX',
    name: 'Texas',
    abbreviation: 'TX',
    statutes: [
      {
        name: 'Texas Identity Theft Enforcement and Protection Act',
        shortName: 'TX Breach',
        citation: 'Tex. Bus. & Com. Code § 521.053',
        category: 'breach_notification',
        url: 'https://statutes.capitol.texas.gov/Docs/BC/htm/BC.521.htm',
        parserType: 'legislature',
        effectiveDate: '2005-09-01',
        lastAmended: '2019-09-01',
        status: 'in_force',
      },
      {
        name: 'Texas Data Privacy and Security Act',
        shortName: 'TDPSA',
        citation: 'Tex. Bus. & Com. Code ch. 541',
        category: 'privacy',
        url: 'https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm',
        parserType: 'legislature',
        effectiveDate: '2024-07-01',
        lastAmended: '2023-06-18',
        status: 'in_force',
      },
    ],
  },

  // ── Utah ───────────────────────────────────────────────────────────
  {
    code: 'US-UT',
    name: 'Utah',
    abbreviation: 'UT',
    statutes: [
      {
        name: 'Utah Protection of Personal Information Act',
        shortName: 'UT Breach',
        citation: 'Utah Code § 13-44-101 et seq.',
        category: 'breach_notification',
        url: 'https://le.utah.gov/xcode/Title13/Chapter44/13-44.html',
        parserType: 'legislature',
        effectiveDate: '2007-01-01',
        lastAmended: '2019-05-14',
        status: 'in_force',
      },
      {
        name: 'Utah Consumer Privacy Act',
        shortName: 'UCPA',
        citation: 'Utah Code § 13-61-101 et seq.',
        category: 'privacy',
        url: 'https://le.utah.gov/xcode/Title13/Chapter61/13-61.html',
        parserType: 'legislature',
        effectiveDate: '2023-12-31',
        lastAmended: '2022-03-24',
        status: 'in_force',
      },
    ],
  },

  // ── Vermont ────────────────────────────────────────────────────────
  {
    code: 'US-VT',
    name: 'Vermont',
    abbreviation: 'VT',
    statutes: [
      {
        name: 'Vermont Security Breach Notice Act',
        shortName: 'VT Breach',
        citation: 'Vt. Stat. tit. 9, § 2430 et seq.',
        category: 'breach_notification',
        url: 'https://legislature.vermont.gov/statutes/chapter/09/062',
        parserType: 'legislature',
        effectiveDate: '2007-01-01',
        lastAmended: '2012-05-08',
        status: 'in_force',
      },
    ],
  },

  // ── Virginia ───────────────────────────────────────────────────────
  {
    code: 'US-VA',
    name: 'Virginia',
    abbreviation: 'VA',
    statutes: [
      {
        name: 'Virginia Breach of Personal Information Notification',
        shortName: 'VA Breach',
        citation: 'Va. Code § 18.2-186.6',
        category: 'breach_notification',
        url: 'https://law.lis.virginia.gov/vacode/title18.2/chapter6/section18.2-186.6/',
        parserType: 'legislature',
        effectiveDate: '2008-07-01',
        lastAmended: '2022-07-01',
        status: 'in_force',
      },
      {
        name: 'Virginia Consumer Data Protection Act',
        shortName: 'VCDPA',
        citation: 'Va. Code § 59.1-575 et seq.',
        category: 'privacy',
        url: 'https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/',
        parserType: 'legislature',
        effectiveDate: '2023-01-01',
        lastAmended: '2023-03-29',
        status: 'in_force',
      },
    ],
  },

  // ── Washington ─────────────────────────────────────────────────────
  {
    code: 'US-WA',
    name: 'Washington',
    abbreviation: 'WA',
    statutes: [
      {
        name: 'Washington Data Breach Notification',
        shortName: 'WA Breach',
        citation: 'Wash. Rev. Code § 19.255.010 et seq.',
        category: 'breach_notification',
        url: 'https://app.leg.wa.gov/rcw/default.aspx?cite=19.255',
        parserType: 'legislature',
        effectiveDate: '2005-07-24',
        lastAmended: '2019-05-07',
        status: 'in_force',
      },
    ],
  },

  // ── West Virginia ──────────────────────────────────────────────────
  {
    code: 'US-WV',
    name: 'West Virginia',
    abbreviation: 'WV',
    statutes: [
      {
        name: 'West Virginia Breach of Security of Consumer Information',
        shortName: 'WV Breach',
        citation: 'W. Va. Code § 46A-2A-101 et seq.',
        category: 'breach_notification',
        url: 'https://www.wvlegislature.gov/wvcode/ChapterEntire.cfm?chap=46a&art=2A',
        parserType: 'legislature',
        effectiveDate: '2008-06-06',
        lastAmended: '2008-06-06',
        status: 'in_force',
      },
    ],
  },

  // ── Wisconsin ──────────────────────────────────────────────────────
  {
    code: 'US-WI',
    name: 'Wisconsin',
    abbreviation: 'WI',
    statutes: [
      {
        name: 'Wisconsin Notice of Unauthorized Acquisition of Personal Information',
        shortName: 'WI Breach',
        citation: 'Wis. Stat. § 134.98',
        category: 'breach_notification',
        url: 'https://docs.legis.wisconsin.gov/statutes/statutes/134/98',
        parserType: 'legislature',
        effectiveDate: '2006-03-31',
        lastAmended: '2006-03-31',
        status: 'in_force',
      },
    ],
  },

  // ── Wyoming ────────────────────────────────────────────────────────
  {
    code: 'US-WY',
    name: 'Wyoming',
    abbreviation: 'WY',
    statutes: [
      {
        name: 'Wyoming Data Breach Notification',
        shortName: 'WY Breach',
        citation: 'Wyo. Stat. § 40-12-501 et seq.',
        category: 'breach_notification',
        url: 'https://wyoleg.gov/NXT/gateway.dll/Statutes/title40/chapter12/article5',
        parserType: 'legislature',
        effectiveDate: '2007-07-01',
        lastAmended: '2007-07-01',
        status: 'in_force',
      },
    ],
  },
];

// ── Derived constants ────────────────────────────────────────────────

/** Total number of jurisdictions (50 states + DC) */
export const JURISDICTION_COUNT = STATE_TARGETS.length;

/** Total number of statute entries across all states */
export const STATUTE_COUNT = STATE_TARGETS.reduce(
  (sum, s) => sum + s.statutes.length,
  0,
);

/** States with comprehensive privacy laws */
export const PRIVACY_STATES = STATE_TARGETS.filter((s) =>
  s.statutes.some((st) => st.category === 'privacy'),
).map((s) => s.abbreviation);

/** States with cybersecurity-specific mandates */
export const CYBERSECURITY_STATES = STATE_TARGETS.filter((s) =>
  s.statutes.some((st) => st.category === 'cybersecurity'),
).map((s) => s.abbreviation);
