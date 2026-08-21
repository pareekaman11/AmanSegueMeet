export const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmail.co': 'gmail.com',
  'gmail.c': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.col': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmail.co.in': 'gmail.com',
  'gmail.in': 'gmail.com',
  'gmail.org': 'gmail.com',
  'gmail.net': 'gmail.com',
  'gmail.edu': 'gmail.com',
  'gmail.io': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmaul.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmaill.co': 'gmail.com',
  'gamil.co': 'gmail.com',
  'googlemail.co': 'googlemail.com',
  'googlemail.c': 'googlemail.com',
  'googlemail.con': 'googlemail.com',

  // Yahoo typos
  'yahoo.co': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahoo.c': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.om': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'ymail.co': 'ymail.com',

  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hitmail.com': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmail.con': 'hotmail.com',

  // Outlook typos
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outloock.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.con': 'outlook.com',

  // iCloud typos
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'iclou.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icloud.cm': 'icloud.com',
  'icloud.con': 'icloud.com',

  // ProtonMail typos
  'protonmail.co': 'protonmail.com',
  'protonmai.com': 'protonmail.com',
  'proton.co': 'proton.me',
  'protonme.com': 'proton.me',
};

export const INCOMPLETE_PROVIDER_DOMAINS: Record<string, string> = {
  gmail: 'gmail.com',
  googlemail: 'googlemail.com',
  yahoo: 'yahoo.com',
  hotmail: 'hotmail.com',
  outlook: 'outlook.com',
  icloud: 'icloud.com',
  protonmail: 'protonmail.com',
};

// Character Length Limits (Configured Standards)
export const VALIDATION_LIMITS = {
  NAME: { MIN: 2, MAX: 20 },
  EMAIL: { MIN: 5, MAX: 50, LOCAL_MAX: 64 },
  PASSWORD: { MIN: 12, MAX: 20 },
  ORGANISATION_NAME: { MIN: 2, MAX: 30 },
  PHYSICAL_ADDRESS: { MIN: 5, MAX: 100 },
  COUNTRY: { MAX: 100 },
} as const;

export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24}$/;
export const NAME_REGEX = /^[\p{L}\p{M}'’\-\.\s]{2,20}$/u;
export const PASSWORD_REGEX = /(?=.*\d)(?=.*[\W_])(?=.*[A-Z])(?=.*[a-z]).*$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  suggestedEmail?: string;
}

export function validateEmailStrict(email: string): EmailValidationResult {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { isValid: false, error: 'Email address is required.' };
  }

  if (cleanEmail.length > VALIDATION_LIMITS.EMAIL.MAX) {
    return {
      isValid: false,
      error: `Email address cannot exceed ${VALIDATION_LIMITS.EMAIL.MAX} characters (RFC 5321 standard).`,
    };
  }

  if (cleanEmail.length < VALIDATION_LIMITS.EMAIL.MIN) {
    return { isValid: false, error: 'Email address is too short.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email must contain exactly one "@" symbol.' };
  }

  const [localPart, domain] = parts;

  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: 'Email username before "@" is missing.' };
  }

  if (localPart.length > VALIDATION_LIMITS.EMAIL.LOCAL_MAX) {
    return {
      isValid: false,
      error: `Email username cannot exceed ${VALIDATION_LIMITS.EMAIL.LOCAL_MAX} characters.`,
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Email username cannot begin or end with a dot.' };
  }

  if (localPart.includes('..')) {
    return { isValid: false, error: 'Email username contains invalid consecutive dots.' };
  }

  if (!domain || domain.length === 0) {
    return { isValid: false, error: 'Please enter a domain after the "@" (e.g. gmail.com).' };
  }

  if (domain.length > 253) {
    return { isValid: false, error: 'Email domain cannot exceed 253 characters.' };
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
    return { isValid: false, error: 'Email domain cannot begin or end with a dot or hyphen.' };
  }

  if (domain.includes('..')) {
    return { isValid: false, error: 'Email domain contains invalid consecutive dots.' };
  }

  // Check for incomplete provider names (e.g. user@gmail)
  if (INCOMPLETE_PROVIDER_DOMAINS[domain]) {
    const suggested = INCOMPLETE_PROVIDER_DOMAINS[domain];
    return {
      isValid: false,
      error: `Incomplete domain '@${domain}'.`,
      suggestion: `Did you mean @${suggested}?`,
      suggestedEmail: `${localPart}@${suggested}`,
    };
  }

  // Check for known domain typos (e.g. user@gmail.co)
  if (COMMON_DOMAIN_TYPOS[domain]) {
    const suggested = COMMON_DOMAIN_TYPOS[domain];
    return {
      isValid: false,
      error: `Incomplete or typo in domain '@${domain}'.`,
      suggestion: `Did you mean @${suggested}?`,
      suggestedEmail: `${localPart}@${suggested}`,
    };
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a complete and valid email address (e.g. name@company.com).' };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isValid: false, error: 'Email domain is missing a top-level extension (e.g. .com, .org).' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || tld.length > 24 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Incomplete or invalid domain extension (TLD).' };
  }

  return { isValid: true };
}

