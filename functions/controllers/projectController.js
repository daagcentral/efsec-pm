const { createProjectObject } = require('./utils/projectUtils')
const admin = require('../db');
const firestore = admin.firestore()



const addProject = async (data) => {
    try {
        await firestore.collection('projects').doc().set(data);
        return 'Record saved successfuly';
    } catch (error) {
        functions.logger.warn("error\n" + error)
        return 'Failed. Try again.'
    }
}

const getAllProjects = async () => {
    try {
        const data = await firestore.collection('projects').get();
        const projectsArray = [];
        if (data.empty) {
            functions.logger.warn("No projects in database")
            return null;
        } else {
            data.forEach(doc => {
                const project = createProjectObject(doc)
                projectsArray.push(project);
            });
            return projectsArray;
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getAllOpenProjects = async () => {
    try {
        const data = await firestore.collection('projects')
            .where('status', '!=', 'closed')
            .get();
        const projectsArray = [];
        if (data.empty) {
            functions.logger.warn("No open projects in database")
            return null;
        } else {
            data.forEach(doc => {
                const project = createProjectObject(doc)
                projectsArray.push(project);
            });
            return projectsArray;
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getAllOpenProjectsWithStatus = async (status) => {
    try {
        const projectsArray = []
        const data = await firestore.collection('projects')
            .where('status', "==", status)
            .get();
        if (data.empty) {
            functions.logger.warn(`No projects with ${status}`)
            return null;
        } else {
            data.forEach(doc => {
                const project = createProjectObject(doc)
                projectsArray.push(project);
            });
            return projectsArray;
        }

    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getAllOpenProjectsWithSource = async (source) => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project => project.getSource() == source)
        if (data.length == 0) {
            functions.logger.warn(`No open projects with source ${source}`)
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getAllOpenProjectsWithBoM = async () => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project =>
            project.getBoM() != '' &&
            project.getBoM() != null)
        if (data.length == 0) {
            functions.logger.warn("No open projects have BoMs")
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getAllOpenProjectsWithBoQ = async () => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project =>
            project.getBoQ() != '' &&
            project.getBoQ() != null)
        if (data.length == 0) {
            functions.logger.warn("No open projects have BoQs")
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getAllOpenProjectsWithRevisedBoQ = async () => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project =>
            project.getRevisedBoQ() != '' &&
            project.getRevisedBoQ() != null)
        if (data.length == 0) {
            functions.logger.warn("No open projects have revised BoQs")
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getProject = async (id) => {
    try {
        const project = await firestore.collection('projects').doc(id);
        const data = await project.get();
        if (!data.exists) {
            functions.logger.warn(`Project with id ${id} does not exist`)
            return null;
        } else {
            return createProjectObject(data);
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const getProjectWithTrelloCardId = async (idCard) => {
    try {
        const data = await firestore.collection('projects')
            .where('trelloCardId', '==', idCard)
            .get();
        const projectsArray = []    
        if (data.empty) {
            functions.logger.warn(`Project with trelloCardID ${idCard} doesnt exist`)
            return null;
        } else {
            data.forEach(doc => {
                const project = createProjectObject(doc)
                projectsArray.push(project);
            });
            return projectsArray[0]
        }
    } catch (error) {
        functions.logger.warn("error\n" + error);
        return null
    }
}

const updateProject = async (id, data) => {
    try {
        const project = await firestore.collection('projects').doc(id);
        await project.update(data);
        return 'Record updated successfuly';
    } catch (error) {
        functions.logger.warn("error\n" + error)
        return 'Failed. Try again.'
    }
}

const deleteProject = async (id) => {
    try {
        await firestore.collection('projects').doc(id).delete();
        return 'Record deleted successfuly';
    } catch (error) {
        functions.logger.warn("error\n" + error)
        return 'Failed. Try again.'
    }
}

module.exports = {
    addProject,
    createProjectObject,
    getAllProjects,
    getProject,
    getProjectWithTrelloCardId,
    getAllOpenProjects,
    getAllOpenProjectsWithRevisedBoQ,
    getAllOpenProjectsWithSource,
    getAllOpenProjectsWithBoM,
    getAllOpenProjectsWithBoQ,
    getAllOpenProjectsWithStatus,
    updateProject,
    deleteProject,
}