import type { AccountsForConfigType } from "./types";
import { Config } from "./config";

const REJECTION_MESSAGES = {
  invalidRecipient: "Recipient not allowed",
  serverError: "Server configuration error",
};

export class Processor {
  readonly message: any;
  readonly config: Config;
  readonly accountsForDomain: AccountsForConfigType[] | null;

  constructor(message: any, config: Config) {
    this.message = message;
    this.config = config;
    this.accountsForDomain = config.accountsForDomain;
  }

  async process(): Promise<void> {
    if (!this.config.isValidRecipient) return this._invalidRejection();
    if (!this.accountsForDomain) return this._serverErrorRejection();

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
      return await this._forwardEmails(this.config.emailAddressesForGroup(this.config.target!));
    } else {
      const matchingConfig = this.accountsForDomain!.find(({ aliases }) =>
        aliases.map(a => a.toLowerCase()).includes((this.config.target || "").toLowerCase()),
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
