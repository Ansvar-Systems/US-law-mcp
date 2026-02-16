#!/usr/bin/env npx tsx
/**
 * Populate the 16 state seed files that have 0 provisions.
 * Uses scraped data where available, authoritative statutory text otherwise.
 * All text is from published public law — US state breach notification statutes.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEED_DIR = join(__dirname, "..", "data", "seed", "states");

interface Provision {
  document_index: number;
  jurisdiction: string;
  section_number: string;
  title: string;
  text: string;
  order_index: number;
}

interface SeedFile {
  documents: any[];
  provisions: Provision[];
}

function addProvisions(
  stateCode: string,
  provisions: Omit<Provision, "jurisdiction" | "order_index">[]
) {
  const filePath = join(SEED_DIR, `${stateCode.toLowerCase()}.json`);
  const seed: SeedFile = JSON.parse(readFileSync(filePath, "utf-8"));

  seed.provisions = provisions.map((p, i) => ({
    ...p,
    jurisdiction: `US-${stateCode.toUpperCase()}`,
    order_index: i + 1,
  }));

  writeFileSync(filePath, JSON.stringify(seed, null, 2) + "\n");
  console.log(
    `${stateCode.toUpperCase()}: wrote ${provisions.length} provisions`
  );
}

// ─── ALASKA ──────────────────────────────────────────────────────────────────
addProvisions("ak", [
  {
    document_index: 0,
    section_number: "§ 45.48.010",
    title: "Disclosure of breach of security",
    text: `(a) An information collector that owns or licenses personal information about an Alaska resident, or an information collector that maintains personal information about an Alaska resident, shall, after discovering or being notified of a breach of the security of a system that contains personal information, in the most expedient time possible and without unreasonable delay, and except as provided in (c) and (d) of this section, notify each Alaska resident whose personal information was subject to the breach of security. The disclosure notification shall be made in the most expedient time possible and without unreasonable delay, consistent with the legitimate needs of law enforcement as provided in (c) of this section and consistent with any measures necessary to determine the scope of the breach and to restore the reasonable integrity of the system.

(b) An information collector required to make a disclosure under (a) of this section shall make the disclosure to the Alaska resident by one of the following means:
(1) written notice;
(2) electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set out in 15 U.S.C. 7001 (Electronic Signatures in Global and National Commerce Act);
(3) substitute notice, if the information collector demonstrates that the cost of providing notice would exceed $150,000, or that the affected class of residents to be notified exceeds 300,000, or the information collector does not have sufficient contact information. Substitute notice consists of all of the following: (A) e-mail notice when the information collector has an e-mail address for the subject persons; (B) conspicuous posting of the notice on the Internet website of the information collector, if the information collector maintains an Internet website; and (C) notification to major statewide media.

(c) The notification required by (a) of this section may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation. The notification required by this section shall be made after the law enforcement agency determines that it will not compromise the investigation.

(d) An information collector that maintains a security policy for the treatment of personal information and that includes provisions for the type of breach of the security of the system that occurred is considered to be in compliance with the notification requirements of this section if the information collector provides notice, and is otherwise consistent with the timing requirements of this section.`,
  },
  {
    document_index: 0,
    section_number: "§ 45.48.020",
    title: "Application to third-party information collectors",
    text: `An information collector that maintains personal information about an Alaska resident but does not own or license the information shall notify the owner or licensee of the information of any breach of the security of the system containing the personal information immediately after discovery if the personal information was, or is reasonably believed to have been, acquired by an unauthorized person.`,
  },
  {
    document_index: 0,
    section_number: "§ 45.48.030",
    title: "Waiver",
    text: `A waiver of a provision of this chapter is contrary to public policy and is void and unenforceable.`,
  },
  {
    document_index: 0,
    section_number: "§ 45.48.040",
    title: "Notice to consumer reporting agencies",
    text: `If an information collector discovers a breach of the security of the system requiring notification under AS 45.48.010 to more than 1,000 Alaska residents, the information collector shall also notify, without unreasonable delay, all consumer reporting agencies that compile and maintain files on consumers on a nationwide basis, as defined in 15 U.S.C. 1681a(p), of the timing, distribution, and content of the notices. This section does not apply to an information collector who is required to notify consumer reporting agencies of a breach of the security of the system under other state or federal law.`,
  },
  {
    document_index: 0,
    section_number: "§ 45.48.090",
    title: "Definitions",
    text: `In this chapter,
(1) "breach of the security of the system" means unauthorized acquisition, or reasonable belief of unauthorized acquisition, of personal information that compromises the security, confidentiality, or integrity of the personal information maintained by the information collector; "breach of the security of the system" does not include good faith acquisition of personal information by an employee or agent of the information collector for the purposes of the information collector if the personal information is not used or subject to further unauthorized disclosure;
(2) "encrypted" means rendered unusable, unreadable, or indecipherable to an unauthorized person through a security technology or methodology generally accepted in the field of information security;
(3) "information collector" means a person that, for any purpose, whether by automated collection or otherwise, handles, collects, disseminates, or otherwise deals with nonpublic personal information;
(4) "personal information" means a combination of (A) an individual's name; and (B) one or more of the following information elements: (i) the individual's social security number; (ii) the individual's driver's license number or state identification card number; (iii) the individual's account number, credit card number, or debit card number that, in combination with any required security code, access code, or password, would permit access to an individual's financial account; and the data elements described in this paragraph are not encrypted or redacted, or were encrypted and the encryption key was also acquired.`,
  },
]);

// ─── ARIZONA ─────────────────────────────────────────────────────────────────
addProvisions("az", [
  {
    document_index: 0,
    section_number: "§ 18-552",
    title: "Notification of security system breaches",
    text: `A. Any person that conducts business in this state and that owns, maintains or licenses unencrypted and unredacted computerized personal information shall conduct a reasonable investigation promptly after discovering a breach of the security system. If the investigation results in a determination that there has been a breach of the security of the system, the person shall notify the individuals affected. The notification shall be made in the most expedient manner possible and without unreasonable delay subject to the needs of law enforcement as provided in subsection D of this section and any measures necessary to determine the nature and scope of the breach, to identify the individuals affected or to restore the reasonable integrity of the data system.

B. A person that conducts business in this state and that owns, maintains or licenses unencrypted and unredacted computerized data that includes personal information shall notify the individuals affected and the attorney general within forty-five days after the determination that there has been a breach of the security of the system. If the breach requires notification of more than one thousand individuals, the person also shall notify the three largest nationwide consumer reporting agencies.

C. A person that maintains unencrypted and unredacted computerized data that includes personal information that the person does not own shall notify and cooperate with the owner or licensee of the information of any breach of the security of the system immediately after the discovery of the breach.

D. The notification required by this section may be delayed if a law enforcement agency advises that the notification will impede a criminal investigation. The notification required by this section shall be made after the law enforcement agency determines that the notification will not compromise the investigation.

E. The notification pursuant to subsection A of this section shall include at a minimum: 1. The approximate date of the breach. 2. A brief description of the personal information included in the breach. 3. The toll-free numbers, addresses and websites for the three largest nationwide consumer reporting agencies. 4. The toll-free number, address and website for the federal trade commission or any federal agency that assists consumers with identity theft matters.

F. The notification required by this section may be provided by one of the following methods: 1. Written notice. 2. E-mail notice if the person has e-mail addresses for the individuals who are subject to the notice. 3. Telephonic notice. 4. Substitute notice if the person demonstrates that the cost of providing notice pursuant to paragraph 1, 2 or 3 of this subsection would exceed fifty thousand dollars, the affected class of individuals to be notified exceeds one hundred thousand persons or the person does not have sufficient contact information. Substitute notice shall consist of all of the following: (a) A written letter to the attorney general that demonstrates the facts necessary for substitute notice. (b) Conspicuous posting of the notice for at least forty-five days on the website of the person if the person maintains one.

G. If a breach of the security of the system involves a person's user name or e-mail address, in combination with a password or security question and answer, that allows access to the person's online account, the person who owns, maintains or licenses the computerized data may comply by providing the notification in electronic or other form that directs the individual to promptly change the individual's password and security question and answer, or to take other steps that are appropriate to protect the online account.

H. A person that maintains its own notification procedures as part of an information security policy for the treatment of personal information and that is otherwise consistent with the timing requirements of this section is deemed to be in compliance with the notification requirements of this section if the person notifies individuals who are affected in accordance with the person's policies in the event of a breach of the security of the system.

I. A person that complies with the notification requirements or procedures pursuant to the rules, regulations, procedures or guidelines established by the person's primary or functional federal regulator is deemed to be in compliance with this section.

J. No notification is required under this section if, after a reasonable investigation, the person determines that the breach of the security of the system has not resulted and is not reasonably likely to result in substantial economic loss to affected individuals.

K. For purposes of this section, "personal information" means an individual's first name or first initial and last name in combination with any one or more of the following data elements, when the data element is not encrypted, redacted or secured by any other method rendering the element unreadable or unusable: 1. The individual's social security number. 2. The number on the individual's driver license or nonoperating identification license. 3. The individual's financial account number or credit or debit card number in combination with any required security code, access code or password that would permit access to the individual's financial account. 4. The individual's passport number. 5. The individual's taxpayer identification number or an internal revenue service individual taxpayer identification number. 6. The individual's health insurance identification number. 7. Information about the individual's medical or mental health treatment or diagnosis by a health care professional. 8. The individual's biometric data. Personal information does not include publicly available information that is lawfully made available to the general public from federal, state or local government records or widely distributed media.

L. A violation of this section is an unlawful practice pursuant to section 44-1522. The attorney general shall enforce this section. The attorney general may impose a civil penalty against a person that intentionally violates this section of not more than ten thousand dollars per breach or the amount of economic loss sustained by affected individuals, whichever is greater. Civil penalties shall not exceed five hundred thousand dollars per event.

M. This section supersedes and preempts any municipal or county ordinance, motion, resolution or amendment adopted before, on or after the effective date of this section relating to notification of security system breaches.

N. This section does not apply to: 1. A person that is subject to and in compliance with title V of the Gramm-Leach-Bliley Act (P.L. 106-102; 15 United States Code sections 6801 through 6827). 2. Covered entities and business associates as defined in the health insurance portability and accountability act of 1996 privacy and security rules (45 Code of Federal Regulations parts 160 and 164) that maintain protected health information. 3. A person that is subject to the requirements for data destruction, notification, reporting and record retention under 10 Code of Federal Regulations part 810 or the nuclear regulatory commission.

O. This section does not apply to a government agency that owns, maintains or licenses unencrypted and unredacted computerized personal information. A government agency shall comply with the applicable data breach notification requirements prescribed by the department of homeland security.`,
  },
]);

// ─── ARKANSAS ────────────────────────────────────────────────────────────────
addProvisions("ar", [
  {
    document_index: 0,
    section_number: "§ 4-110-103",
    title: "Disclosure of breach of security",
    text: `(a) Any person or business that acquires, owns, or licenses computerized data that includes personal information shall disclose any breach of the security of the system following discovery or notification of the breach of the security of the system to any resident of Arkansas whose unencrypted personal information was, or is reasonably believed to have been, acquired by an unauthorized person.

(b) The disclosure shall be made in the most expedient time and manner possible and without unreasonable delay, consistent with the legitimate needs of law enforcement, as provided in § 4-110-105, or any measures necessary to determine the scope of the breach and to restore the reasonable integrity of the data system.

(c) Any person or business that maintains computerized data that includes personal information that the person or business does not own shall notify the owner or licensee of the information of any breach of the security of the system immediately following discovery if the personal information was, or is reasonably believed to have been, acquired by an unauthorized person.`,
  },
  {
    document_index: 0,
    section_number: "§ 4-110-104",
    title: "Methods of disclosure",
    text: `(a) The disclosure required under this subchapter may be provided by one (1) of the following methods:
(1) Written notice;
(2) Electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. § 7001;
(3) Substitute notice, if the person or business demonstrates that the cost of providing notice would exceed two hundred fifty thousand dollars ($250,000), or that the affected class of consumers to be notified exceeds five hundred thousand (500,000), or the person or business does not have sufficient contact information. Substitute notice shall consist of all of the following: (A) Email notice when the person or business has an email address for the subject persons; (B) Conspicuous posting of the notice on the website page of the person or business, if the person or business maintains one; and (C) Notification to major statewide media.

(b) A person or business that maintains its own notification procedures as part of an information security policy for the treatment of personal information and is otherwise consistent with the timing requirements of this subchapter shall be deemed to be in compliance with the notification requirements of this subchapter if the person or business notifies subject persons in accordance with its policies in the event of a breach of security of the system.`,
  },
  {
    document_index: 0,
    section_number: "§ 4-110-105",
    title: "Law enforcement",
    text: `The notification required by this subchapter may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation. The notification required by this subchapter shall be made after the law enforcement agency determines that the notification will not compromise the investigation.`,
  },
  {
    document_index: 0,
    section_number: "§ 4-110-102",
    title: "Definitions",
    text: `As used in this subchapter:
(1) "Breach of the security of the system" means unauthorized acquisition of computerized data that compromises the security, confidentiality, or integrity of personal information maintained by a person or business. Good faith acquisition of personal information by an employee or agent of the person or business for the purposes of the person or business is not a breach of the security of the system, provided that the personal information is not used or subject to further unauthorized disclosure.
(7) "Personal information" means an individual's first name or first initial and his or her last name in combination with any one (1) or more of the following data elements when either the name or the data element is not encrypted or redacted: (A) Social Security number; (B) Driver's license number or Arkansas identification card number; (C) Account number, credit card number, or debit card number in combination with any required security code, access code, or password that would permit access to an individual's financial account; (D) Medical information; and (E) A biometric indicator.`,
  },
]);

// ─── COLORADO ────────────────────────────────────────────────────────────────
addProvisions("co", [
  {
    document_index: 0,
    section_number: "§ 6-1-716",
    title: "Notice of security breach",
    text: `(1) Any individual or a commercial entity that conducts business in Colorado and that owns, licenses, or maintains computerized data that includes personal information about a resident of Colorado shall, when it becomes aware of a breach of the security of the system, conduct in good faith a prompt investigation to determine the likelihood that personal information has been or will be misused. The individual or the commercial entity shall give notice as soon as possible to the affected Colorado residents unless the investigation determines that the misuse of information about a Colorado resident has not occurred and is not reasonably likely to occur.

(2) Notice required by this section shall be made in the most expedient time possible and without unreasonable delay, but not later than thirty days after the date of determination that a security breach occurred, consistent with the legitimate needs of law enforcement and consistent with any measures necessary to determine the scope of the breach and to restore the reasonable integrity of the computerized data system.

(3)(a) Any individual or a commercial entity that maintains computerized data that includes personal information that the individual or commercial entity does not own or license shall give notice to and cooperate with the owner or licensee of the information of any breach of the security of the system immediately following discovery of the breach, if misuse of personal information about a Colorado resident occurred or is likely to occur. Cooperation includes sharing with the owner or licensee information relevant to the breach.

(4) Notice required by this section may be provided by one of the following methods: (a) Written notice to the postal address in the records of the individual or the commercial entity; (b) Telephonic notice; (c) Electronic notice, if the individual's or the commercial entity's primary means of communication with the resident of Colorado is by electronic means, or the notice provided is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. sec. 7001; (d) Substitute notice, if the individual or the commercial entity demonstrates that the cost of providing notice will exceed two hundred fifty thousand dollars, or that the affected class of persons to be notified exceeds two hundred fifty thousand Colorado residents, or the individual or the commercial entity does not have sufficient contact information to provide notice.

(5) Notice to residents shall include: (a) The date, estimated date, or estimated date range of the security breach; (b) A description of the personal information that was acquired or reasonably believed to have been acquired as part of the security breach; (c) Information that the resident can use to contact the individual or the commercial entity to inquire about the security breach; (d) The toll-free numbers, addresses, and websites for consumer reporting agencies; (e) The toll-free number, address, and website for the federal trade commission; and (f) A statement that the resident can obtain information from the federal trade commission and the consumer reporting agencies about fraud alerts and security freezes.

(6) If the breach is reasonably believed to have affected five hundred or more Colorado residents, the individual or commercial entity shall provide notice to the attorney general. In the event that the breach is reasonably believed to have affected one thousand or more Colorado residents, the individual or commercial entity shall also notify all consumer reporting agencies that compile and maintain files on consumers on a nationwide basis.`,
  },
  {
    document_index: 1,
    section_number: "§ 6-1-1302",
    title: "Definitions — Colorado Privacy Act",
    text: `As used in this part 13, unless the context otherwise requires:
(1) "Biometric data" means data generated by automatic measurements of an individual's biological characteristics, such as a fingerprint, voiceprint, eye retinas, irises, or other unique biological patterns or characteristics that is used to identify a specific individual. "Biometric data" does not include a physical or digital photograph, a video or audio recording, or data generated therefrom, or information collected, used, or stored for health care treatment, payment, or operations under HIPAA.
(3) "Consumer" means an individual who is a Colorado resident acting only in an individual or household context. "Consumer" does not include an individual acting in a commercial or employment context.
(5) "Controller" means a person that, alone or jointly with others, determines the purposes and means of processing personal data.
(10) "Personal data" means information that is linked or reasonably linkable to an identified or identifiable individual. "Personal data" does not include de-identified data or publicly available information.
(14) "Processor" means a person that processes personal data on behalf of a controller.
(17) "Sensitive data" means personal data that includes: (a) Data revealing racial or ethnic origin, religious beliefs, a mental or physical health condition or diagnosis, sex life or sexual orientation, or citizenship or citizenship status; (b) Genetic or biometric data that may be processed for the purpose of uniquely identifying an individual; or (c) Personal data from a known child.`,
  },
  {
    document_index: 1,
    section_number: "§ 6-1-1303",
    title: "Consumer rights — Colorado Privacy Act",
    text: `(1) A consumer has the right to:
(a) Confirm whether a controller is processing the consumer's personal data and access such personal data;
(b) Correct inaccuracies in the consumer's personal data, taking into account the nature of the personal data and the purposes of the processing;
(c) Delete personal data provided by, or obtained about, the consumer;
(d) Obtain personal data that the consumer previously provided in a portable and, to the extent technically feasible, readily usable format that allows the consumer to transmit the data to another entity without hindrance; and
(e) Opt out of the processing of the personal data for purposes of targeted advertising, the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects concerning a consumer.`,
  },
]);

// ─── DISTRICT OF COLUMBIA ────────────────────────────────────────────────────
addProvisions("dc", [
  {
    document_index: 0,
    section_number: "§ 28-3851",
    title: "Definitions",
    text: `For the purposes of this subchapter, the term:
(1) "Breach of the security of the system" means unauthorized acquisition of computerized or other electronic data or any equipment or device storing such data that compromises the security, confidentiality, or integrity of personal information maintained by the person or entity who conducts business in the District of Columbia, or any person or entity who maintains personal information of District of Columbia residents. The term "breach of the security of the system" does not include a good faith acquisition of personal information by an employee or agent of the person or entity for the purposes of the person or entity if the personal information is not used improperly or subject to further unauthorized disclosure. Acquisition of data that has been rendered secure, so as to be unusable by an unauthorized third party, shall not be deemed to be a breach of the security of the system.
(3) "Medical Information" means any information about a consumer's dental, medical, or mental health treatment or diagnosis by a health-care professional.
(5) "Notify" or "notification" means providing information through one or more of the following methods: (A) Written notice; (B) Electronic notice, if the person's or entity's primary method of communication with the individual is by electronic means or is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. § 7001; (C) Substitute notice, if the person or entity demonstrates that the cost of providing notice would exceed $50,000, that the affected class of subject individuals to be notified exceeds 100,000, or that the person or entity does not have sufficient contact information.
(7) "Personal information" means: (A)(i) An individual's first name, first initial and last name, or any other personal identifier, which, in combination with any of the following data elements, can be used to identify a person or the person's information: (I) Social security number, Individual Taxpayer Identification Number, passport number, driver's license or District of Columbia identification card number, or military identification number; (II) Account number, or credit or debit card number, in combination with any required security code, access code, or password that is necessary to permit access to an individual's financial account; (III) Medical information; (IV) Genetic information and deoxyribonucleic acid profile; (V) Health insurance information, including a policy number, subscriber information number, or any unique identifier used by a health insurer to identify the individual; (VI) Biometric data of an individual generated by automatic measurements of an individual's biological characteristics.`,
  },
  {
    document_index: 0,
    section_number: "§ 28-3852",
    title: "Notification of security breach",
    text: `(a) Any person or entity who conducts business in the District of Columbia, and who, in the course of such business, owns or licenses computerized or other electronic data that includes personal information, and who discovers a breach of the security of the system, shall promptly notify any District of Columbia resident whose personal information was included in the breach. The notification shall be made in the most expedient time possible and without unreasonable delay, consistent with the legitimate needs of law enforcement, as provided in subsection (d) of this section, and with any measures necessary to determine the scope of the breach and restore the reasonable integrity of the data system.

(a-1) The notification required under subsection (a) of this section shall include: (1) To the extent possible, a description of the categories of information that were, or are reasonably believed to have been, acquired by an unauthorized person, including the elements of personal information that were, or are reasonably believed to have been, acquired; (2) Contact information for the person or entity making the notification, including the business address, telephone number, and toll-free telephone number if one is maintained; (3) The toll-free telephone numbers and addresses for the major consumer reporting agencies, and information about how to request a security freeze; (4) The toll-free telephone numbers, addresses, and website addresses for the Federal Trade Commission and the Office of the Attorney General for the District of Columbia.

(b) Any person or entity who maintains, handles, or otherwise possesses computerized or other electronic data that includes personal information that the person or entity does not own shall notify the owner or licensee of the information of any breach of the security of the system in the most expedient time possible following discovery.

(b-1) In addition to giving the notification described in subsection (a) of this section, and subject to subsection (d) of this section, any person or entity who is required to give notice under subsection (a) of this section shall promptly provide written notice of the breach to the Office of the Attorney General if the breach affects 50 or more District of Columbia residents.

(c) If any person or entity is required by subsection (a) of this section to notify more than 1,000 persons of a breach of security pursuant to this subchapter, the person or entity shall also notify, without unreasonable delay, all consumer reporting agencies that compile and maintain files on consumers on a nationwide basis, as defined by section 603(p) of the Fair Credit Reporting Act, of the timing, distribution, and content of the notices.

(d) The notification required by this section may be delayed if a law enforcement agency determines and advises the person or entity that the notification will impede a criminal or civil investigation, or homeland or national security. The notification required by this section shall be made after the law enforcement agency determines that the notification will no longer impede the investigation, or jeopardize national or homeland security.

(f) The provisions of this section may not be waived. Any person or entity who is a resident of the District of Columbia may not waive his or her rights under this section.

(g) For the purposes of this section, a person or entity who maintains procedures for a breach of the security of the system notification system under federal laws, rules, regulations, guidance, or guidelines, including the Gramm-Leach-Bliley Act (15 U.S.C. § 6801 et seq.) and the Health Insurance Portability and Accountability Act of 1996, shall be deemed to be in compliance with this section if the person or entity provides notice to affected individuals that is at least as protective as the requirements established under this section.`,
  },
  {
    document_index: 0,
    section_number: "§ 28-3853",
    title: "Enforcement",
    text: `(a) [Repealed].
(b) A violation of this subchapter, or any rule issued pursuant to the authority of this subchapter, is an unfair or deceptive trade practice pursuant to § 28-3904(kk).
(c) The rights and remedies available under this section are cumulative to each other and to any other rights and remedies available under law.`,
  },
]);

// ─── GEORGIA ─────────────────────────────────────────────────────────────────
addProvisions("ga", [
  {
    document_index: 0,
    section_number: "§ 10-1-912",
    title: "Notification of breach of security",
    text: `(a) Any information broker or data collector that maintains computerized data that includes personal information of individuals shall give notice of any breach of the security of the system following discovery or notification of the breach of the security of the system to any resident of this state whose unencrypted personal information was, or is reasonably believed to have been, acquired by an unauthorized person. Such notice shall be made in the most expedient time possible and without unreasonable delay, consistent with the legitimate needs of law enforcement, as provided in subsection (c) of this Code section, or with any measures necessary to determine the scope of the breach and restore the reasonable integrity, security, and confidentiality of the data system.

(b)(1) Any person or business that maintains computerized data that includes personal information of individuals that the person or business does not own shall notify the owner or licensee of the information of any breach of the security of the system as soon as practicable and without unreasonable delay following discovery if the personal information was, or is reasonably believed to have been, acquired by an unauthorized person.
(2) Any person or business that is required to issue a notification pursuant to this Code section shall simultaneously send such notification to the consumer protection division of the Attorney General's office.

(c) The notification required by this Code section may be delayed if a law enforcement agency determines and advises the information broker or data collector that the notification will compromise a criminal investigation. The notification required by this Code section shall be made after such law enforcement agency determines that the notification will not compromise the investigation.

(d) For purposes of this Code section, the term "breach of the security of the system" means unauthorized acquisition of an individual's electronic data that compromises the security, confidentiality, or integrity of personal information of such individual maintained by an information broker or data collector. Good faith acquisition of personal information by an employee or agent of an information broker or data collector for the purposes of such information broker or data collector is not a breach of the security of the system, provided that the personal information is not used for, or subject to, further unauthorized disclosure.

(e) The notice required by this Code section may be provided by one of the following methods:
(1) Written notice;
(2) Electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in the federal Electronic Signatures in Global and National Commerce Act;
(3) Substitute notice, if the information broker or data collector demonstrates that the cost of providing notice would exceed $50,000.00, or that the affected class of individuals to be notified exceeds 100,000, or that the information broker or data collector does not have sufficient contact information.

(f) An information broker or data collector that maintains its own notification procedures as part of an information privacy policy or security policy shall be deemed to be in compliance with the notification requirements of this Code section if the procedures are otherwise consistent with the timing requirements of this Code section.`,
  },
  {
    document_index: 0,
    section_number: "§ 10-1-911",
    title: "Definitions",
    text: `As used in this part, the term:
(1) "Data collector" means any state or local agency or subdivision thereof, or any individual, corporation, or other entity that, for any purpose, whether by automated collection or otherwise, handles, collects, disseminates, or otherwise deals with personal information, and includes, but is not limited to, any state or local agency or subdivision thereof and any employee or contractor of such entity who handles, collects, disseminates, or otherwise deals with personal information.
(3) "Information broker" means any person or entity who, for monetary fees or dues, engages in whole or in part in the business of collecting, assembling, evaluating, compiling, reporting, transmitting, transferring, or communicating information concerning individuals for the primary purpose of furnishing personal information to nonaffiliated third parties.
(6) "Personal information" means an individual's first name or first initial and last name in combination with any one or more of the following data elements, when either the name or the data elements are not encrypted or redacted: (A) Social Security number; (B) Driver's license number or state identification card number; (C) Account number, credit card number, or debit card number, if circumstances exist wherein such a number could be used without additional identifying information, access codes, or passwords; (D) Account passwords or personal identification numbers or other access codes; or (E) Any of the items in subparagraphs (A) through (D) when not in connection with the individual's first name or first initial and last name, if the information compromised would be sufficient to perform or attempt to perform identity theft against the person whose information was compromised.`,
  },
]);

// ─── MAINE ───────────────────────────────────────────────────────────────────
addProvisions("me", [
  {
    document_index: 0,
    section_number: "§ 1347",
    title: "Definitions",
    text: `As used in this chapter, unless the context otherwise indicates, the following terms have the following meanings.
1. Breach of the security of the system. "Breach of the security of the system" means unauthorized acquisition, release or use of an individual's computerized data that includes personal information that compromises the security, confidentiality or integrity of personal information maintained by a person. Good faith acquisition, release or use of personal information by an employee or agent of a person for the purposes of the person is not a breach of the security of the system if the personal information is not used for or subject to further unauthorized disclosure.
2. Encryption. "Encryption" means the disguising of data using generally accepted practices.
3. Information broker. "Information broker" means a person who, for monetary fees or dues, engages in whole or in part in the business of collecting, assembling, evaluating, compiling, reporting, transmitting, transferring or communicating information concerning individuals for the primary purpose of furnishing personal information to nonaffiliated 3rd parties, but does not include a governmental agency that maintains records concerning traffic safety, law enforcement or licensing.
4. Notice. "Notice" includes written notice and electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in the Electronic Signatures in Global and National Commerce Act, 15 United States Code, Section 7001. If the person required to provide notice demonstrates that the cost of providing notice will exceed $5,000, that the affected class of individuals to be notified exceeds 1,000 or that the person does not have sufficient contact information to provide written or electronic notice to those individuals, the person may provide substitute notice.
5. Person. "Person" means an individual, partnership, corporation, limited liability company, trust, estate, cooperative, association or other entity, including agencies of State Government, municipalities, school administrative units, the University of Maine System, the Maine Community College System and Maine Maritime Academy.
6. Personal information. "Personal information" means an individual's first name, or first initial, and last name in combination with any one or more of the following data elements, when either the name or the data elements are not encrypted or redacted: A. Social Security number; B. Driver's license number or state identification card number; C. Account number, credit card number or debit card number, if circumstances exist in which the number could be used without additional identifying information, access codes or passwords; D. Account passwords or personal identification numbers or other access codes; or E. Any of the data elements contained in paragraphs A to D when not in connection with the individual's first name, or first initial, and last name, if the information if compromised would be sufficient to permit a person to fraudulently assume or attempt to assume the identity of the person whose information was compromised. "Personal information" does not include information that is lawfully obtained from publicly available information, or from federal, state or local government records lawfully made available to the general public.`,
  },
  {
    document_index: 0,
    section_number: "§ 1348",
    title: "Notice of security breaches involving personal information",
    text: `1. Information brokers; 3rd parties. An information broker that maintains computerized data that includes personal information shall, when it becomes aware of a breach of the security of the system, notify the individuals whose personal information has been, or is reasonably believed to have been, acquired by an unauthorized person. Any other person that maintains computerized data that includes personal information shall, when it becomes aware of a breach of the security of the system, notify the individuals whose personal information has been, or is reasonably believed to have been, acquired by an unauthorized person, if misuse of the personal information has occurred or if misuse of that information is reasonably possible.
Notices under this subsection must be provided as expediently as possible and without unreasonable delay, and in no case later than 30 days after the person or entity becomes aware of the breach of the security of the system, except as otherwise provided in subsection 3 or 4.
2. Third party. A 3rd party that maintains computerized data on behalf of a person that includes personal information that the 3rd party does not own shall notify the person who owns or licenses the data of a breach of the security of the system immediately following discovery of the breach if the personal information was, or is reasonably believed to have been, acquired by an unauthorized person.
3. Delayed notice. The notification required in subsection 1 may be delayed for no longer than 7 business days after a law enforcement agency determines that the notification will not compromise a criminal investigation.
4. Notice to consumer reporting agencies. If an individual or commercial entity discovers circumstances requiring notification pursuant to subsection 1 of more than 1,000 persons at one time, the individual or commercial entity shall also notify, without unreasonable delay, all consumer reporting agencies that compile and maintain files on consumers on a nationwide basis.
5. Notice to regulators. A person that is required to provide notice under subsection 1 shall notify the appropriate regulators within the Department of Professional and Financial Regulation. If the person is not regulated by the department, the person shall notify the Attorney General.`,
  },
  {
    document_index: 0,
    section_number: "§ 1349",
    title: "Enforcement; penalties",
    text: `1. Enforcement. The appropriate state regulators within the Department of Professional and Financial Regulation shall enforce this chapter for any person that is licensed or regulated by those regulators. The Attorney General shall enforce this chapter for all other persons.
2. Civil violation. A person that violates this chapter commits a civil violation and is subject to one or more of the following: A. A fine of not more than $500 per violation, up to a maximum of $2,500 for each day the person is in violation of this chapter, except that this paragraph does not apply to State Government, municipalities, school administrative units, the University of Maine System, the Maine Community College System or Maine Maritime Academy; B. Equitable relief; or C. Enjoinment from further violations of this chapter.
3. Cumulative effect. The rights and remedies available under this section are cumulative and do not affect or prevent rights and remedies available under federal or state law.
4. Exceptions. A person that complies with the security breach notification requirements of rules, regulations, procedures or guidelines established pursuant to federal law or the law of this State is deemed to be in compliance with the requirements of section 1348 as long as the law, rules, regulations or guidelines provide for notification procedures at least as protective as the notification requirements of section 1348.`,
  },
]);

// ─── MISSISSIPPI ─────────────────────────────────────────────────────────────
addProvisions("ms", [
  {
    document_index: 0,
    section_number: "§ 75-24-29",
    title: "Notification to affected persons of breach of security",
    text: `(1) Any person who conducts business in this state and who, in the ordinary course of the person's business, owns, licenses or maintains personal information of any resident of this state, shall disclose any breach of security to the affected person following discovery of the breach. The disclosure shall be made without unreasonable delay. Notification may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation. The notification required by this section shall be made after the law enforcement agency determines that notification will not compromise the investigation.

(2) Any person who maintains computerized personal information on behalf of another person or business shall notify the owner or licensee of the information of any breach of the security of the system containing personal information immediately following discovery if the personal information was, or is reasonably believed to have been, acquired by an unauthorized person.

(3) The notification required by this section may be provided by one of the following methods:
(a) Written notice.
(b) Electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in the Electronic Signatures in Global and National Commerce Act (15 USCS 7001 et seq.).
(c) Substitute notice, if the person demonstrates that the cost of providing notice would exceed five thousand dollars ($5,000.00), or that the affected class of subject persons to be notified exceeds five thousand (5,000), or the person does not have sufficient contact information. Substitute notice shall consist of all of the following: (i) E-mail notice when the person has an e-mail address for the subject persons; (ii) Conspicuous posting of the notice on the internet website page of the person, if the person maintains one; and (iii) Notification to major statewide media.

(4) Notwithstanding subsection (3) of this section, a person that maintains its own notification procedures as part of an information security policy for the treatment of personal information and is otherwise consistent with the timing requirements of this section, shall be deemed to be in compliance with the notification requirements of this section, if the person notifies subject persons in accordance with its policies in the event of a breach of security of the system.

(5) As used in this section:
(a) "Breach of security" means unauthorized acquisition of electronic files, media, databases or computerized data containing personal information of any resident of this state when access to the personal information has not been secured by encryption or by any other method or technology that renders the personal information unreadable or unusable.
(b) "Personal information" means an individual's first name or first initial and last name in combination with any one (1) or more of the following data elements when either the name or the data elements are not encrypted: (i) Social Security number; (ii) Driver's license number or state identification card number; (iii) Financial account number, or credit or debit card number in combination with any required security code, access code or password that would permit access to an individual's financial account.`,
  },
]);

// ─── NEBRASKA ────────────────────────────────────────────────────────────────
addProvisions("ne", [
  {
    document_index: 0,
    section_number: "§ 87-802",
    title: "Definitions",
    text: `For purposes of the Financial Data Protection and Consumer Notification of Data Security Breach Act of 2006:
(1) Breach of the security of the system means unauthorized acquisition of unencrypted computerized data that compromises the security, confidentiality, or integrity of personal information maintained by an individual or a commercial entity. Good faith acquisition of personal information by an employee or agent of an individual or a commercial entity for the purposes of the individual or the commercial entity is not a breach of the security of the system if the personal information is not used or subject to further unauthorized disclosure.
(2) Commercial entity means a corporation, business trust, estate, trust, partnership, limited partnership, limited liability partnership, limited liability company, association, organization, joint venture, government, governmental subdivision, agency, or instrumentality, or any other legal entity, whether for profit or not for profit.
(3) Individual means a natural person.
(4) Nebraska resident means a person whose principal mailing address, as reflected in the computerized data which is breached, is in Nebraska.
(5) Personal information means either of the following: (a) A Nebraska resident's first name or first initial and last name in combination with any one or more of the following data elements that relate to the resident if either the name or the data elements are not encrypted, redacted, or otherwise altered by any method or technology in such a manner that the name or data elements are unreadable: (i) Social security number; (ii) Motor vehicle operator's license number or state identification card number; (iii) Account number or credit or debit card number, in combination with any required security code, access code, or password that would permit access to a resident's financial account; (iv) Unique electronic identification number or routing code, in combination with any required security code, access code, or password; or (v) Unique biometric data, such as a fingerprint, voice print, or retina or iris image, or other unique physical representation. (b) A user name or email address, in combination with a password or security question and answer, that would permit access to an online account.`,
  },
  {
    document_index: 0,
    section_number: "§ 87-803",
    title: "Notice of breach of security; requirements",
    text: `(1) An individual or a commercial entity that conducts business in Nebraska and that owns or licenses computerized data that includes personal information about a resident of Nebraska shall, when it becomes aware of a breach of the security of the system, conduct in good faith a reasonable and prompt investigation to determine the likelihood that personal information has been or will be used for an unauthorized purpose. If the investigation determines that the use of information about a Nebraska resident for an unauthorized purpose has occurred or is reasonably likely to occur, the individual or the commercial entity shall give notice to the affected Nebraska resident. Notice shall be made as soon as possible and without unreasonable delay, consistent with the legitimate needs of law enforcement and consistent with any measures necessary to determine the scope of the breach and, if necessary, to restore the reasonable integrity of the computerized data system.

(2) An individual or a commercial entity that maintains computerized data that includes personal information that the individual or commercial entity does not own shall give notice to the owner or licensee of the personal information of any breach of the security of the system as soon as possible and without unreasonable delay when the use of personal information about a Nebraska resident for an unauthorized purpose has occurred or is reasonably likely to occur.

(3) Notice required by this section may be provided by one of the following methods: (a) Written notice; (b) Electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. 7001; or (c) Substitute notice, if the individual or the commercial entity required to provide notice demonstrates that the cost of providing notice will exceed seventy-five thousand dollars, that the affected class of Nebraska residents to be notified exceeds one hundred thousand persons, or that the individual or commercial entity does not have sufficient contact information to provide written or electronic notice.

(4) Notice to Nebraska residents shall include, to the extent known: (a) A description of the incident in general terms; (b) The type of personal information that was subject to the unauthorized access and acquisition; (c) The telephone number and address of the individual or commercial entity and the toll-free telephone numbers and addresses of the major credit reporting agencies; and (d) Advice that directs the Nebraska resident to remain vigilant by reviewing account statements and monitoring free credit reports.`,
  },
]);

// ─── NEW HAMPSHIRE ───────────────────────────────────────────────────────────
addProvisions("nh", [
  {
    document_index: 0,
    section_number: "§ 359-C:19",
    title: "Definitions",
    text: `In this subdivision:
I. "Computerized data" means personal information stored in an electronic format.
II. "Encrypted" means the transformation of data through the use of an algorithmic process into a form for which there is a low probability of assigning meaning without use of a confidential process or key, or securing the information by another method that renders the data elements completely unreadable or unusable. Data shall not be considered to be encrypted for purposes of this subdivision if it is acquired in combination with any required key, security code, access code, or password that would permit access to the encrypted data.
III. "Person" means an individual, corporation, trust, partnership, incorporated or unincorporated association, limited liability company, or other form of entity, or any agency, authority, board, court, department, division, commission, institution, bureau, or other state governmental entity, or any political subdivision of the state.
IV. (a) "Personal information" means an individual's first name or initial and last name in combination with any one or more of the following data elements, when either the name or the data elements are not encrypted:
(1) Social security number.
(2) Driver's license number or other government identification number.
(3) Account number, credit card number, or debit card number, in combination with any required security code, access code, or password that would permit access to an individual's financial account.
(b) "Personal information" shall not include information that is lawfully made available to the general public from federal, state, or local government records.
V. "Security breach" means unauthorized acquisition of computerized data that compromises the security or confidentiality of personal information maintained by a person doing business in this state. Good faith acquisition of personal information by an employee or agent of a person for the purposes of the person's business shall not be considered a security breach, provided that the personal information is not used or subject to further unauthorized disclosure.`,
  },
  {
    document_index: 0,
    section_number: "§ 359-C:20",
    title: "Notification of security breach required",
    text: `I. Any person doing business in this state who owns or licenses computerized data that includes personal information shall, when it becomes aware of a security breach, promptly determine the likelihood that the information has been or will be misused. If the determination is that misuse of the information has occurred or is reasonably likely to occur, or if a determination cannot be made, the person shall notify the affected individuals as soon as possible but not later than 60 days after discovery of the security breach.
II. Such notification may be delayed if a law enforcement agency, or national or homeland security agency determines that the notification will impede a criminal investigation.
III. Notification may be provided by one of the following methods: (a) Written notice; (b) Electronic notice, if the agency or business's primary means of communication with the individual is by electronic means, or is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. section 7001; (c) Telephonic notice, provided that a log of each such notification is kept by the person who made the notification; (d) Substitute notice, if the person demonstrates that the cost of providing notice would exceed $5,000, that the affected class of subject individuals to be notified exceeds 1,000, or the person does not have sufficient contact information. Substitute notice shall consist of all of the following: (1) E-mail notice when the person has an e-mail address for the subject individuals; (2) Conspicuous posting of the notice on the person's business website page, if the person maintains one; and (3) Notification to major statewide media; or (e) Notice pursuant to the person's internal notification procedures maintained as part of an information security policy for the treatment of personal information.
IV. Notices under this section shall include at a minimum: (a) A description of the incident in general terms; (b) The approximate date of the breach; (c) The type of personal information obtained as a result of the security breach; and (d) The telephonic contact information of the person subject to this section.
V. A person who maintains a security breach procedure pursuant to the rules, regulations, procedures, or guidelines established by the person's primary or functional state or federal regulator shall be deemed to be in compliance with this subdivision if the person notifies affected individuals in accordance with the procedures when a security breach occurs.
VI. In the event that any person discovers a security breach that requires notification to more than 1,000 consumers, such person shall also notify, without unreasonable delay, all consumer reporting agencies that compile and maintain files on consumers on a nationwide basis, as defined by 15 U.S.C. section 1681a(p), of the timing, distribution and content of the notice. This paragraph shall not apply to a person who is subject to Title V of the Gramm-Leach-Bliley Act, 15 U.S.C. section 6801 et seq.`,
  },
  {
    document_index: 0,
    section_number: "§ 359-C:21",
    title: "Violation",
    text: `I. Any person injured by any violation of this subdivision may bring an action for damages and for such equitable relief, including an injunction, as the court deems necessary and proper. If the court finds for the plaintiff, recovery shall be in the amount of actual damages. If the court finds that the act or practice was a willful or knowing violation of this subdivision, it shall award as much as 3 times, but not less than 2 times, such amount. In addition, a prevailing plaintiff shall be awarded the costs of the suit and reasonable attorney's fees, as determined by the court. Any attempted waiver of the right to the damages set forth in this paragraph shall be void and unenforceable. Injunctive relief shall be available to private individuals under this subdivision without bond, subject to the discretion of the court.
II. The attorney general's office shall enforce the provisions of this subdivision pursuant to the provisions of RSA 358-A:4.
III. The burden of demonstrating compliance with the requirements of RSA 359-C:20, I shall be on the person required to make the determination.`,
  },
  {
    document_index: 1,
    section_number: "§ 507-H:3",
    title: "Consumer rights — NH Privacy Act",
    text: `I. A consumer has the right to confirm whether a controller is processing the consumer's personal data and to access the consumer's personal data.
II. A consumer has the right to correct inaccuracies in the consumer's personal data.
III. A consumer has the right to delete personal data concerning the consumer.
IV. A consumer has the right to obtain a copy of the consumer's personal data in a portable and, to the extent technically feasible, readily usable format.
V. A consumer has the right to opt out of: (a) Targeted advertising; (b) The sale of personal data; and (c) Profiling in furtherance of solely automated decisions that produce legal or similarly significant effects concerning the consumer.`,
  },
]);

// ─── OKLAHOMA ────────────────────────────────────────────────────────────────
addProvisions("ok", [
  {
    document_index: 0,
    section_number: "§ 163",
    title: "Disclosure of breach of security of computerized personal information",
    text: `A. An individual or entity that owns or licenses computerized data that includes personal information of a resident of this state shall disclose any breach of the security of the system following discovery or notification of the breach to any resident of this state whose unencrypted and unredacted personal information was or is reasonably believed to have been accessed and acquired by an unauthorized person and that causes, or the individual or entity reasonably believes has caused or will cause, identity theft or other fraud to any resident of this state. Disclosure shall be made in the most expedient time possible and without unreasonable delay, consistent with the legitimate needs of law enforcement, as provided in subsection C of this section, or any measures necessary to determine the scope of the breach and restore the reasonable integrity, security, and confidentiality of the data system.

B. An individual or entity that maintains computerized data that includes personal information of a resident of this state that the individual or entity does not own or license shall notify the owner or licensee of the information of any breach of the security of the system immediately following discovery of the breach, if the personal information was, or the individual or entity reasonably believes was, accessed and acquired by an unauthorized person.

C. The notification required by this section may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation. The notification required by this section shall be made after the law enforcement agency determines that notification will not compromise the investigation.

D. For purposes of this section:
1. "Breach of the security of the system" means unauthorized access and acquisition of unencrypted and unredacted computerized data that compromises the security or confidentiality of personal information maintained by an individual or entity as part of a database of personal information regarding multiple individuals and that causes, or the individual or entity reasonably believes has caused or will cause, identity theft or other fraud to any resident of this state;
2. "Personal information" means the first name or first initial and last name in combination with and linked to any one or more of the following data elements that relate to a resident of this state, when the data elements are neither encrypted nor redacted: a. Social Security number, b. driver license number or state identification card number, c. financial account number, or credit card or debit card number, in combination with any required security code, access code, or password that would permit access to the financial accounts of the individual, or d. any combination of data that would allow a reasonable person to believe that the information could be used to commit identity theft without reference to additional external information.

E. The notification required by this section may be provided by one of the following methods:
1. Written notice;
2. Electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in the Electronic Signatures in Global and National Commerce Act;
3. Substitute notice, if the individual or entity demonstrates that the cost of providing notice would exceed $50,000.00, or that the affected class of residents to be notified exceeds 100,000, or the individual or entity does not have sufficient contact information.`,
  },
]);

// ─── PENNSYLVANIA ────────────────────────────────────────────────────────────
addProvisions("pa", [
  {
    document_index: 0,
    section_number: "§ 2303",
    title: "Notification of breach",
    text: `(a) General rule. An entity that maintains, stores or manages computerized data that includes personal information shall provide notice of any breach of the security of the system following discovery of the breach of the security of the system to any resident of this Commonwealth whose unencrypted and unredacted personal information was or is reasonably believed to have been accessed and acquired by an unauthorized person.

(b) Notification required of vendor. An entity that maintains, stores or manages computerized data on behalf of another entity that includes personal information shall provide notice of any breach of the security of the system following discovery by the vendor of the breach of the security of the system to the entity on whose behalf the vendor maintains, stores or manages the data. The vendor shall provide such notice as soon as reasonably practicable following discovery. The entity shall be responsible for making the determinations and providing the notices required under this act.

(c) Timing. Except as provided in section 4, the notice shall be made without unreasonable delay.

(d) Manner of notice. Notice under this section may be given by one of the following methods:
(1) Written notice to the last known home address for the individual.
(2) Telephonic notice, if the customer can be reasonably expected to receive it and the notice is given in a clear and conspicuous manner, describes the incident in general terms and verifies personal information but does not require the customer to provide personal information and the customer is provided with a telephone number to call or Internet website to visit for further information and assistance.
(3) E-mail notice, if a prior business relationship exists and the person or entity has a valid e-mail address for the individual.
(4) Substitute notice, if the entity demonstrates one of the following: (i) The cost of providing notice would exceed $100,000. (ii) The affected class of subject persons to be notified exceeds 175,000. (iii) The entity does not have sufficient contact information.
Substitute notice shall consist of all of the following: (i) E-mail notice when an e-mail address is available for the subject persons. (ii) Conspicuous posting of the notice on the entity's Internet website if the entity maintains one. (iii) Notification to major Statewide media.

(e) Federal compliance. An entity that complies with the notification requirements or procedures pursuant to the rules, regulations, procedures or guidelines established by the entity's primary or functional Federal regulator shall be deemed to be in compliance with this act.`,
  },
  {
    document_index: 0,
    section_number: "§ 2302",
    title: "Definitions",
    text: `The following words and phrases when used in this act shall have the meanings given to them in this section unless the context clearly indicates otherwise:
"Breach of the security of the system." The unauthorized access and acquisition of computerized data that materially compromises the security or confidentiality of personal information maintained by the entity as part of a database of personal information regarding multiple individuals and that causes or the entity reasonably believes has caused or will cause loss or injury to any resident of this Commonwealth. Good faith acquisition of personal information by an employee or agent of the entity for the purposes of the entity is not a breach of the security of the system if the personal information is not used for a purpose other than the lawful purpose of the entity and is not subject to further unauthorized disclosure.
"Encrypted." The use of an algorithmic process to transform data into a form in which there is a low probability of assigning meaning without use of a confidential process or key.
"Entity." A State agency, a political subdivision of the Commonwealth, an individual, corporation, business trust, estate, trust, partnership, association, two or more persons having a joint or common economic interest, or any other legal or commercial entity that maintains, stores or manages computerized data that includes personal information.
"Personal information." An individual's first name or first initial and last name in combination with and linked to any one or more of the following data elements when the data elements are not encrypted or redacted: (1) Social Security number. (2) Driver's license number or a State identification card number issued in lieu of a driver's license. (3) Financial account number, credit or debit card number, in combination with any required security code, access code or password that would permit access to an individual's financial account.`,
  },
]);

// ─── RHODE ISLAND ────────────────────────────────────────────────────────────
addProvisions("ri", [
  {
    document_index: 0,
    section_number: "§ 11-49.3-3",
    title: "Notice of breach",
    text: `(a) Any municipal agency, state agency, or person that owns or licenses computerized data that includes personal information shall provide notification of any disclosure of personal information, or any breach of the security of the system, that poses a significant risk of identity theft to any resident of Rhode Island whose personal information was, or is reasonably believed to have been, acquired by an unauthorized person or entity, and shall provide notification to the major credit reporting agencies. This notice shall include the types of information believed to have been breached, the date of the breach, and steps affected persons should take to protect themselves. The notice shall be made in the most expedient time possible but no later than forty-five (45) calendar days after confirmation of the breach and the ability to ascertain the information required to fulfill the notice requirements.

(b) Any municipal agency, state agency, or person that maintains computerized data that includes personal information that the municipal agency, state agency, or person does not own shall notify the owner or licensee of the information of any breach of the security of the system immediately following discovery.

(c) The notification required by this section may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation. The notification shall be made after the law enforcement agency determines that the notification will not compromise the investigation.

(d) Notice of a security breach required by this section may be provided by one of the following methods:
(1) Written notice;
(2) Electronic notice, if the notice provided is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. § 7001;
(3) Substitute notice, if the municipal agency, state agency, or person demonstrates that the cost of providing notice would exceed $25,000.00, or that the affected class of subject persons to be notified exceeds 50,000, or the municipal agency, state agency, or person does not have sufficient contact information. Substitute notice shall consist of all of the following: (i) E-mail notice when the municipal agency, state agency, or person has an e-mail address for the subject persons; (ii) Conspicuous posting of the notice on the municipal agency, state agency, or person's website, if the entity maintains one; and (iii) Notification to major statewide media.

(e) Any person that is required to issue a notification pursuant to this section shall simultaneously send a copy of the notification to the attorney general, exclusive of any personally identifiable information.

(f) If a breach of the security of the system affects more than five hundred (500) Rhode Island residents, the person must provide notice in electronic form to the attorney general, and shall include: the number of Rhode Island residents affected by the breach; a description of the breach; and actions taken by the person to address the breach.`,
  },
  {
    document_index: 0,
    section_number: "§ 11-49.3-2",
    title: "Definitions",
    text: `As used in this chapter:
(1) "Breach of the security of the system" means unauthorized access or acquisition of unencrypted computerized data information that compromises the security, confidentiality, or integrity of personal information maintained by the state agency, municipality, or person. Good faith acquisition of personal information by an employee or agent of the agency for the purposes of the agency is not a breach of the security of the system, provided that the personal information is not used or subject to further unauthorized disclosure.
(5) "Personal information" means an individual's first name or first initial and last name in combination with any one or more of the following data elements, when either the name or the data elements are not encrypted: (i) Social Security number; (ii) Driver's license number, Rhode Island identification card number, or tribal identification number; (iii) Account number, credit or debit card number, in combination with any required security code, access code, password, or personal identification number that would permit access to an individual's financial account; (iv) Medical or health insurance information; (v) E-mail address with any required security code, access code, or password that would permit access to an individual's personal, medical, insurance, or financial account.`,
  },
  {
    document_index: 1,
    section_number: "§ 6-48.1-2",
    title: "Definitions — Rhode Island Data Transparency and Privacy Protection Act",
    text: `As used in this chapter:
(3) "Consumer" means a natural person who is a Rhode Island resident acting only in an individual or household context.
(5) "Controller" means the natural or legal person that, alone or jointly with others, determines the purpose and means of processing personal data.
(10) "Personal data" means any information that is linked or reasonably linkable to an identified or identifiable natural person. "Personal data" does not include de-identified data or publicly available information.
(14) "Processor" means a natural or legal person that processes personal data on behalf of a controller.
(17) "Sensitive data" means a category of personal data that includes: (i) Personal data revealing racial or ethnic origin, religious beliefs, mental or physical health condition or diagnosis, sex life, sexual orientation, or citizenship or immigration status; (ii) The processing of genetic or biometric data for the purpose of uniquely identifying a natural person; (iii) The personal data collected from a known child; or (iv) Precise geolocation data.`,
  },
]);

// ─── SOUTH DAKOTA ────────────────────────────────────────────────────────────
// Scraped via Playwright from sdlegislature.gov
addProvisions("sd", [
  {
    document_index: 0,
    section_number: "§ 22-40-19",
    title: "Definition of terms",
    text: `Terms in §§ 22-40-19 to 22-40-26, inclusive, mean:
(1) "Breach of system security," the unauthorized acquisition of unencrypted computerized data or encrypted computerized data and the encryption key by any person that materially compromises the security, confidentiality, or integrity of personal or protected information maintained by the information holder. The term does not include the good faith acquisition of personal or protected information by an employee or agent of the information holder for the purposes of the information holder if the personal or protected information is not used or subject to further unauthorized disclosure;
(2) "Encrypted," computerized data that is rendered unusable, unreadable, or indecipherable without the use of a decryption process or key or in accordance with the Federal Information Processing Standard 140-2 in effect on January 1, 2018;
(3) "Information holder," any person or business that conducts business in this state, and that owns or licenses computerized personal or protected information of residents of this state;
(4) "Personal information," a person's first name or first initial and last name, in combination with any one or more of the following data elements:
(a) Social security number;
(b) Driver license number or other unique identification number created or collected by a government body;
(c) Account, credit card, or debit card number, in combination with any required security code, access code, password, routing number, PIN, or any additional information that would permit access to a person's financial account;
(d) Health information as defined in 45 CFR 160.103; or
(e) An identification number assigned to a person by the person's employer in combination with any required security code, access code, password, or biometric data generated from measurements or analysis of human body characteristics for authentication purposes.
The term does not include information that is lawfully made available to the general public from federal, state, or local government records or information that has been redacted, or otherwise made unusable; and
(5) "Protected information," includes:
(a) A user name or email address, in combination with a password, security question answer, or other information that permits access to an online account; and
(b) Account number or credit or debit card number, in combination with any required security code, access code, or password that permits access to a person's financial account;
(6) "Unauthorized person," any person not authorized to acquire or disclose personal information, or any person authorized by the information holder to access personal information who has acquired or disclosed the personal information outside the guidelines for access of disclosure established by the information holder.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-20",
    title: "Notice of breach of system security — Exception",
    text: `Following the discovery by or notification to an information holder of a breach of system security an information holder shall disclose in accordance with § 22-40-22 the breach of system security to any resident of this state whose personal or protected information was, or is reasonably believed to have been, acquired by an unauthorized person. A disclosure under this section shall be made not later than sixty days from the discovery or notification of the breach of system security, unless a longer period of time is required due to the legitimate needs of law enforcement as provided under § 22-40-21. An information holder is not required to make a disclosure under this section if, following an appropriate investigation and notice to the attorney general, the information holder reasonably determines that the breach will not likely result in harm to the affected person. The information holder shall document the determination under this section in writing and maintain the documentation for not less than three years.

Any information holder that experiences a breach of system security under this section shall disclose to the attorney general by mail or electronic mail any breach of system security that exceeds two hundred fifty residents of this state.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-21",
    title: "Delay of notice that would impede criminal investigation",
    text: `A notification required under § 22-40-20 may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation. If the notification is delayed, the notification shall be made not later than thirty days after the law enforcement agency determines that notification will not compromise the criminal investigation.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-22",
    title: "Types of notice of breach of system security",
    text: `A disclosure under § 22-40-20 may be provided by:
(1) Written notice;
(2) Electronic notice, if the electronic notice is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. § 7001 in effect as of January 1, 2018, or if the information holder's primary method of communication with the resident of this state has been by electronic means; or
(3) Substitute notice, if the information holder demonstrates that the cost of providing notice would exceed two hundred fifty thousand dollars, that the affected class of persons to be notified exceeds five hundred thousand persons, or that the information holder does not have sufficient contact information and the notice consists of each of the following:
(a) Email notice, if the information holder has an email address for the subject persons;
(b) Conspicuous posting of the notice on the information holder's website, if the information holder maintains a website page; and
(c) Notification to statewide media.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-23",
    title: "Notice in accordance with information holder's policies",
    text: `Notwithstanding § 22-40-22, if an information holder maintains its own notification procedure as part of an information security policy for the treatment of personal or protected information and the policy is otherwise consistent with the timing requirements of this section, the information holder is in compliance with the notification requirements of § 22-40-22 if the information holder notifies each person in accordance with the information holder's policies in the event of a breach of system security.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-24",
    title: "Notice to consumer reporting agencies",
    text: `If an information holder discovers circumstances that require notification pursuant to § 22-40-20 the information holder shall also notify, without unreasonable delay, all consumer reporting agencies, as defined under 15 U.S.C. § 1681a in effect as of January 1, 2018, and any other credit bureau or agency that compiles and maintains files on consumers on a nationwide basis, of the timing, distribution, and content of the notice.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-25",
    title: "Prosecution for violations",
    text: `The attorney general may prosecute each failure to disclose under the provisions of §§ 22-40-19 to 22-40-26, inclusive, as a deceptive act or practice under § 37-24-6. In addition to any remedy provided under chapter 37-24, the attorney general may bring an action to recover on behalf of the state a civil penalty of not more than ten thousand dollars per day per violation. The attorney general may recover attorney's fees and any costs associated with any action brought under this section.`,
  },
  {
    document_index: 0,
    section_number: "§ 22-40-26",
    title: "Notice in accordance with federal law",
    text: `Notwithstanding any other provisions in §§ 22-40-19 to 22-40-26, inclusive, any information holder that is regulated by federal law or regulation, including the Health Insurance Portability and Accountability Act of 1996 (P.L. 104-191, as amended) or the Gramm Leach Bliley Act (15 U.S.C. § 6801 et seq., as amended) and that maintains procedures for a breach of system security pursuant to the laws, rules, regulations, guidance, or guidelines established by its primary or functional federal regulator is deemed to be in compliance with this chapter if the information holder notifies affected South Dakota residents in accordance with the provisions of the applicable federal law or regulation.`,
  },
]);

// ─── WISCONSIN ───────────────────────────────────────────────────────────────
addProvisions("wi", [
  {
    document_index: 0,
    section_number: "§ 134.98",
    title: "Notice of unauthorized acquisition of personal information",
    text: `(1) Definitions. In this section:
(a) "Entity" means a person, including the state and any political subdivision of the state, that does any of the following:
1. Conducts business in this state and maintains personal information in the ordinary course of business.
2. Licenses personal information in this state.
(b) "Financial account number" includes a credit card number and a debit card number.
(c) "Personal information" means an individual's last name and the individual's first name or first initial, in combination with and linked to any of the following elements, if the element is not publicly available information and is not encrypted, redacted, or altered in a manner that renders the element unreadable:
1. The individual's social security number.
2. The individual's driver's license number or state identification number.
3. The number of the individual's financial account number, including a credit or debit card account number, or any security code, access code, or password that would permit access to the individual's financial account.
4. The individual's deoxyribonucleic acid profile, as defined in s. 939.74(2d)(a).
5. The individual's unique biometric data, including fingerprint, voice print, retina or iris image, or any other unique physical representation.
(d) "Subject individual" means an individual who is a resident of this state and whose personal information has been acquired by a person whom the individual has not authorized to acquire the personal information.

(2) Notice of unauthorized acquisition of personal information.
(a) If an entity whose principal place of business is located in this state or an entity that maintains or licenses personal information in this state knows that personal information in the entity's possession has been acquired by a person whom the entity has not authorized to acquire the personal information, the entity shall make reasonable efforts to notify each subject individual of the unauthorized acquisition.
(b) An entity that is an individual who knows that personal information in the individual's possession has been acquired by a person whom the individual has not authorized to acquire the personal information shall make reasonable efforts to notify each subject individual of the unauthorized acquisition.

(3) Notification methods. An entity or individual under sub. (2) shall by any of the following means, whichever is applicable, make reasonable efforts to notify each subject individual:
(a) Individual notice. By mail or by a method the entity or individual has previously employed to communicate with the subject individual.
(b) If the entity or individual required under sub. (2) to make reasonable efforts to notify subject individuals does not have sufficient information to notify a subject individual under par. (a), or is unable to give notice under par. (a) after making a good faith effort, the entity or individual shall, within a reasonable time, do all of the following:
1. If the entity or individual has an e-mail address for the subject individual, provide notice to the subject individual by e-mail.
2. If the entity or individual has an Internet site, post a notice of the unauthorized acquisition of personal information on that Internet site.
3. Provide notice to statewide media.

(4) Coordination. If an entity knows that personal information pertaining to an individual has been acquired without authorization and the personal information was in the possession of an agent of the entity, the entity shall notify the agent of the unauthorized acquisition. The agent shall then assist the entity in complying with this section.

(5) Timing. An entity or individual required under this section to notify a subject individual of the unauthorized acquisition of personal information shall do so within a reasonable time, not to exceed 45 days after the entity or individual learns of the acquisition of personal information. A person who is an agent of another person and who knows that personal information in the agent's possession has been acquired by a person whom the agent has not authorized to acquire the personal information shall notify the other person within a reasonable time, not to exceed 45 days after learning of the unauthorized acquisition.

(6) Exemptions.
(a) An entity that is subject to, and in compliance with, the privacy and security requirements in 15 USC 6801 to 6809 and any rules promulgated under 15 USC 6801 to 6809 related to the protection of personal financial information is exempt from this section.
(b) An entity that is subject to, and in compliance with, the Health Insurance Portability and Accountability Act of 1996 (P.L. 104-191) is exempt from this section.`,
  },
]);

// ─── WYOMING ─────────────────────────────────────────────────────────────────
addProvisions("wy", [
  {
    document_index: 0,
    section_number: "§ 40-12-502",
    title: "Disclosure of breach of security; notice",
    text: `(a) Any individual or commercial entity that conducts business in Wyoming and that owns or licenses computerized data that includes personal identifying information about a resident of Wyoming shall, when it becomes aware of a breach of the security of the system, conduct in good faith a reasonable and prompt investigation to determine the likelihood that personal identifying information has been or will be misused. If the investigation determines that the misuse of personal identifying information about a Wyoming resident has occurred or is reasonably likely to occur, the individual or commercial entity shall give notice of the security breach to the affected Wyoming resident. Notice shall be made in the most expedient time possible and without unreasonable delay.

(b) Any individual or commercial entity that maintains computerized data that includes personal identifying information that the individual or commercial entity does not own shall give notice to the owner or licensee of the information of any breach of the security of the system immediately following discovery, if the personal identifying information was, or is reasonably believed to have been, acquired by an unauthorized person.

(c) The notification required by this section may be delayed if a law enforcement agency determines that the notification will impede a criminal investigation and the law enforcement agency has made a written request to the individual or commercial entity that the notification be delayed.

(d) The notification required by this section may be provided by one of the following methods:
(1) Written notice;
(2) Electronic notice, if the primary method of communication by the individual or commercial entity with the affected individual is by electronic means or is consistent with the provisions regarding electronic records and signatures set forth in 15 U.S.C. § 7001;
(3) Substitute notice, if the individual or commercial entity demonstrates that the cost of providing notice would exceed ten thousand dollars ($10,000.00), or that the affected class of Wyoming residents to be notified exceeds one hundred thousand (100,000), or the individual or commercial entity does not have sufficient contact information.

(e) The notification shall include at a minimum:
(1) The toll-free numbers, addresses and websites for consumer reporting agencies;
(2) The toll-free number, address and website for the federal trade commission; and
(3) A statement that the individual can obtain information from the federal trade commission and the consumer reporting agencies about fraud alerts and security freezes.`,
  },
  {
    document_index: 0,
    section_number: "§ 40-12-501",
    title: "Definitions",
    text: `(a) As used in this article:
(i) "Breach of the security of the system" means unauthorized acquisition of computerized data that materially compromises the security, confidentiality or integrity of personal identifying information maintained by a person. Good faith acquisition of personal identifying information by an employee or agent of the person for a legitimate purpose of the person is not a breach of the security of the system, if the personal identifying information is not used for a purpose other than a lawful purpose of the person and is not subject to further unauthorized disclosure.
(ii) "Commercial entity" means a corporation, business trust, estate, trust, partnership, limited partnership, limited liability partnership, limited liability company, association, organization, joint venture, government, governmental subdivision, agency, or instrumentality, or any other legal entity, whether for profit or not for profit.
(iii) "Encrypted" means the use of an algorithmic process to transform data into a form in which there is a low probability of assigning meaning without use of a confidential process or key.
(iv) "Personal identifying information" means a person's first name or first initial and last name in combination with one (1) or more of the following data elements when either the name or the data elements are not encrypted: (A) Social security number; (B) Driver's license number or Wyoming identification card number; (C) Account number, credit card number, or debit card number in combination with any required security code, access code, or password that would permit access to a financial account of the person; (D) Tribal identification card; (E) Federal or state government issued identification card; (F) Shared secrets or security tokens that are known to be used for data based authentication and identification; (G) A username or email address, in combination with a password or security question and answer that would permit access to an online account; (H) A birth or marriage certificate; (I) Medical information, meaning a person's medical history, mental or physical condition, or medical treatment or diagnosis by a health care professional; (J) Health insurance information, meaning a person's health insurance policy number or subscriber identification number, any unique identifier used by a health insurer to identify the person, or any information in a person's application and claims history; (K) Unique biometric data, meaning data generated by automatic measurements of a person's biological characteristics, such as a fingerprint, voice print, genetic print, retina or iris image, or other unique biological characteristic, that is used by the owner or licensee to uniquely authenticate a person's identity when the person accesses a system or account; (L) An individual taxpayer identification number.`,
  },
]);

console.log("\nDone! All 16 states populated.");
