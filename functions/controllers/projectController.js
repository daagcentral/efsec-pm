const admin = require('../db');
const { project_status } = require('../enums');
const firestore = admin.firestore()

const { createProjectObject } = require('./utils/projectUtils')


const addProject = async (data) => {
    try {
        await firestore.collection('projects').doc().set(data);
        return 'Record saved successfuly';
    } catch (error) {
        functions.logger.warn("error\n"+error)
        return 'Failed. Try again.'
    }
}

const getAllProjects = async () => {
    try {
        const projects = await firestore.collection('projects');
        const data = await projects.get();
        const projectsArray = [];
        if (data.empty) {
            return null;
        } else {
            data.forEach(doc => {
                const project = createProjectObject(doc)
                projectsArray.push(project);
            });
            return projectsArray;
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const getAllOpenProjects = async () => {
    try {
        const projects = await firestore.collection('projects');
        const data = await projects.where('status', '!=', 'closed').get();
        const projectsArray = [];
        if (data.empty) {
            return null;
        } else {
            data.forEach(doc => {
                const project = createProjectObject(doc)
                projectsArray.push(project);
            });
            return projectsArray;
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const getAllOpenProjectsWithSource = async (source) => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project => project.getSource() == source)
        if (data.length == 0) {
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const getAllOpenProjectsWithBoM = async () => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project => project.getBoM() != '' && project.getBoM() != null)
        if (data.length == 0) {
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const getAllOpenProjectsWithBoQ = async () => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project => project.getBoQ() != '' && project.getBoQ() != null)
        if (data.length == 0) {
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const getAllOpenProjectsWithRevisedBoQ = async () => {
    try {
        var open_projects = await getAllOpenProjects()
        const data = open_projects.filter(project =>
            project.getRevisedBoQ() != '' &&
            project.getRevisedBoQ() != null &&
            project.getStatus() == project_status.SALES_REVIEW_2)
        if (data.length == 0) {
            return null;
        } else {
            return data;
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const getProject = async (id) => {
    try {
        const project = await firestore.collection('projects').doc(id);
        const data = await project.get();
        if (!data.exists) {
            return null;
        } else {
            return createProjectObject(data);
        }
    } catch (error) {
        functions.logger.warn("error\n"+error);
        return null
    }
}

const updateProject = async (id, data) => {
    try {
        const project = await firestore.collection('projects').doc(id);
        await project.update(data);
        return 'Record updated successfuly';
    } catch (error) {
        functions.logger.warn("error\n"+error)
        return 'Failed. Try again.'
    }
}

const deleteProject = async (id) => {
    try {
        await firestore.collection('projects').doc(id).delete();
        return 'Record deleted successfuly';
    } catch (error) {
        functions.logger.warn("error\n"+error)
        return 'Failed. Try again.'
    }
}

module.exports = {
    addProject,
    createProjectObject,
    getAllProjects,
    getProject,
    getAllOpenProjects,
    getAllOpenProjectsWithRevisedBoQ,
    getAllOpenProjectsWithSource,
    getAllOpenProjectsWithBoM,
    getAllOpenProjectsWithBoQ,
    updateProject,
    deleteProject,
}