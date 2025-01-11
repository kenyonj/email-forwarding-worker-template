export interface EmailConfigForDomainType {
  aliases: string[];
  emailAddress: string;
  groups: string[];
  type: string;
}

export interface EmailConfigType {
  config: EmailConfigForDomainType[];
  domain: string;
}
