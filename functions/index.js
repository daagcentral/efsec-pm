require('dotenv').config()
global.fetch = require("node-fetch");
global.functions = require('firebase-functions')
global.env_config = Object.keys(functions.config()).length ? functions.config() : require('./env.json')
const { callbackQueryDistributer } = require('./onCallbackQueryUtils')
const { onSalesMessageDistributer, onProcurementMessageDistributer, onReplyDistributer } = require('./onMessageHandlers')
const { trelloActionDistributer } = require('./onTrelloAction')
const { sales_bot, procurement_bot } = require('./bots');
const { logger } = require('firebase-functions');

exports.webhookSales = functions.region('europe-west1').https.onRequest(async (req, res) => {

    const callbackQuery = req.body.callback_query;
    const message = req.body.message;

    if (callbackQuery) {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        functions.logger.log('Incoming callback', message)
        await callbackQueryDistributer(sales_bot, msg, action)
        sales_bot.answerCallbackQuery(callbackQuery.id)
    } else if (message) {
        const reply = message.reply_to_message;
        if (reply) {
            functions.logger.log('Incoming reply', message)
            await onReplyDistributer(sales_bot, message)
        } else {
            functions.logger.log('Incoming message', message)
            await onSalesMessageDistributer(sales_bot, message)
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
        await callbackQueryDistributer(procurement_bot, msg, action)
        procurement_bot.answerCallbackQuery(callbackQuery.id)
    } else if (message) {
        const reply = message.reply_to_message;
        if (reply) {
            functions.logger.log('Incoming reply', message)
            await onReplyDistributer(procurement_bot, message)
        } else {
            functions.logger.log('Incoming message', message)
            await onProcurementMessageDistributer(procurement_bot, message)
        }

    }
    return res.sendStatus(200)
})

exports.webhookTrello = functions.region('europe-west1').https.onRequest(async (req, res) => {
    if(!('body' in req) || !('action' in req.body)){
        logger.warn('invalid trello webhook request')
        return res.sendStatus(500)
    }
    await trelloActionDistributer(req.body.action)
    return res.sendStatus(200)
})