import type { EmailConfigForDomainType } from "./types";
import { EmailConfig } from "./config";

export class EmailProcessor {
  readonly _config: EmailConfig;
  readonly _configForDomain: EmailConfigForDomainType[] | null;

  constructor(config: EmailConfig) {
    this._config = config;
    this._configForDomain = config.configForDomain;
  }

  process(configToProcess: EmailConfigForDomainType | undefined): string[] {
    if (!configToProcess) return [];

    const { emailAddress, type } = configToProcess;
    const emailsToForward = type === "child"
      ? [emailAddress, ...this._config.parentEmailAddresses]
      : [emailAddress];

    return emailsToForward;
  }
}
