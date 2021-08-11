const { genAddProjectCard } = require('../controllers/trelloController')
const { genAddProject } = require("../controllers/projectController")

const genAddProjectFromGoogleSheets = async (data) => {
    try {
        data.trelloCardId = await genAddProjectCard(data)
        await genAddProject(data)
    } catch (error) {
        functions.logger.error(error)
    }
    return 1
}

module.exports = {
    genAddProjectFromGoogleSheets
}