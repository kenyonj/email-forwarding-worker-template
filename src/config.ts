import type { EmailConfigForDomainType } from "./types";

export class EmailConfig {
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

  get groups(): Set<string> {
    if (!this.configForDomain) return new Set();

    return new Set(this.configForDomain.flatMap(({ groups }: { groups: string[] }) => groups));
  }

  get aliases(): string[] {
    if (!this.configForDomain) return [];

    return this.configForDomain.flatMap(({ aliases }) => aliases);
  }

  get targetAlias(): string | null {
    for (const alias of this.aliases) {
      if (this.recipientAccount.startsWith(`${alias}.`) || this.recipientAccount.startsWith(`${alias}+`)) return alias;
    }

    return null;
  }

  get targetGroup(): string | null {
    for (const group of this.groups) {
      if (this.recipientAccount.startsWith(`${group}.`) || this.recipientAccount.startsWith(`${group}+`)) return group;
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
