require('dotenv').config()
global.fetch = require("node-fetch");
global.functions = require('firebase-functions')
global.env_config = Object.keys(functions.config()).length ? functions.config() : require('./env.json')

const {
    genSalesBotEntry,
    genProcurementBotEntry,
    genTrelloEntry,
    genProformaInvoiceNumber,
    genSendPIReminders,
    genPVNumber,
    genBroadcast,
    genPettyCashReporter,
    genGoogleSheetFunctions,
    genClientFile
} = require('./src/webhookFunctions/index')

exports.webhookSales = functions
    .region('europe-west1')
    .https
    .onRequest(genSalesBotEntry)

exports.webhookProcurement = functions
    .region('europe-west1')
    .https
    .onRequest(genProcurementBotEntry)

exports.webhookTrello = functions
    .region('europe-west1')
    .https
    .onRequest(genTrelloEntry)

exports.genProformaInvoiceNumber = functions
    .region('europe-west1')
    .https
    .onRequest(genProformaInvoiceNumber)

exports.genBroadcast = functions
    .region('europe-west1')
    .https
    .onRequest(genBroadcast)


exports.genPettyCashReporter = functions
    .region('europe-west1')
    .https
    .onRequest(genPettyCashReporter)

exports.genPVNumber = functions
    .region('europe-west1')
    .https
    .onRequest(genPVNumber)

exports.genGoogleSheetFunctions = functions
    .region('europe-west1')
    .https
    .onRequest(genGoogleSheetFunctions)

exports.genClientFile = functions
    .region('europe-west1')
    .https
    .onRequest(genClientFile)

exports.genSendPIReminders = functions
    .pubsub
    .schedule('0 9 * * 1-5')
    .onRun(genSendPIReminders)