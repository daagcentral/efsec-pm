const genTrelloMoveCardFromListtoList = async (idCard, idListDestination) => {
    const url = `https://api.trello.com/1/cards/${idCard}?key=${env_config.service.trello_api_key}&token=${env_config.service.trello_token}&idList=${idListDestination}`
    const options = {
        method: 'PUT',
    }
    const res_text = await fetch(url, options).then(response => {
        functions.logger.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.text();
    })
    return res_text
}

const getTrelloAddUpdateToDescription = async (idCard, update) => {
    var url = `https://api.trello.com/1/cards/${idCard}?key=${env_config.service.trello_api_key}&token=${env_config.service.trello_token}`
    var options = {
        method: 'GET',
    }
    const desc = await fetch(url, options).then(response => response.text()).then(text => JSON.parse(text).desc)

    url = url + `&desc=${desc}\n${update}`
    options.method = 'PUT'
    const res_text = await fetch(url, options).then(response => {
        functions.logger.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.text();
    })
    return res_text
}
module.exports = { genTrelloMoveCardFromListtoList, getTrelloAddUpdateToDescription }
