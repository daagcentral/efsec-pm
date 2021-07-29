const { genCallbackQueryDistributer, genSalesMessageDistributer, genProcurementMessageDistributer, genReplyDistributer } = require('./onTelegramAction')
const { genTrelloActionDistributer } = require('./onTrelloAction')
const { sales_bot, procurement_bot } = require('../bots');
const { genNewPINumber } = require('../controllers/counterController')
const { genEmployeeWithAccess } = require("../controllers/employeeController");
const { access_to } = require('../values/enums');

const genSalesBotEntry = async (req, res) => {
    if (!('body' in req)) {
        functions.logger.error('invalid request')
        return res.sendStatus(500)
    }

    const callbackQuery = req.body.callback_query;
    const message = req.body.message;

    if (callbackQuery) {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        await genCallbackQueryDistributer(sales_bot, msg, action)
        sales_bot.answerCallbackQuery(callbackQuery.id)
    } else if (message) {
        const reply = message.reply_to_message;
        if (reply) {
            await genReplyDistributer(sales_bot, message)
        } else {
            await genSalesMessageDistributer(sales_bot, message)
        }
    }
    return res.sendStatus(200)
}

const genProcurementBotEntry = async (req, res) => {

    if (!('body' in req)) {
        functions.logger.error('invalid request')
        return res.sendStatus(500)
    }

    const callbackQuery = req.body.callback_query;
    const message = req.body.message;

    if (callbackQuery) {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        await genCallbackQueryDistributer(procurement_bot, msg, action)
        procurement_bot.answerCallbackQuery(callbackQuery.id)
    } else if (message) {
        const reply = message.reply_to_message;
        if (reply) {
            await genReplyDistributer(procurement_bot, message)
        } else {
            await genProcurementMessageDistributer(procurement_bot, message)
        }

    }
    return res.sendStatus(200)
}

const genTrelloEntry = async (req, res) => {
    if (!('body' in req) || !('action' in req.body)) {
        functions.logger.error('invalid trello webhook request')
        return res.sendStatus(500)
    }
    await genTrelloActionDistributer(req.body.action)
    return res.sendStatus(200)
}

const genProformaInvoiceNumber = async (req, res) => {
    if (!('query' in req) || !('employee_id' in req.query)) {
        functions.logger.error('invalid PI # request')
        return res.sendStatus(500)
    }
    const { employee_id, client } = req.query
    try {
        const num = await genNewPINumber()
        await sales_bot.sendMessage(employee_id, `New PI # for ${client} is ${num}.`)
        const options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
        await sales_bot.sendMessage(employee_id, `Reply to this message with attached proforma (note: file must be pdf, excel, or photo). projectId: PI#${num}`, options)
        return res.send(200, JSON.stringify({ "pi_num": num }))
    } catch (error) {
        functions.logger.error(error)
        return res.sendStatus(500)
    }
}

const genBroadcast = async (req, res) => {
    if (!('body' in req) || !('bot' in req.body) || !('message' in req.body)) {
        functions.logger.error('invalid broadcast request')
        return res.sendStatus(500)
    }
    const { bot, message } = req.body
    const audiences = await genEmployeeWithAccess(bot)
    switch (bot) {
        case access_to.PROCUREMENT:
            audiences.forEach(async audience => {
                await procurement_bot.sendMessage(audience.getId(), message)
            });
            break
        case access_to.SALES:
            audiences.forEach(async audience => {
                await sales_bot.sendMessage(audience.getId(), message)
            });
            break
        default:
            return res.sendStatus(500)
    }
    return res.sendStatus(200)
}

module.exports = {
    genSalesBotEntry,
    genProcurementBotEntry,
    genTrelloEntry,
    genProformaInvoiceNumber,
    genBroadcast
}