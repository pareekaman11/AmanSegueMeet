import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

// Known typos on popular mail providers that should never be accepted
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

// Known providers that do not have standalone domains without TLD
const INCOMPLETE_PROVIDER_DOMAINS: Record<string, string> = {
  gmail: 'gmail.com',
  googlemail: 'googlemail.com',
  yahoo: 'yahoo.com',
  hotmail: 'hotmail.com',
  outlook: 'outlook.com',
  icloud: 'icloud.com',
  protonmail: 'protonmail.com',
};

export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24}$/;

@ValidatorConstraint({ name: 'isValidEmailStrict', async: false })
export class IsValidEmailStrictConstraint implements ValidatorConstraintInterface {
  private failureReason: string = 'Please provide a valid, complete email address';

  validate(email: any, args: ValidationArguments) {
    if (typeof email !== 'string') {
      this.failureReason = 'Email address must be a string';
      return false;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      this.failureReason = 'Email address is required';
      return false;
    }

    if (cleanEmail.length > 254) {
      this.failureReason = 'Email address cannot exceed 254 characters (RFC 5321 standard)';
      return false;
    }

    if (cleanEmail.length < 6) {
      this.failureReason = 'Email address is too short';
      return false;
    }

    const parts = cleanEmail.split('@');
    if (parts.length !== 2) {
      this.failureReason = 'Email must contain exactly one "@" symbol';
      return false;
    }

    const [localPart, domain] = parts;

    if (!localPart || localPart.length === 0) {
      this.failureReason = 'Email username before "@" is missing';
      return false;
    }

    if (localPart.length > 64) {
      this.failureReason = 'Email username before "@" cannot exceed 64 characters';
      return false;
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      this.failureReason = 'Email username cannot begin or end with a dot';
      return false;
    }

    if (localPart.includes('..')) {
      this.failureReason = 'Email username contains invalid consecutive dots';
      return false;
    }

    if (!domain || domain.length === 0) {
      this.failureReason = 'Email domain after "@" is missing';
      return false;
    }

    if (domain.length > 253) {
      this.failureReason = 'Email domain cannot exceed 253 characters';
      return false;
    }

    if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
      this.failureReason = 'Email domain cannot start or end with a dot or hyphen';
      return false;
    }

    if (domain.includes('..')) {
      this.failureReason = 'Email domain contains invalid consecutive dots';
      return false;
    }

    // Check if domain is an incomplete provider name without TLD (e.g. user@gmail)
    if (INCOMPLETE_PROVIDER_DOMAINS[domain]) {
      this.failureReason = `Incomplete domain '@${domain}'. Did you mean '@${INCOMPLETE_PROVIDER_DOMAINS[domain]}'?`;
      return false;
    }

    // Check if domain has a known typo
    if (COMMON_DOMAIN_TYPOS[domain]) {
      this.failureReason = `Incomplete or typo in email domain '@${domain}'. Did you mean '@${COMMON_DOMAIN_TYPOS[domain]}'?`;
      return false;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      this.failureReason = 'Please enter a complete and valid email address (e.g., name@company.com)';
      return false;
    }

    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      this.failureReason = 'Email domain is missing a top-level domain (e.g. .com, .org)';
      return false;
    }

    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2 || tld.length > 24 || !/^[a-zA-Z]+$/.test(tld)) {
      this.failureReason = 'Email top-level domain (TLD) is incomplete or invalid';
      return false;
    }

    // Ensure all domain labels are <= 63 characters
    for (const label of domainParts) {
      if (label.length > 63 || label.length === 0) {
        this.failureReason = 'Domain label exceeds the maximum length of 63 characters';
        return false;
      }
      if (label.startsWith('-') || label.endsWith('-')) {
        this.failureReason = 'Domain labels cannot start or end with a hyphen';
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return this.failureReason;
  }
}

export function IsValidEmailStrict(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEmailStrictConstraint,
    });
  };
}
