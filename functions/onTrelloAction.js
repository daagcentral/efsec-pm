const { updateProject, getProjectWithTrelloCardId } = require('./controllers/projectController')
const { trello_idList_to_project_status_map } = require('./maps')
const trelloUpdateCardHandler = async (data) => {
    functions.logger.log("data is here: ", data)
    if (data.listAfter) {
        try {
            const project = await getProjectWithTrelloCardId(data.card.id)
            await updateProject(project.getId(), { 'status': trello_idList_to_project_status_map[data.listAfter.id] })
        } catch (error) {
            functions.logger.log(error)
        }
    }
    return
}

const trelloActionDistributer = async (data) => {
    switch (data.type) {
        case 'updateCard':
            await trelloUpdateCardHandler(data.data)
            break
        default:
            break
    }
    return
}

module.exports = {
    trelloActionDistributer
}