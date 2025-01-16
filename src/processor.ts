import type { EmailConfigForDomainType } from "./types";
import { Config } from "./config";

const REJECTION_MESSAGES = {
  invalidRecipient: "Recipient not allowed",
  serverError: "Server configuration error",
};

export class Processor {
  readonly message: any;
  readonly config: Config;
  readonly configForDomain: EmailConfigForDomainType[] | null;

  constructor(message: any, config: Config) {
    this.message = message;
    this.config = config;
    this.configForDomain = config.configForDomain;
  }

  async process(): Promise<void> {
    if (!this.config.isValidRecipient) return this._invalidRejection();
    if (!this.configForDomain) return this._serverErrorRejection();

    if (this.config.targetFromRecipientWithDelimiter) return this._handleDelimitedTarget();
    if (this.config.recipientConfig) return this._handleSimpleAliasTarget();
    if (this.config.targetIsGroup) return this._handleSimpleGroupTarget();

    return this._invalidRejection();
  };

  async _forwardEmails(emails: string[]): Promise<void> {
    for (const email of emails) {
      await this.message.forward(email);
    }
  };

  async _invalidRejection(): Promise<void> {
    await this.message.setReject(REJECTION_MESSAGES.invalidRecipient);
  }

  async _serverErrorRejection(): Promise<void> {
    await this.message.setReject(REJECTION_MESSAGES.serverError);
  }

  async _handleDelimitedTarget(): Promise<void> {
    if (this.config.targetIsGroup) {
      return await this._forwardEmails(this.config.emailAddressesForGroup(this.config.targetFromRecipientWithDelimiter!));
    } else {
      const matchingConfig = this.configForDomain!.find(({ aliases }) =>
        aliases.includes(this.config.targetFromRecipientWithDelimiter || ""),
      );

      return await this._forwardEmails(this.config.emailsToForwardTo(matchingConfig));
    }
  }

  async _handleSimpleAliasTarget(): Promise<void> {
    return await this._forwardEmails(this.config.emailsToForwardTo(this.config.recipientConfig!));
  }

  async _handleSimpleGroupTarget(): Promise<void> {
    return await this._forwardEmails(this.config.groupEmailAddresses);
  }
}
