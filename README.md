# Cloudflare Email Forwarding Worker

This repository is a **template** that demonstrates how to automate the
creation of aliases and group email addresses, and then forward those incoming
emails to real email accounts—all using a **Cloudflare Worker**. The project is
set up so that **GitHub Actions** handles the deployment process whenever code
is pushed to (or merged into) the main branch.

> **Table of Contents**  
> 1. [Overview](#overview)  
> 2. [Features](#features)  
> 3. [F.A.Q.](#faq)  
> 4. [Prerequisites](#prerequisites)  
> 5. [Getting Started](#getting-started)  
> 6. [Usage](#usage)  
> 7. [Deployment](#deployment)  
> 8. [Contributing](#contributing)  
> 9. [License](#license)

## Overview

This project enables you to:

- Seamlessly create email aliases (e.g. `support@yourdomain.com` → `yourrealemail@example.com`).
- Define group addresses (e.g. `team@yourdomain.com` → multiple recipients).
- Create child aliases (e.g. `sally@yourdomain.com` → `sally@example.com`, `parent1@example.com`, and `parent2@example.com`).
- Create easily identifiable spam aliases (e.g. `john.localgym@yourdomain.com` → `john@example.com`).
  - `+` is also a default supported delimiter (like Gmail uses), you can
    configure your own delimiters in the config file. See
    [config/email-config.yml.sample](config/email-config.yml.sample) for an example.
- Automate routing logic through a single Cloudflare Worker.
- Maintain your email forwarding rules via code in a single repository.

The Worker listens for incoming emails on your domain(s) managed by Cloudflare
and routes them to the appropriate real inbox(es), eliminating the need for
manual configuration in traditional email forwarding solutions.

## Features

- **Alias Creation**: Define ephemeral or long-term aliases for your domain(s).  
- **Group Email**: Forward incoming messages to multiple recipients based on group definitions.  
- **Automated Management**: Update routing rules simply by pushing changes to this repository.  
- **Scalable**: Cloudflare’s edge network handles large volumes of email with minimal latency.  
- **Secure & Configurable**: Use environment variables to store secrets. TLS/SSL is handled by Cloudflare’s infrastructure.

## F.A.Q.

<details>
<summary><strong>Why use this project?</strong></summary>
<blockquote>
This project simplifies the management of email forwarding rules for your domain(s) by allowing you to define those rules in code and deploy them automatically.
</blockquote>
</details>

<details>
<summary><strong>How does this project work?</strong></summary>
<blockquote>
This project uses a Cloudflare Worker, set as a destination for a catch-all address, to listen for incoming emails and route them to the appropriate real inbox(es) based on the rules you define.
</blockquote>
</details>

<details>
<summary><strong>How do I define the routing rules?</strong></summary>
<blockquote>
You define the routing rules in a YAML file. The GitHub Action in this project will automatically convert the YAML into JSON for the Worker to consume.
</blockquote>
</details>

<details>
<summary><strong>How do I test the routing rules?</strong></summary>
<blockquote>
You can run tests locally to ensure the routing rules are correct. The GitHub Action in this project will also run the tests automatically when a PR is opened.
</blockquote>
</details>

<details>
<summary><strong>How do I deploy the routing rules?</strong></summary>
<blockquote>
The GitHub Action in this project will automatically deploy the routing rules to Cloudflare when code is pushed to the main branch. You can also manually deploy the routing rules using the <code>wrangler</code> CLI.
</blockquote>
</details>

<details>
<summary><strong>What happens when I receive an email that matches an alias, but has a dot in it and then a bunch of other letters and numbers?</strong></summary>
<blockquote>
The Worker will ignore the dot and any characters that follow it when matching the alias. The mail will be forwarded to the correct email address, but maintain the dot and characters in the alias. This allows you to create spam aliases that are unique to each sender, but still route to the same email. Gmail does something similar with the <code>+</code> character, which is also supported, but beware, it's easily identifiable and can be stripped out by the sender.
</blockquote>
</details>

<details>
<summary><strong>Can I create an alias for my child, and have the email forwarded to my child and me?</strong></summary>
<blockquote>
Yes, by default any alias that has the "child" type will be forwarded to that alias' email address as well as any parent aliases.
</blockquote>
</details>

## Prerequisites

1. A [Cloudflare](https://cloudflare.com) account with [Workers](https://workers.cloudflare.com/) enabled.  
2. A domain managed by Cloudflare with DNS records in place.  
3. Node.js >= 16.0 (for local development and testing).  
4. A basic understanding of GitHub Actions (used here to automate the deployment).

## Getting Started

1. **Use this Template**  
   - Click the **Use this template** button on the GitHub repository page.  
   - Create a new repository under your GitHub account.

2. **Clone Your New Repository**  
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
3. **Install Dependencies**  
   ```bash
   npm install
   ```
   Installs the necessary dependencies for local testing.

4. **Configure This Project for Your Cloudflare Account**  
   - In your repository, locate `.github/workflows/deploy.yml` (or similarly named workflow file).  
   - Create repository secrets for your Cloudflare account credentials:
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID  
       - Documentation for finding your account ID can be found [here](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/#find-account-id-workers-and-pages).
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token or equivalent credentials  
       - Documentation for creating an API token can be found [here](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).
     - `CLOUDFLARE_EMAIL`: The email account that is associated with your cloudflare account  
     - `CLOUDFLARE_API_KEY`: Your Cloudflare API key  
       - Documentation for viewing your global API key can be found [here](https://developers.cloudflare.com/fundamentals/api/get-started/keys/#view-your-global-api-key).

## Usage

Pre-requisites:

0. Any email that you plan on forwarding to has to be added to your cloudflare account as a forwarding email address. You can use the "Add Verified Email to Cloudflare" action to add one by manually triggering the workflow: https://github.com/kenyonj/email-forwarding-worker-template/actions/workflows/add-email-to-cloudflare.yml

1. Create a new email worker in your cloudflare account, under the target domain:
   https://dash.cloudflare.com/<ACCOUNT ID>/<DOMAIN>/email/routing/workers
   <img width="700" alt="Image" src="https://github.com/user-attachments/assets/a1f6e9e3-5ea9-42d2-b2d0-665d822ab1ae" />

2. Name the email worker `email-forwarding-worker`, choose "Create my own" and click "Create".
3. Go back to "Email Routing" and click "Routing rules".
4. Enable the "Catch-all address" and select the email-forwarding-worker from the "Destination" dropdown.
5. Save

_Note: The worker must have the same name as the name that is set in the `wrangler.toml` file._

Using the worker:

1. **Defining Email Routing Rules in YAML**  
   - Instead of directly editing JSON, you must store your routing definitions in a YAML file.  
   - The GitHub Action in this project will automatically convert this YAML into JSON for the Worker to consume.  
   - Below is an **example** YAML configuration:

     ```yaml
     - domain: my-domain.io
       config:
         - aliases:
             - john
             - jacksr
             - senior
           emailAddress: johnsmith@email.com
           groups:
             - kids
             - parents
             - family
             - school
           type: parent
         - aliases:
             - jill
             - mom
           emailAddress: jillsmith@email.com
           groups:
             - kids
             - parents
             - family
             - school
             - basketball
           type: parent
         - aliases:
             - sally
           emailAddress: sallysmith@email.com
           groups:
             - kids
             - family
           type: child
         - aliases:
             - jack
             - jackjr
             - jr
           emailAddress: jacksmith@email.com
           groups:
             - kids
             - family
           type: child
     ```

   - You must save this YAML in a file called `config/email-config.yaml`. There
     is a sample file in this repository that you can use as a starting point.
   - Commit and push your changes.  
   - **GitHub Actions** will run the deployment process automatically and
     ensure your Worker code receives the correct JSON data.

2. **Running Tests Locally**  
   - If you only want to run tests locally:
     ```bash
     npm test
     ```

## Deployment

**Deployment is automated via GitHub Actions.**  
When you push commits or merge pull requests into the `main` branch (or whichever branch you configure), GitHub Actions will automatically:

1. Build your project.  
2. Convert your YAML config into JSON.
3. Upload the project and the config data to Cloudflare Workers using the credentials provided in your repository’s GitHub Secrets.  
4. Confirm the new version is deployed.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [Issues](../../issues) section or open a Pull Request.

1. Fork this repository.  
2. Create a new branch for your feature/bugfix.  
3. Make your changes.  
4. Submit a Pull Request for review.

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use it as a starting point and modify it to suit your needs.

---

**Happy email routing!** If you run into any issues, please [open an issue](../../issues) or submit a pull request.
