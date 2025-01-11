import type { EmailConfigType } from "./types";
import { EmailConfig } from "./config";
import { EmailProcessor } from "./processor";

export default {
  async email(message: any, env: any): Promise<void> {
    const config = new EmailConfig(message.to, env);
    const configForDomain = config.configForDomain;
    const processor = new EmailProcessor(config);

    if (!config.isValidRecipient) {
      await message.setReject("Recipient not allowed");
      return;
    }

    if (!configForDomain) {
      await message.setReject("Server configuration error");
      return;
    }

    const forwardEmails = async (emails: string[]): Promise<void> => {
      for (const email of emails) {
        await message.forward(email);
      }
    };

    // Handle alias-with-delimiter based logic
    if (config.targetAlias) {
      const matchingConfig = configForDomain.find(({ aliases }) =>
        aliases.includes(config.targetAlias || ""),
      );

      return await forwardEmails(processor.process(matchingConfig));
    }

    // Handle group-with-delimiter based logic
    if (config.targetGroup) {
      return await forwardEmails(config.emailAddressesForGroup(config.targetGroup));
    }

    // Handle standard recipient logic
    if (config.recipientConfig) {
      return await forwardEmails(processor.process(config.recipientConfig));
    }

    // Handle groups
    if (config.groups.has(config.recipientAccount)) {
      return await forwardEmails(
        config.emailAddressesForGroup(config.recipientAccount),
      );
    }

    // Default rejection
    await message.setReject("Recipient not allowed");
  },
};
