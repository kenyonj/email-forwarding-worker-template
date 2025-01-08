interface EmailConfig {
  aliases: string[];
  emailAddress: string;
  groups: string[];
  type: string;
}

const emailAddressesForGroup = (
  config: EmailConfig[],
  group: string,
): string[] =>
  config
    .filter(({ groups }) => groups.includes(group))
    .map(({ emailAddress }) => emailAddress);

const emailAddressesForType = (config: EmailConfig[], type: string): string[] =>
  config
    .filter(({ type: t }) => t === type)
    .map(({ emailAddress }) => emailAddress);

const getGroupsFromConfig = (config: EmailConfig[]): Set<string> =>
  new Set(config.flatMap(({ groups }) => groups));

const getAliasFromAliases = (
  account: string,
  aliases: string[] | Set<string>,
): string | null => {
  for (const alias of aliases) {
    if (account.startsWith(`${alias}.`)) return alias;
  }
  return null;
};

const getGroupFromGroups = (
  account: string,
  groups: string[] | Set<string>,
): string | null => {
  for (const group of groups) {
    if (account.startsWith(`${group}.`)) return group;
  }
  return null;
};

const getConfigForDomain = (data: string, recipient: string) => {
  try {
    const parsedData = JSON.parse(data);
    const domain = recipient.substring(recipient.indexOf("@") + 1);
    const domainConfig = parsedData.find(
      (item: { domain: string }) => item.domain === domain,
    );
    return domainConfig?.config || null;
  } catch {
    return null;
  }
};

export default {
  async email(message: any, env: any): Promise<void> {
    const recipient = message.to?.toLowerCase();

    if (!recipient) {
      await message.setReject("Recipient not allowed");
      return;
    }

    const accountForRecipient = recipient.substring(0, recipient.indexOf("@"));

    const forwardEmails = async (emails: string[]): Promise<void> => {
      for (const email of emails) {
        await message.forward(email);
      }
    };

    const emailConfig: EmailConfig[] = getConfigForDomain(
      env.EMAIL_CONFIG,
      recipient,
    );

    if (!emailConfig) {
      await message.setReject("Server configuration error");
      return;
    }

    const allGroups = getGroupsFromConfig(emailConfig);

    const processEmailConfig = async (
      config: EmailConfig | undefined,
    ): Promise<void> => {
      if (config) {
        const { emailAddress, type } = config;
        const emailsToForward =
          type === "child"
            ? [emailAddress, ...emailAddressesForType(emailConfig, "parent")]
            : [emailAddress];
        await forwardEmails(emailsToForward);
        return;
      }

      await message.setReject("Recipient not allowed");
    };

    // Handle alias-with-dot based logic
    const aliasMatch = getAliasFromAliases(
      accountForRecipient,
      emailConfig.flatMap(({ aliases }) => aliases),
    );
    if (aliasMatch) {
      const alias = aliasMatch;
      const matchingConfig = emailConfig.find(({ aliases }) =>
        aliases.includes(alias),
      );
      if (matchingConfig) return await processEmailConfig(matchingConfig);
    }

    // Handle group-with-dot based logic
    const groupMatch = getGroupFromGroups(accountForRecipient, allGroups);
    if (groupMatch) {
      await forwardEmails(emailAddressesForGroup(emailConfig, groupMatch));
      return;
    }

    // Handle standard recipient logic
    const recipientConfig = emailConfig.find(({ aliases }) =>
      aliases.includes(accountForRecipient),
    );
    if (recipientConfig) return await processEmailConfig(recipientConfig);

    // Handle groups
    if (allGroups.has(accountForRecipient)) {
      await forwardEmails(
        emailAddressesForGroup(emailConfig, accountForRecipient),
      );
      return;
    }

    // Default rejection
    await message.setReject("Recipient not allowed");
  },
};