export function validateName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full Name is required.' };
  }

  if (trimmed.length < VALIDATION_LIMITS.NAME.MIN) {
    return {
      isValid: false,
      error: `Full Name must be at least ${VALIDATION_LIMITS.NAME.MIN} characters.`,
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.NAME.MAX) {
    return {
      isValid: false,
      error: `Full Name cannot exceed ${VALIDATION_LIMITS.NAME.MAX} characters.`,
    };
  }

  if (!NAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Full Name should only contain valid letters, spaces, hyphens, and apostrophes.',
    };
  }

  return { isValid: true };
}

export function validateOrganisationName(orgName: string): { isValid: boolean; error?: string } {
  const trimmed = orgName.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Organisation Name is required.' };
  }

  if (trimmed.length < VALIDATION_LIMITS.ORGANISATION_NAME.MIN) {
    return {
      isValid: false,
      error: `Organisation Name must be at least ${VALIDATION_LIMITS.ORGANISATION_NAME.MIN} characters.`,
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.ORGANISATION_NAME.MAX) {
    return {
      isValid: false,
      error: `Organisation Name cannot exceed ${VALIDATION_LIMITS.ORGANISATION_NAME.MAX} characters.`,
    };
  }

  return { isValid: true };
}

export function validatePhysicalAddress(address?: string): { isValid: boolean; error?: string } {
  if (!address) return { isValid: true };
  const trimmed = address.trim();
  if (!trimmed) return { isValid: true };

  if (trimmed.length < VALIDATION_LIMITS.PHYSICAL_ADDRESS.MIN) {
    return {
      isValid: false,
      error: `Physical Address must be at least ${VALIDATION_LIMITS.PHYSICAL_ADDRESS.MIN} characters if provided.`,
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.PHYSICAL_ADDRESS.MAX) {
    return {
      isValid: false,
      error: `Physical Address cannot exceed ${VALIDATION_LIMITS.PHYSICAL_ADDRESS.MAX} characters.`,
    };
  }

  return { isValid: true };
}

export interface PasswordRuleStatus {
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  passedCount: number;
  strengthLabel: 'Weak' | 'Fair' | 'Strong' | 'Enterprise Grade';
  strengthPercentage: number;
}

export function evaluatePasswordStrength(password: string): PasswordRuleStatus {
  const hasMinLength = password.length >= VALIDATION_LIMITS.PASSWORD.MIN;
  const hasMaxLength = password.length <= VALIDATION_LIMITS.PASSWORD.MAX;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[\W_]/.test(password);

  let passedCount = 0;
  if (hasMinLength && hasMaxLength) passedCount++;
  if (hasUppercase) passedCount++;
  if (hasLowercase) passedCount++;
  if (hasNumber) passedCount++;
  if (hasSpecial) passedCount++;

  let strengthLabel: 'Weak' | 'Fair' | 'Strong' | 'Enterprise Grade' = 'Weak';
  if (!hasMaxLength || passedCount <= 2) strengthLabel = 'Weak';
  else if (passedCount === 3 || passedCount === 4) strengthLabel = 'Fair';
  else if (passedCount === 5 && password.length < 16) strengthLabel = 'Strong';
  else if (passedCount === 5 && password.length >= 16) strengthLabel = 'Enterprise Grade';

  const strengthPercentage = !hasMaxLength
    ? 20
    : Math.min(100, Math.round((passedCount / 5) * 100));

  return {
    hasMinLength,
    hasMaxLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    passedCount,
    strengthLabel,
    strengthPercentage,
  };
}
