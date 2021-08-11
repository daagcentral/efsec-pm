const { genCallbackQueryDistributer, genSalesMessageDistributer, genProcurementMessageDistributer, genReplyDistributer } = require('./onTelegramAction')
const { genTrelloActionDistributer } = require('./onTrelloAction')
const { sales_bot, procurement_bot } = require('../bots');
const { genNewPINumber, genNewPVNumber } = require('../controllers/counterController')
const { genEmployeeWithAccess } = require("../controllers/employeeController");
const { access_to, google_sheet_functions } = require('../values/enums');
const { genAddProjectFromGoogleSheets } = require('../webhookFunctions/onGogleSheetAction');

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

const genPVNumber = async (req, res) => {
    if (!('query' in req) || !('employee_id' in req.query)) {
        functions.logger.error('invalid PV # request')
        return res.sendStatus(500)
    }
    const { employee_id, paid_to, total } = req.query
    try {
        const num = await genNewPVNumber()
        sales_bot.sendMessage(employee_id, `New PV # for ${paid_to} is ${num}.\nTotal: ${total}`)
        return res.send(200, JSON.stringify({ "pv_num": num }))
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

const genPettyCashReporter = async (req, res) => {
    if (!('body' in req) || !('entry' in req.body)) {
        functions.logger.error('invalid report request')
        return res.sendStatus(500)
    }

    var { entry } = req.body
    entry = entry.map(item => {
        const date = item.date.split(' ')[1] + ' ' + item.date.split(' ')[2] + ' ' + item.date.split(' ')[3]
        return `${date},${item.description},${item.pv},${item.total},${item.vat}`
    })
    console.log(entry)
    return res.sendStatus(200)
}

const genGoogleSheetFunctions = async (req, res) => {
    if (!('body' in req) || !('data' in req.body)) {
        functions.logger.error('invalid report request')
        return res.sendStatus(500)
    }
    var { callFunction, data } = req.body
    switch (callFunction) {
        case google_sheet_functions.ADD_PROJECT:
            await genAddProjectFromGoogleSheets(JSON.parse(data))
            return res.sendStatus(200)
        default:
            return res.sendStatus(500)
    }
}

const genClientFile = async (req, res) => {

    if (!('query' in req) || !('file_id' in req.query)) {
        functions.logger.error('invalid file request')
        return res.sendStatus(500)
    }
    const { from, file_id } = req.query
    switch (from) {
        case access_to.SALES:
            const path = await fetch(`https://api.telegram.org/bot${env_config.service.sales_bot_token}/getFile?file_id=${file_id}`)
                .then(res => res.text())
                .then(res => JSON.parse(res).result.file_path)
            console.log(path)
            return res.redirect(`https://api.telegram.org/file/bot${env_config.service.sales_bot_token}/${path}`)
        default:
            return res.send("FILE NOT FOUND")

    }

}

module.exports = {
    genSalesBotEntry,
    genProcurementBotEntry,
    genTrelloEntry,
    genProformaInvoiceNumber,
    genPVNumber,
    genBroadcast,
    genGoogleSheetFunctions,
    genPettyCashReporter,
    genClientFile
}