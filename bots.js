const TelegramBot = require('node-telegram-bot-api');

const opt = { polling: true }

var sales_bot = new TelegramBot(process.env.SALES_BOT_TOKEN, opt)
var procurement_bot = new TelegramBot(process.env.PROCUREMENT_BOT_TOKEN, opt)

module.exports = {sales_bot, procurement_bot}