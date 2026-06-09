# News App

A small deployable news search app with a serverless API route so the NewsAPI key is not exposed in browser JavaScript.

## Local development

1. Create `.env.local` and add your key:

   ```bash
   NEWS_API_KEY=your_newsapi_key_here
   ```

2. Run the app:

   ```bash
   node server.js
   ```

   Open `http://localhost:3000`.

## Deployment

Deploy on Vercel and add `NEWS_API_KEY` in Project Settings > Environment Variables.

The frontend calls `/api/news`, and `api/news.js` forwards the request to NewsAPI from the serverless function.

Use these Vercel settings:

- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: leave empty
