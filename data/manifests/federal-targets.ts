/**
 * Federal statute targets for USC XML extraction.
 *
 * Each entry maps a cybersecurity/privacy statute to its USC title and
 * section range so the fetch script knows which sections to extract.
 */

export interface FederalTarget {
  /** Human-readable statute name */
  name: string;
  /** Short identifier (e.g. "CFAA") */
  short_name: string;
  /** USC title number */
  usc_title: number;
  /** Section numbers to extract (individual or range endpoints) */
  sections: { start: number | string; end?: number | string };
  /** Full document identifier for seed JSON */
  identifier: string;
  /** Document type classification */
  document_type: 'statute';
  /** Enforcement status */
  status: 'in_force';
  /** Date the statute originally became effective (ISO) */
  effective_date: string;
  /** Date of last known amendment (ISO) */
  last_amended: string;
}

export const FEDERAL_TARGETS: FederalTarget[] = [
  // ── Title 18: Crimes and Criminal Procedure ──────────────────────
  {
    name: 'Computer Fraud and Abuse Act',
    short_name: 'CFAA',
    usc_title: 18,
    sections: { start: 1030 },
    identifier: '18 USC 1030',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1986-10-16',
    last_amended: '2008-09-26',
  },
  {
    name: 'Wiretap Act (Title III)',
    short_name: 'Wiretap Act',
    usc_title: 18,
    sections: { start: 2511, end: 2522 },
    identifier: '18 USC 2511-2522',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1968-06-19',
    last_amended: '2008-07-10',
  },
  {
    name: 'Stored Communications Act',
    short_name: 'SCA',
    usc_title: 18,
    sections: { start: 2701, end: 2712 },
    identifier: '18 USC 2701-2712',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1986-10-21',
    last_amended: '2009-10-13',
  },
  {
    name: 'Identity Theft and Aggravated Identity Theft',
    short_name: 'Identity Theft',
    usc_title: 18,
    sections: { start: 1028, end: '1028A' },
    identifier: '18 USC 1028-1028A',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1998-10-30',
    last_amended: '2008-09-26',
  },
  {
    name: 'Pen Register and Trap and Trace Devices',
    short_name: 'Pen/Trap',
    usc_title: 18,
    sections: { start: 3121, end: 3127 },
    identifier: '18 USC 3121-3127',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1986-10-21',
    last_amended: '2006-03-09',
  },

  // ── Title 15: Commerce and Trade ─────────────────────────────────
  {
    name: 'Federal Trade Commission Act - Section 5',
    short_name: 'FTC Act Section 5',
    usc_title: 15,
    sections: { start: 45 },
    identifier: '15 USC 45',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1914-09-26',
    last_amended: '2023-12-22',
  },
  {
    name: "Children's Online Privacy Protection Act",
    short_name: 'COPPA',
    usc_title: 15,
    sections: { start: 6501, end: 6506 },
    identifier: '15 USC 6501-6506',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1998-10-21',
    last_amended: '2012-12-19',
  },
  {
    name: 'Gramm-Leach-Bliley Act (Financial Privacy)',
    short_name: 'GLBA',
    usc_title: 15,
    sections: { start: 6801, end: 6827 },
    identifier: '15 USC 6801-6827',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1999-11-12',
    last_amended: '2010-07-21',
  },
  {
    name: 'Controlling the Assault of Non-Solicited Pornography And Marketing Act',
    short_name: 'CAN-SPAM',
    usc_title: 15,
    sections: { start: 7701, end: 7713 },
    identifier: '15 USC 7701-7713',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '2003-12-16',
    last_amended: '2008-09-26',
  },
  {
    name: 'Fair Credit Reporting Act',
    short_name: 'FCRA',
    usc_title: 15,
    sections: { start: 1681, end: '1681x' },
    identifier: '15 USC 1681-1681x',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1970-10-26',
    last_amended: '2022-12-29',
  },

  // ── Title 42: Public Health and Welfare ──────────────────────────
  {
    name: 'Health Insurance Portability and Accountability Act',
    short_name: 'HIPAA',
    usc_title: 42,
    sections: { start: '1320d', end: '1320d-9' },
    identifier: '42 USC 1320d-1320d-9',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1996-08-21',
    last_amended: '2013-01-25',
  },

  // ── Title 44: Public Printing and Documents ──────────────────────
  {
    name: 'Federal Information Security Modernization Act',
    short_name: 'FISMA',
    usc_title: 44,
    sections: { start: 3551, end: 3558 },
    identifier: '44 USC 3551-3558',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '2014-12-18',
    last_amended: '2014-12-18',
  },

  // ── Title 20: Education ──────────────────────────────────────────
  {
    name: 'Family Educational Rights and Privacy Act',
    short_name: 'FERPA',
    usc_title: 20,
    sections: { start: '1232g' },
    identifier: '20 USC 1232g',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1974-08-21',
    last_amended: '2013-03-07',
  },

  // ── Title 47: Telecommunications ─────────────────────────────────
  {
    name: 'Customer Proprietary Network Information',
    short_name: 'CPNI',
    usc_title: 47,
    sections: { start: 222 },
    identifier: '47 USC 222',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1996-02-08',
    last_amended: '1996-02-08',
  },
  {
    name: 'Cable Communications Policy Act - Subscriber Privacy',
    short_name: 'Cable Privacy',
    usc_title: 47,
    sections: { start: 551 },
    identifier: '47 USC 551',
    document_type: 'statute',
    status: 'in_force',
    effective_date: '1984-10-30',
    last_amended: '1992-10-05',
  },
];

/** Unique USC title numbers needed for download */
export const REQUIRED_TITLES: number[] = [
  ...new Set(FEDERAL_TARGETS.map((t) => t.usc_title)),
].sort((a, b) => a - b);
