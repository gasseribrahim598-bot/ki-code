# KI Code

Arabic-first programming education website built with Node.js + Express.

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`
3. Set environment variables (see `.env.example`). At minimum set a strong `SESSION_SECRET` and `ADMIN_PASSWORD_HASH`.
4. Run `npm start` and open `http://localhost:3000`.

## Set the admin password securely
Generate a bcrypt hash without putting your real password in source code:
`node -e "require('bcryptjs').hash('YOUR_NEW_PASSWORD', 12).then(console.log)"`
Set the printed hash as `ADMIN_PASSWORD_HASH`, and set `ADMIN_USERNAME` to your chosen username. The requested username `ki code` is the default, but change the password from the example and keep credentials private. Never commit secrets to GitHub.

## Important deployment notes
- This starter uses a local JSON file for app data and local uploads. On hosts with ephemeral filesystems, data/uploads can disappear on redeploy or restart. Use a persistent disk or migrate to PostgreSQL/object storage before real public launch.
- Use HTTPS in production. Configure a persistent session store before handling real users at scale; Express's default memory session store is not production-grade.
- The Orange Cash payment is manual: students upload proof and the admin reviews it. No payment is automatically verified.
- This project includes a broad course catalogue and a lesson framework. It does **not** magically contain a complete textbook for every programming language yet. Each course must be expanded with reviewed lessons, examples, exercises, projects, and tests before it can honestly be advertised as fully comprehensive.
