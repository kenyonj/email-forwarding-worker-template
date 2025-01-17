import type { AccountsForConfigType, EmailConfigForDomainType } from "./types";

const DEFAULT_DELIMITERS = [".", "+"];

export class Config {
  readonly _recipient: string;
  readonly _data: string;

  constructor(recipient: string, env: any) {
    this._recipient = recipient;
    this._data = env.EMAIL_CONFIG;
  }

  get isValidRecipient(): boolean {
    return this._recipient.toLowerCase() !== ""
  }

  get recipientAccount(): string {
    return this._recipient.substring(0, this._recipient.indexOf("@"));
  }

  get recipientDomain(): string {
    return this._recipient.substring(this._recipient.indexOf("@") + 1);
  }

  get recipientConfig(): AccountsForConfigType | undefined {
    if (!this.accountsForDomain) return undefined;

    return this.accountsForDomain.find(({ aliases }) => aliases.includes(this.recipientAccount));
  }

  get targetIsGroup(): boolean {
    return this.groups.has(this.target!);
  }

  get target(): string | null {
    return this.targetFromRecipientWithDelimiter || this.recipientAccount
  }

  get groupEmailAddresses(): string[] {
    if (!this.accountsForDomain) return [];

    return this.emailAddressesForGroup(this.target!);
  }

  get groups(): Set<string> {
    if (!this.accountsForDomain) return new Set();

    return new Set(this.accountsForDomain.flatMap(({ groups }: { groups: string[] }) => groups));
  }

  get aliases(): string[] {
    if (!this.accountsForDomain) return [];

    return this.accountsForDomain.flatMap(({ aliases }) => aliases);
  }

  get possibleTargets(): string[] {
    return [...this.aliases, ...this.groups];
  }

  get targetFromRecipientWithDelimiter(): string | null {
    const delimiters = this.configForDomain?.delimiters || DEFAULT_DELIMITERS;

    for (const target of this.possibleTargets) {
      if (delimiters.some((delimiter) => this.recipientAccount.startsWith(`${target}${delimiter}`))) return target;
    }

    return null;
  }

  get configForDomain(): EmailConfigForDomainType | null {
    try {
      const parsedData = JSON.parse(this._data);
      const domainConfig = parsedData.find(
        (item: { domain: string }) => item.domain === this.recipientDomain,
      );

      return domainConfig || null;
    } catch {
      return null;
    }
  }

  get accountsForDomain(): AccountsForConfigType[] | null {
    if (!this.configForDomain) return null;
    return this.configForDomain.accounts
  }

  get parentEmailAddresses(): string[] {
    return this.emailAddressesForType("parent");
  }

  emailsToForwardTo(matchingConfig: AccountsForConfigType | undefined): string[] {
    if (!matchingConfig) return [];

    const { emailAddress, type } = matchingConfig;
    const emailsToForward = type === "child"
      ? [emailAddress, ...this.parentEmailAddresses]
      : [emailAddress];

    return emailsToForward;
  }

  emailAddressesForType(type: string): string[] {
    if (!this.accountsForDomain) return [];

    return this.accountsForDomain
      .filter(({ type: t }) => t === type)
      .map(({ emailAddress }) => emailAddress);
  }

  emailAddressesForGroup(group: string): string[] {
    if (!this.accountsForDomain) return [];

    return this.accountsForDomain
      .filter(({ groups }) => groups.includes(group))
      .map(({ emailAddress }) => emailAddress);
  }
}
