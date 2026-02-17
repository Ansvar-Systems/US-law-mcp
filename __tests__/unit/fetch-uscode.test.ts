import { describe, it, expect } from 'vitest';

import { buildUslmSectionUrl, parseUslmSectionXml } from '../../scripts/fetch-uscode.js';

const SAMPLE_USLM_XML = `
<usc xmlns="http://xml.house.gov/schemas/uslm/1.0">
  <section>
    <num>§ 1030</num>
    <heading>Fraud and related activity in connection with computers</heading>
    <content>
      <p>(a) Whoever knowingly accesses a computer without authorization...</p>
      <p>(e) As used in this section, the term "computer" means...</p>
      <sourceCredit>(Added 1986)</sourceCredit>
    </content>
  </section>
</usc>
`;

describe('fetch-uscode USLM helpers', () => {
  it('builds official USLM section URL', () => {
    const url = buildUslmSectionUrl(18, '1030');

    expect(url).toContain('https://uscode.house.gov/view.xhtml');
    expect(url).toContain('req=granuleid%3AUSC-prelim-title18-section1030');
    expect(url).toContain('edition=prelim');
    expect(url).toContain('f=xml');
  });

  it('parses heading and body text from USLM XML section', () => {
    const parsed = parseUslmSectionXml(SAMPLE_USLM_XML, '1030');

    expect(parsed).toBeTruthy();
    expect(parsed!.heading).toContain('Fraud and related activity');
    expect(parsed!.text).toContain('Whoever knowingly accesses');
    expect(parsed!.text).not.toContain('(Added 1986)');
  });

  it('returns null when section node is missing', () => {
    const parsed = parseUslmSectionXml('<usc><title>18</title></usc>', '1030');
    expect(parsed).toBeNull();
  });
});
