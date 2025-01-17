export interface EmailConfigType {
  config: EmailConfigForDomainType[];
  domain: string;
}

export interface EmailConfigForDomainType {
  accounts: AccountsForConfigType[];
  delimiters: string[];
}

export interface AccountsForConfigType {
  aliases: string[];
  emailAddress: string;
  groups: string[];
  type: string;
}
