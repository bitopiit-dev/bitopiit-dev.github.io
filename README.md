# Khondaker Arifur Rahman · Portfolio

Personal website and online CV. The front end (React + Vite) is hosted free on **GitHub Pages**; the back end (Node.js + Express + MongoDB) runs free on **Render** with a **MongoDB Atlas** database and handles the contact form and visit counter.

GitHub Pages only serves static files, so it can't run the API itself. The site still works without the API: the contact form opens the visitor's email app and the visit counter is hidden. Add the API whenever you're ready.

```
.
├── client/                 React front end (GitHub Pages)
│   ├── public/             photo, favicon, downloadable CV
│   └── src/components/     page sections
├── server/                 Express API (Render)
│   ├── src/routes/         /api/messages, /api/visits
│   ├── src/store/          MongoDB, or in-memory when no database is set
│   └── test/               API tests (node --test)
├── shared/profile.json     ALL site content: edit this to update the site
├── .github/workflows/      Pages deploy + API tests
└── render.yaml             one-click API deploy on Render
```

## Update your content

Everything on the page comes from `shared/profile.json`: experience, skills, certifications, education, projects and contact links. Edit it, commit and push; GitHub rebuilds the site in about a minute. To change the photo or CV, replace `client/public/photo.jpg` or the PDF in `client/public/cv/` (keep the same file names).

## 1. Put the website on GitHub Pages

1. Create a repository. Name it **`bitopiit-dev.github.io`** to get the address `https://bitopiit-dev.github.io`. Any other name works too and gives `https://bitopiit-dev.github.io/<repo-name>/`.
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Portfolio website"
   git branch -M main
   git remote add origin https://github.com/bitopiit-dev/bitopiit-dev.github.io.git
   git push -u origin main
   ```
3. In the repo go to **Settings › Pages** and set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. When "Deploy website to GitHub Pages" turns green, the site is live.

## 2. Add the back end (contact form + visit counter)

**Database (MongoDB Atlas, free):**
1. Sign up at mongodb.com/atlas and create a free **M0** cluster.
2. Under **Database Access**, add a user with a password.
3. Under **Network Access**, allow `0.0.0.0/0` (Render's free plan has no fixed IP).
4. Click **Connect › Drivers** and copy the connection string. Put the password in, and add a database name before the `?`, for example `.../portfolio?retryWrites=true&w=majority`.

**API (Render, free):**
1. Sign up at render.com with your GitHub account.
2. **New › Blueprint**, pick this repo. Render reads `render.yaml`.
3. Fill in:
   - `MONGODB_URI`: the Atlas string from above.
   - `CLIENT_ORIGIN`: `https://bitopiit-dev.github.io` (the origin only, with no path and no trailing slash).
   - `ADMIN_TOKEN` is generated for you. Find it later under the service's **Environment** tab.
4. After the deploy, open `https://<your-service>.onrender.com/api/health`. You should see `"ok": true, "store": "mongodb"`.

**Connect the two:**
1. In GitHub go to **Settings › Secrets and variables › Actions › Variables › New repository variable**.
2. Name: `VITE_API_URL`. Value: `https://<your-service>.onrender.com` (no trailing slash).
3. **Actions › Deploy website to GitHub Pages › Run workflow**. The form now sends to your database and the footer shows the visit count.

Render's free plan sleeps after 15 minutes without traffic, and the first request then takes up to a minute. The site sends a request to the API on page load, so the API is usually awake by the time a visitor reaches the form.

## Read your messages

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://<your-service>.onrender.com/api/messages
```

To mark one as read:

```bash
curl -X PATCH -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://<your-service>.onrender.com/api/messages/<id>/read
```

You can also browse them in Atlas under **Browse Collections › messages**.

## API reference

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | Status and which store is in use |
| GET | `/api/profile` | public | The content of `shared/profile.json` |
| POST | `/api/messages` | public, 5 per 15 min per IP | Send a contact message `{name, email, subject?, message}` |
| GET | `/api/messages` | admin token | List messages, newest first (`?limit=` up to 200) |
| PATCH | `/api/messages/:id/read` | admin token | Mark a message as read |
| GET / POST | `/api/visits` | public, POST 10 per min per IP | Read / increase the visit counter |

The API uses Helmet security headers, a CORS allow-list (`CLIENT_ORIGIN`), a 20 kB request limit, input validation, a spam honeypot field and rate limits.

## Run it on your computer

Needs Node.js 20 or newer.

```bash
npm run install:all
cp server/.env.example server/.env      # leave MONGODB_URI empty to use the in-memory store
cp client/.env.example client/.env
npm run dev:api                         # http://localhost:8080
npm run dev:web                         # http://localhost:5173, in a second terminal
npm test                                # API tests
```

## Privacy

The public site leaves out date of birth, religion, marital status, home addresses, the office email and referee contact details. Keep those in the CV you send directly to employers.
