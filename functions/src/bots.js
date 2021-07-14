const TelegramBot = require('node-telegram-bot-api');

const opt = { polling: false }

var sales_bot = new TelegramBot(env_config.service.sales_bot_token, opt)
var procurement_bot = new TelegramBot(env_config.service.procurement_bot_token, opt)
var management_bot = new TelegramBot(env_config.service.management_bot_token, opt)

module.exports = {
    sales_bot,
    procurement_bot,
    management_bot
}
