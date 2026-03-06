# Deploying Tejaskp AI Portal to Render

Because the WhatsApp integration requires a constant background browser process, it must be hosted on a persistent server like Render rather than a serverless platform like Vercel.

## Step 1: Push Changes to GitHub
I have already created the `Dockerfile` and `render.yaml` files. You need to push these to your GitHub repository:
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Create a New Blueprint Instance on Render
1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **"New +"** and select **"Blueprint"**.
3.  Connect your GitHub repository: `tejaskpaisoftware-debug/tejaskp-ai-software`.
4.  Render will automatically detect the `render.yaml` file.
5.  Click **"Apply"**.

## Step 3: Configure Environment Variables
Render will prompt you for any missing environment variables defined in the blueprint. Most are already linked to the database, but you may need to provide:
- `JWT_SECRET` (I've set it to auto-generate if missing)
- `GEMINI_API_KEY`
- `SMTP` and `TITAN_MAIL` credentials (from your `.env`)

## Step 4: Verify Deployment
1.  Once the build is complete (it may take 5-10 minutes), Render will provide a URL like `https://tejaskp-ai-software.onrender.com`.
2.  Navigate to that URL, log in as Admin, and go to the **Dashboard**.
3.  Click **"GET CODE"** in the WhatsApp section. The QR code should now generate correctly.

> [!TIP]
> Once your Render site is live and verified, you can point your domain `www.tejaskp.in` to the Render URL in your DNS settings.
