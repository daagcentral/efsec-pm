require('dotenv').config()
global.fetch = require("node-fetch");
global.functions = require('firebase-functions')
global.env_config = Object.keys(functions.config()).length ? functions.config() : require('./env.json')

const { genCallbackQueryDistributer, genSalesMessageDistributer, genProcurementMessageDistributer, genReplyDistributer } = require('./src/webhookFunctions/onTelegramAction')
const { genTrelloActionDistributer } = require('./src/webhookFunctions/onTrelloAction')
const { sales_bot, procurement_bot } = require('./src/bots');

exports.webhookSales = functions.region('europe-west1').https.onRequest(async (req, res) => {

    const callbackQuery = req.body.callback_query;
    const message = req.body.message;

    if (callbackQuery) {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        functions.logger.log('Incoming callback', message)
        await genCallbackQueryDistributer(sales_bot, msg, action)
        sales_bot.answerCallbackQuery(callbackQuery.id)
    } else if (message) {
        const reply = message.reply_to_message;
        if (reply) {
            functions.logger.log('Incoming reply', message)
            await genReplyDistributer(sales_bot, message)
        } else {
            functions.logger.log('Incoming message', message)
            await genSalesMessageDistributer(sales_bot, message)
        }
    }
    return res.sendStatus(200)
})

exports.webhookProcurement = functions.region('europe-west1').https.onRequest(async (req, res) => {
    
    const callbackQuery = req.body.callback_query;
    const message = req.body.message;
    
    if (callbackQuery) {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        functions.logger.log('Incoming callback', message)
        await genCallbackQueryDistributer(procurement_bot, msg, action)
        procurement_bot.answerCallbackQuery(callbackQuery.id)
    } else if (message) {
        const reply = message.reply_to_message;
        if (reply) {
            functions.logger.log('Incoming reply', message)
            await genReplyDistributer(procurement_bot, message)
        } else {
            functions.logger.log('Incoming message', message)
            await genProcurementMessageDistributer(procurement_bot, message)
        }

    }
    return res.sendStatus(200)
})

exports.webhookTrello = functions.region('europe-west1').https.onRequest(async (req, res) => {
    if(!('body' in req) || !('action' in req.body)){
        functions.logger.warn('invalid trello webhook request')
        return res.sendStatus(500)
    }
    await genTrelloActionDistributer(req.body.action)
    return res.sendStatus(200)
})