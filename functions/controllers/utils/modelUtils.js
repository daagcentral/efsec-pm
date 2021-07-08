const respace = (phrase) => {
    functions.logger.log(phrase)
    return phrase.split('/$/').join(' ');
}

module.exports = {respace}


// https://api.telegram.org/bot1818936567:AAHk0QgsfrKSi-7hyJ9VFUtMYnjBLfIn4NQ/setWebhook?url=https://europe-west1-efsec-pm.cloudfunctions.net/webhookSales

// https://api.telegram.org/bot1819763954:AAFxTbkH-McYvPTi7rCOWJS9OGYehVISlVk/setWebhook?url=https://europe-west1-efsec-pm.cloudfunctions.net/webhookProcurement