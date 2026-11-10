# The Wellness Ascent — Website

A bilingual (English/French), responsive website for The Wellness Ascent, with a small built-in server for booking requests and contact messages. It needs only Node.js 18 or newer and has no other dependencies.

## Deploy to Vercel

The site deploys to Vercel as-is. The pages in `public/` are served as static files, and the forms are handled by serverless functions in `api/`. Files written on Vercel are not kept, so bookings and messages are saved in a free **Supabase** Postgres database.

**1. Create the database (about 5 minutes)**
1. Create a project at [supabase.com](https://supabase.com). Choose a region close to Kenya, such as Frankfurt or London.
2. Open **SQL Editor → New query**, paste the contents of [`db/schema.sql`](db/schema.sql), and click **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **service_role** key. The service_role key is secret: never put it in front-end code.

**2. Import the repo into Vercel**
1. At [vercel.com/new](https://vercel.com/new), import `nzivo/the-wellness-ascent`.
2. Leave **Framework Preset** as *Other*. `vercel.json` already sets everything else.
3. Under **Environment Variables**, add:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase |
| `DATA_KEY` | output of `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (**back this up**: without it, stored data can't be decrypted) |
| `ADMIN_TOKEN` | a long random string, 32 or more characters |

4. Click **Deploy**. Every push to `main` then redeploys the site automatically.

**3. After deploying**
- Submit a test booking, then read it back with `curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<your-site>.vercel.app/api/admin/appointments`.
- Add your own domain under **Project → Settings → Domains**, then update `public/robots.txt` and `public/sitemap.xml`.
- *Optional:* add a rate-limit rule for `/api/*` in **Vercel Firewall**. The built-in rate limit is per function instance, so it only reduces abuse on Vercel rather than enforcing a hard cap.

If the Supabase variables are missing, the forms do not lose data silently. They tell visitors to contact the practice by phone, WhatsApp or email instead.

## Run it locally

```bash
cd website
node server.js
# open http://localhost:3000
```

You can also open `public/index.html` directly in a browser to look at the design. The forms only send data when the server is running.

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| About (story, mission, values, FAQs) | `about.html` |
| Psychotherapy & Counselling | `psychotherapy.html` |
| Psychiatric Consultation | `psychiatry.html` |
| Nutrition & Dietetics | `nutrition.html` |
| Kenya Hub (physical + virtual) | `kenya.html` |
| Seychelles Hub (virtual only) | `seychelles.html` |
| Articles (search, categories, pagination) | `articles.html`, `article.html?slug=…` |
| Testimonials (filter + submit form) | `testimonials.html` |
| Contact (form, map, hours, emergency) | `contact.html` |
| Book Appointment (6-step guided flow) | `book.html` |
| Wellness Compass (questionnaire) | `compass.html` |
| Privacy, Terms & Cookies | `privacy.html` |

## Before launch: edit these

1. **Contact details and prices:** edit `public/assets/js/config.js`. It holds the phone number, WhatsApp, email, address, office hours, social links and session fees, and every page reads from it.
2. **Testimonials:** the quotes on the home page and on `testimonials.html` are samples. Replace them with real stories that clients have agreed to share.
3. **Articles:** edit `public/assets/js/articles-data.js`. Each article has an English and a French version.
4. **Privacy policy:** have a lawyer review it against the Kenya Data Protection Act (2019) and the Seychelles Data Protection Act (2023).
5. **Domain:** replace `thewellnessascent.com` in `public/robots.txt` and `public/sitemap.xml`.
6. **Payment methods** (M-Pesa, bank transfer, card) are stated in the FAQs. Confirm that they are correct.

## Translations

The English text is written directly in the HTML. French versions are stored in `public/assets/js/i18n-fr.js`, keyed by the English sentence. If you change an English sentence, update its key in that file too, or that sentence will stay in English. Visitors switch languages with the EN/FR toggle, or you can link to a page with `?lang=fr`.

## Security

- **Strict security headers:** Content-Security-Policy (no inline scripts or styles), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, and HSTS in production.
- **Form protection:** all input is validated and cleaned on the server. Forms submitted from other websites are rejected, which blocks cross-site request forgery (CSRF). Each form allows a limited number of submissions per visitor (rate limiting), and a hidden field catches spam bots.
- **Encrypted storage:** submissions are encrypted with AES-256-GCM before being saved to `data/`. The files can be read only by the user account that runs the server.
- **No personal data in logs:** the server logs only booking reference numbers.
- **Audit log:** each time someone reads the stored submissions through the admin API, it is recorded in `data/audit.log`.

### Production environment variables

```bash
NODE_ENV=production
PORT=3000
DATA_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")   # keep secret, back it up
ADMIN_TOKEN=<a long random string, 32+ characters>
TRUST_PROXY=1        # only if behind a reverse proxy / load balancer
```

Always serve the site over HTTPS, for example behind Nginx or Caddy, or on a platform such as Railway or DigitalOcean App Platform.

### Reading submissions (temporary admin API)

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://yourdomain/api/admin/appointments
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://yourdomain/api/admin/contact
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://yourdomain/api/admin/testimonials
```

## Next phase (from the project brief)

- Admin dashboard: approve, reschedule or decline appointments; moderate testimonials; edit articles
- Email notifications (for example with Resend). A `TODO` marks the spot in `server.js`.
- Choosing a practitioner during booking, once the team profiles are ready
- PostgreSQL database, M-Pesa payments, and video-call integration

## Image credits

All photographs come from [Unsplash](https://unsplash.com) and are free to use under the Unsplash License. They are loaded from Unsplash's servers. To host them yourself, download them into `public/assets/img/` and update the image addresses.
