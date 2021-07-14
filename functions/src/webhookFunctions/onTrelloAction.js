const { genUpdateProject, genProjectWithTrelloCardId } = require('../controllers/projectController')
const { trello_idList_to_project_status_map } = require('../values/maps')
const genTrelloUpdateCardHandler = async (data) => {
    functions.logger.log("data is here: ", data)
    if (data.listAfter) {
        try {
            const project = await genProjectWithTrelloCardId(data.card.id)
            await genUpdateProject(project.getId(), { 'status': trello_idList_to_project_status_map[data.listAfter.id] })
        } catch (error) {
            functions.logger.log(error)
        }
    }
    return
}

const genTrelloActionDistributer = async (data) => {
    switch (data.type) {
        case 'updateCard':
            await genTrelloUpdateCardHandler(data.data)
            break
        default:
            break
    }
    return
}

module.exports = {
    genTrelloActionDistributer
}
