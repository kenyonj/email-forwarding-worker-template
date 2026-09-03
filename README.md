# Cloudflare Email Forwarding Worker

This repository is a template for routing email through a
[Cloudflare Email Worker](https://developers.cloudflare.com/email-service/api/route-emails/email-handler/).
A Cloudflare catch-all rule sends incoming messages to the Worker, which uses a
YAML configuration file to forward aliases and group addresses to verified
email destinations.

The Worker supports multiple domains, group forwarding, parent and child
routing, configurable alias delimiters, and case-insensitive address matching.
GitHub Actions can test changes on pull requests and deploy the Worker after
changes reach `main`.

## How routing works

For this configuration:

```yaml
- domain: example.com
  accounts:
    - aliases:
        - alex
      emailAddress: alex@example.net
      groups:
        - family
      type: parent
    - aliases:
        - sam
      emailAddress: sam@example.net
      groups:
        - family
      type: child
```

The Worker routes mail as follows:

| Incoming address | Destinations |
| --- | --- |
| `alex@example.com` | `alex@example.net` |
| `sam@example.com` | Own address plus all domain parents |
| `family@example.com` | Every account in the `family` group |
| `alex.store@example.com` | `alex@example.net` |
| `alex+newsletter@example.com` | `alex@example.net` |

Domains, aliases, and group names are matched without regard to case. An
unrecognized address is rejected.

## Prerequisites

- A Cloudflare account with Workers available
- A domain managed by Cloudflare and onboarded to
  [Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/)
- Node.js 18 or newer
- A GitHub repository created from this template

## Set up the project

### 1. Create and clone a repository

Select **Use this template** on GitHub, create a repository, and clone it:

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
npm ci
```

### 2. Create the routing configuration

Copy the sample file:

```bash
cp config/email-config.yml.sample config/email-config.yml
```

Edit `config/email-config.yml` and commit it to your repository. The deployment
workflow reads this exact path.

```yaml
- domain: my-domain.io
  delimiters:
    - "."
    - "+"
  accounts:
    - aliases:
        - john
        - senior
      emailAddress: johnsmith@example.com
      groups:
        - parents
        - family
      type: parent
    - aliases:
        - sally
      emailAddress: sallysmith@example.com
      groups:
        - kids
        - family
      type: child
```

Each domain entry supports these fields:

| Field | Required | Description |
| --- | --- | --- |
| `domain` | Yes | Domain handled by this configuration entry. |
| `accounts` | Yes | Configured routing accounts. |
| `delimiters` | No | Suffix separators. Defaults to `.` and `+`. |

Each account supports these fields:

| Field | Required | Description |
| --- | --- | --- |
| `aliases` | Yes | Local parts that route to this account. |
| `emailAddress` | Yes | Verified destination for forwarded mail. |
| `groups` | No | Group names that include this account. |
| `type` | No | Parent or child routing role. |

An alias is the local part before `@`, such as `john` in
`john@my-domain.io`. A child alias forwards to its own destination and every
parent destination for the same domain.

Custom `delimiters` replace the defaults. Include `.` and `+` explicitly if you
want to retain them while adding another delimiter:

```yaml
delimiters:
  - "."
  - "+"
  - "-"
```

Keep aliases unique within a domain, and do not reuse the same name for both an
alias and a group.

### 3. Verify forwarding destinations

Cloudflare only forwards to verified destination addresses. In the Cloudflare
dashboard, go to **Compute** > **Email Service** > **Email Routing** >
**Destination Addresses**. Add every `emailAddress` from the configuration and
complete the verification email for each one.

See Cloudflare's
[destination address documentation](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/#add-a-destination-address)
for the current dashboard flow.

This template also includes an optional **Add Verified Email to Cloudflare**
workflow under the repository's **Actions** tab. It starts the same verification
process but does not bypass the verification email. That workflow requires
these GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_EMAIL`
- `CLOUDFLARE_API_KEY`

`CLOUDFLARE_API_KEY` is Cloudflare's legacy Global API key and grants broad
access. Prefer the dashboard flow unless you specifically need this workflow.

### 4. Configure deployment credentials

Add these GitHub Actions secrets in **Settings** > **Secrets and variables** >
**Actions**:

- `CLOUDFLARE_ACCOUNT_ID`: the account that owns the Worker and domains
- `CLOUDFLARE_API_TOKEN`: a scoped token created with the **Edit Cloudflare
  Workers** permission

Cloudflare documents how to
[find an account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)
and
[create an API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).
Scope the token to the account used by this project.

### 5. Enable and run deployment

Deployment is disabled in the template so a newly generated repository cannot
deploy before it is configured. In `.github/workflows/deploy.yml`, change:

```yaml
env:
  TESTING: true
```

to:

```yaml
env:
  TESTING: false
```

When a commit reaches `main`, the workflow then:

1. Converts `config/email-config.yml` to JSON.
2. Uploads that JSON as the Worker's `EMAIL_CONFIG` secret.
3. Deploys the Worker with Wrangler.

The Worker is named `email-forwarding-worker` by default. If you change `name`
in `wrangler.toml`, select that new name when configuring Email Routing.

### 6. Send catch-all email to the Worker

For each configured domain:

1. In Cloudflare, go to **Compute** > **Email Service** > **Email Routing**.
2. Select the domain and open **Routing Rules**.
3. Enable the **Catch-all rule**.
4. Set its action to **Send to a Worker**.
5. Select `email-forwarding-worker`, or the replacement name from
   `wrangler.toml`.
6. Save the rule and send test messages from an address other than the
   destination address.

Cloudflare documents the current
[catch-all rule](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/#catch-all-rule)
and
[Worker routing](https://developers.cloudflare.com/email-service/get-started/route-emails/#configure-routing-to-worker)
flows.

## Development and testing

Install the locked dependencies and run the test suite once:

```bash
npm ci
npm test -- --run
```

Run the TypeScript compiler without producing output:

```bash
npx tsc --noEmit
```

The tests exercise Worker behavior with fixtures in `test/index.spec.ts`. They
do not load or validate `config/email-config.yml`. Pull requests targeting
`main` run the Worker test suite through `.github/workflows/test.yml`.

## Sync a repository created from this template

Repositories created from this template can merge later template changes with:

```bash
./script/sync-template
```

Run the script from a clean `main` branch. It offers to add this template as the
`template` remote, fetches all remotes, and merges `template/main` into the
current repository. Review the merge before pushing it.

## Contributing

Issues and pull requests are welcome. Create a branch, make the change, run the
validation commands above, and open a pull request against `main`.

## License

This project is available under the [MIT License](LICENSE).
