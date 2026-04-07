# NailBook Pro - Production Deployment Guide

This guide will walk you through deploying your backend to a live cloud server and generating the production mobile application binaries (APK for Android, IPA for iOS).

## 1. Deploying the Backend (Render.com)

Right now, your Express backend runs on your local MacOS machine, meaning LiqPay webhooks cannot reach it from the external internet. We need to deploy it to a live VPS or PaaS like Render.

### Steps for Render
1. Create a **GitHub repository** and push your `nailbook-pro` code into it.
2. Log into [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub account and select your repository.
4. Set the following Build and Run arguments:
   - **Root Directory**: `backend` (if your git repo has `backend` and `frontend` folders at the root)
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start` (Make sure your `package.json` in backend has `"start": "node dist/index.js"` or similar if you transpile TypeScript, OR use `"start": "npx tsx src/index.ts"`)
5. Open the **Environment** tab on Render and paste all your `.env` variables from your local `backend/.env`. Specifically:
   - `DATABASE_URL` (Your Neon Postgres DB)
   - `JWT_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `CLOUDINARY_*` keys
   - `LIQPAY_PUBLIC_KEY` & `LIQPAY_PRIVATE_KEY`
6. Click **Deploy**. 
7. Once deployed, Render will give you a public URL (e.g. `https://nailbook-pro.onrender.com`).
8. Copy this URL, go into your backend `.env` variables on Render, and set `SERVER_URL=https://nailbook-pro.onrender.com`.

## 2. Compiling the Mobile App (EAS Build)

Before running these, you must change `EXPO_PUBLIC_API_URL` in `frontend/.env` to the new Render URL you received above, rather than your local IP!

**Prerequisites:**
You need an Expo account. If you don't have one:
```bash
npm install -g eas-cli
eas login
```

### Android (AAB for Google Play, APK for direct download)
Navigate to your `frontend` terminal.
```bash
# To generate a production .aab for the Google Play Store
eas build -p android --profile production

# To generate a local .apk that you can directly install on your test device without the store:
eas build -p android --profile preview
```

### iOS (IPA for Apple TestFlight / App Store)
Note: You must have an active standard Apple Developer Program membership ($99/yr) before this step works.
```bash
# To submit to App Store Connect / TestFlight
eas build -p ios --profile production
```
*During the build, EAS CLI will ask you to log into your Apple Developer account to auto-generate provisioning profiles and signing certificates.*

## 3. Switching LiqPay to Production
Currently, the backend code has `{ sandbox: 1 }` set in `backend/src/routes/subscription.ts`. This forces the test-card sandbox mode.

Once your app is compiled, deployed, and you are ready to accept real money from your masters:
1. Open `backend/src/routes/subscription.ts`
2. Remove or comment out the line `sandbox: 1` inside the `payload` dictionary.
3. Push the change to your GitHub repo (Render will automatically rebuild your server).
4. You are live! 🚀
