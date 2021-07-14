const { logger } = require("firebase-functions")

const trelloMoveCardFromListtoList = async (idCard, idListDestination) => {
    functions.logger.log("in trello move card, ", idCard, idListDestination)
    const url = `https://api.trello.com/1/cards/${idCard}?key=${env_config.service.trello_api_key}&token=${env_config.service.trello_token}&idList=${idListDestination}`
    functions.logger.log("URL: ", url)
    const options = {
        method: 'PUT',
    }
    try {
        const res_text = await fetch(url, options).then(response => {
            functions.logger.log(
                `Response: ${response.status} ${response.statusText}`
            );
            return response.text();
        })
        return res_text
    } catch (error) {
        functions.logger.warn(error)
        return
    }
}

module.exports = { trelloMoveCardFromListtoList }