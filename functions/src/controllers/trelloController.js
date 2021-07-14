const genTrelloMoveCardFromListtoList = async (idCard, idListDestination) => {
    const url = `https://api.trello.com/1/cards/${idCard}?key=${env_config.service.trello_api_key}&token=${env_config.service.trello_token}&idList=${idListDestination}`
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

module.exports = { genTrelloMoveCardFromListtoList }
