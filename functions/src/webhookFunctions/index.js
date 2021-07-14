const { genCallbackQueryDistributer, genSalesMessageDistributer, genProcurementMessageDistributer, genReplyDistributer } = require('./onTelegramAction')
const { genTrelloActionDistributer } = require('./onTrelloAction')
const { sales_bot, procurement_bot } = require('../bots');

const genSalesBotEntry = async (req, res) => {
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
}

const genProcurementBotEntry = async (req, res) => {

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
}

const genTrelloEntry = async (req, res) => {
    if (!('body' in req) || !('action' in req.body)) {
        functions.logger.warn('invalid trello webhook request')
        return res.sendStatus(500)
    }
    await genTrelloActionDistributer(req.body.action)
    return res.sendStatus(200)
}

module.exports = {
    genSalesBotEntry,
    genProcurementBotEntry,
    genTrelloEntry
}