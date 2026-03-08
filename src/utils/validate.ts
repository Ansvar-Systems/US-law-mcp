import { JURISDICTIONS } from '../types/index.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateJurisdiction(jurisdiction: string | undefined, required: boolean): void {
  if (!jurisdiction) {
    if (required) {
      throw new ValidationError(
        'jurisdiction is required. Use "US-FED" for federal law, or "US-XX" for a state (e.g. "US-CA", "US-NY"). Call list_sources to see all available jurisdictions.',
      );
    }
    return;
  }

  if (!(jurisdiction in JURISDICTIONS)) {
    const suggestion = jurisdiction.toUpperCase().startsWith('US-')
      ? jurisdiction.toUpperCase()
      : `US-${jurisdiction.toUpperCase()}`;
    const isSuggestionValid = suggestion in JURISDICTIONS;

    throw new ValidationError(
      `Invalid jurisdiction "${jurisdiction}".` +
      (isSuggestionValid ? ` Did you mean "${suggestion}"?` : '') +
      ' Use "US-FED" for federal law, or "US-XX" for a state (e.g. "US-CA", "US-NY"). Call list_sources to see all available jurisdictions.',
    );
  }
}

export function validateNonEmptyString(value: unknown, paramName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${paramName} must be a non-empty string.`);
  }
  return value.trim();
}
