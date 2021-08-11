const { project_type_to_IdLabel } = require('../values/maps')
const { genEmployee } = require('./employeeController')
const {respace} = require('./utils/modelUtils')
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

const genTrelloAddUpdateToDescription = async (idCard, update) => {
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

const genAddProjectCard = async (data) => {
    const employeeName = (await genEmployee(data.owner)).getFirstName()
    const label = project_type_to_IdLabel[data.source]
    var trello = "https://api.trello.com/1/cards?key=75bc0c77525abed1b576582cad03d5b9&token=70c4bdae4b53dd98119927e59e88446699ec73ae5a4b811fbce0dfe23868ff7c&idList=60ebf71146943f74dd3bcff9"
    const query = `&name=${respace(data.projectTitle)}&desc=Added by: ${employeeName} on: ${data.timestamp}%0AClient: ${respace(data.clientName)}%0AProforma Invoice Num: ${data.pi_num}&idLabels=${label ?? '60ebf5dfc82461383053a1cd'}`
    const url = trello + query
    const options = {
        method: "post"
    }

    const idCard = await fetch(url, options).then(async res => {
        const text = await res.text()
        return JSON.parse(text).id
    })
    console.log(idCard)
    return idCard
}

module.exports = { genTrelloMoveCardFromListtoList, genTrelloAddUpdateToDescription, genAddProjectCard }
