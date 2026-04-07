const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ ПОМИЛКА: TELEGRAM_BOT_TOKEN не знайдено у файлі .env.");
  console.log("Будь ласка, створіть бота через @BotFather у Telegram та додайте токен у .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function verifyBot() {
  try {
    const me = await bot.getMe();
    console.log("✅ Успіх! Бот підключено.");
    console.log(`🤖 Ім'я бота: ${me.first_name}`);
    console.log(`🔗 Юзернейм: @${me.username}`);
    console.log(`Користувачі можуть переходити за посиланням: https://t.me/${me.username}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ ПОМИЛКА під час перевірки токена:");
    console.error(error.message);
    process.exit(1);
  }
}

verifyBot();
