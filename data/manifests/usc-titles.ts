/**
 * Metadata for all 53 substantive titles of the United States Code.
 *
 * Titles 1-54 (Title 53 is reserved and omitted). The `positivelaw` field
 * indicates whether Congress has enacted the title as positive law — meaning
 * the title text itself is legal evidence of the law, rather than merely
 * prima facie evidence that must be verified against the Statutes at Large.
 *
 * Source: Office of the Law Revision Counsel, https://uscode.house.gov/
 */

export interface UscTitle {
  /** USC title number (1-54, no 53) */
  number: number;
  /** Official title name */
  name: string;
  /** Whether the title has been enacted as positive law */
  positivelaw: boolean;
}

/**
 * All 53 substantive USC titles in numeric order.
 */
export const USC_TITLES: UscTitle[] = [
  { number: 1, name: 'General Provisions', positivelaw: true },
  { number: 2, name: 'The Congress', positivelaw: false },
  { number: 3, name: 'The President', positivelaw: true },
  { number: 4, name: 'Flag and Seal, Seat of Government, and the States', positivelaw: true },
  { number: 5, name: 'Government Organization and Employees', positivelaw: true },
  { number: 6, name: 'Domestic Security', positivelaw: false },
  { number: 7, name: 'Agriculture', positivelaw: false },
  { number: 8, name: 'Aliens and Nationality', positivelaw: false },
  { number: 9, name: 'Arbitration', positivelaw: true },
  { number: 10, name: 'Armed Forces', positivelaw: true },
  { number: 11, name: 'Bankruptcy', positivelaw: true },
  { number: 12, name: 'Banks and Banking', positivelaw: false },
  { number: 13, name: 'Census', positivelaw: true },
  { number: 14, name: 'Coast Guard', positivelaw: true },
  { number: 15, name: 'Commerce and Trade', positivelaw: false },
  { number: 16, name: 'Conservation', positivelaw: false },
  { number: 17, name: 'Copyrights', positivelaw: true },
  { number: 18, name: 'Crimes and Criminal Procedure', positivelaw: true },
  { number: 19, name: 'Customs Duties', positivelaw: false },
  { number: 20, name: 'Education', positivelaw: false },
  { number: 21, name: 'Food and Drugs', positivelaw: false },
  { number: 22, name: 'Foreign Relations and Intercourse', positivelaw: false },
  { number: 23, name: 'Highways', positivelaw: true },
  { number: 24, name: 'Hospitals and Asylums', positivelaw: false },
  { number: 25, name: 'Indians', positivelaw: false },
  { number: 26, name: 'Internal Revenue Code', positivelaw: false },
  { number: 27, name: 'Intoxicating Liquors', positivelaw: false },
  { number: 28, name: 'Judiciary and Judicial Procedure', positivelaw: true },
  { number: 29, name: 'Labor', positivelaw: false },
  { number: 30, name: 'Mineral Lands and Mining', positivelaw: false },
  { number: 31, name: 'Money and Finance', positivelaw: true },
  { number: 32, name: 'National Guard', positivelaw: true },
  { number: 33, name: 'Navigation and Navigable Waters', positivelaw: false },
  { number: 34, name: 'Crime Control and Law Enforcement', positivelaw: false },
  { number: 35, name: 'Patents', positivelaw: true },
  { number: 36, name: 'Patriotic and National Observances, Ceremonies, and Organizations', positivelaw: true },
  { number: 37, name: 'Pay and Allowances of the Uniformed Services', positivelaw: true },
  { number: 38, name: "Veterans' Benefits", positivelaw: true },
  { number: 39, name: 'Postal Service', positivelaw: true },
  { number: 40, name: 'Public Buildings, Property, and Works', positivelaw: true },
  { number: 41, name: 'Public Contracts', positivelaw: true },
  { number: 42, name: 'The Public Health and Welfare', positivelaw: false },
  { number: 43, name: 'Public Lands', positivelaw: false },
  { number: 44, name: 'Public Printing and Documents', positivelaw: true },
  { number: 45, name: 'Railroads', positivelaw: false },
  { number: 46, name: 'Shipping', positivelaw: true },
  { number: 47, name: 'Telecommunications', positivelaw: false },
  { number: 48, name: 'Territories and Insular Possessions', positivelaw: false },
  { number: 49, name: 'Transportation', positivelaw: true },
  { number: 50, name: 'War and National Defense', positivelaw: false },
  { number: 51, name: 'National and Commercial Space Programs', positivelaw: true },
  { number: 52, name: 'Voting and Elections', positivelaw: false },
  { number: 54, name: 'National Park Service and Related Programs', positivelaw: true },
];

/** Zero-pad a title number to 2 digits (e.g. 1 -> "01", 18 -> "18"). */
export function padTitle(n: number): string {
  return String(n).padStart(2, '0');
}
