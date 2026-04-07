# NailBook Pro - Deployment Guide

Цей документ містить покрокову інструкцію для розгортання NailBook Pro у продакшні.

## ВЕБ / КЛІЄНТСЬКА ЧАСТИНА (PWA)
Ми публікуємо фронтенд через **Vercel**. Це найкращий варіант для Expo Web.

1. Переконайтесь, що `app.json` має потрібні налаштування для `"web"`.
2. У терміналі з папки `frontend` запустіть:
   ```bash
   npx expo export -p web
   ```
   Це створить продакшн папку `dist`.
3. Зареєструйтесь на Vercel (vercel.com).
4. Встановіть Vercel CLI:
   ```bash
   npm i -g vercel
   cd dist
   vercel --prod
   ```

## БЕКЕНД ТА БАЗА ДАНИХ (Railway)
Бекенд (Express + PostgreSQL) ідеально деплоїти на **Railway**.

1. Зареєструйтесь на **railway.app**.
2. Створіть новий проект та виберіть **"Provision PostgreSQL"**.
3. Додайте новий сервіс **"Deploy from GitHub repo"** і оберіть репозиторій NailBook Pro (переконайтесь, що в Railway Root Directory вказано `backend`).
4. Налаштуйте **Variables (Environment Variables)**:
   - `DATABASE_URL` (використайте внутрішній URL від Railway Postgres).
   - `JWT_SECRET` (згенеруйте довгий випадковий сервер).
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (лінк має бути вашим railway доменом: `https://...railway.app/api/calendar/callback`).
5. Railway автоматично запустить `npm install`, `npx prisma generate`, і `npm start` (переконайтесь, що в package.json є `start: "ts-node src/index.ts"` або шлях до компільованого js).

## МОБІЛЬНІ ДОДАТКИ (.APK / .IPA)
Збірка для App Store та Google Play відбувається через **Expo EAS**.

1. Виконайте логін:
   ```bash
   eas login
   ```
2. Збірка для **Android** (отримаєте `.aab` або `.apk`):
   ```bash
   eas build -p android --profile production
   ```
3. Збірка для **iOS** (потребує Apple Developer Account, отримаєте `.ipa` для TestFlight):
   ```bash
   eas build -p ios --profile production
   ```

## КОМАНДИ ДЛЯ ШВИДКОГО ЗАПУСКУ (Нагадування)
Для локального старту після деплою:
```bash
# Frontend
cd frontend
npm start

# Backend
cd backend
npm run dev
```
