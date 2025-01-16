import type { EmailConfigForDomainType } from "./types";

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

  get recipientConfig(): EmailConfigForDomainType | undefined {
    if (!this.configForDomain) return undefined;

    return this.configForDomain.find(({ aliases }) => aliases.includes(this.recipientAccount));
  }

  get targetIsGroup(): boolean {
    return this.groups.has(this.target!);
  }

  get target(): string | null {
    return this.targetFromRecipientWithDelimiter || this.recipientAccount
  }

  get groupEmailAddresses(): string[] {
    if (!this.configForDomain) return [];

    return this.emailAddressesForGroup(this.target!);
  }

  get groups(): Set<string> {
    if (!this.configForDomain) return new Set();

    return new Set(this.configForDomain.flatMap(({ groups }: { groups: string[] }) => groups));
  }

  get aliases(): string[] {
    if (!this.configForDomain) return [];

    return this.configForDomain.flatMap(({ aliases }) => aliases);
  }

  get possibleTargets(): string[] {
    return [...this.aliases, ...this.groups];
  }

  get targetFromRecipientWithDelimiter(): string | null {
    for (const target of this.possibleTargets) {
      if (this.recipientAccount.startsWith(`${target}.`) || this.recipientAccount.startsWith(`${target}+`)) return target;
    }

    return null;
  }

  get configForDomain(): EmailConfigForDomainType[] | null {
    try {
      const parsedData = JSON.parse(this._data);
      const domainConfig = parsedData.find(
        (item: { domain: string }) => item.domain === this.recipientDomain,
      );

      return domainConfig?.config || null;
    } catch {
      return null;
    }
  }

  get parentEmailAddresses(): string[] {
    return this.emailAddressesForType("parent");
  }

  emailsToForwardTo(matchingConfig: EmailConfigForDomainType | undefined): string[] {
    if (!matchingConfig) return [];

    const { emailAddress, type } = matchingConfig;
    const emailsToForward = type === "child"
      ? [emailAddress, ...this.parentEmailAddresses]
      : [emailAddress];

    return emailsToForward;
  }

  emailAddressesForType(type: string): string[] {
    if (!this.configForDomain) return [];

    return this.configForDomain
      .filter(({ type: t }) => t === type)
      .map(({ emailAddress }) => emailAddress);
  }

  emailAddressesForGroup(group: string): string[] {
    if (!this.configForDomain) return [];

    return this.configForDomain
      .filter(({ groups }) => groups.includes(group))
      .map(({ emailAddress }) => emailAddress);
  }
}
