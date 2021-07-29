const Project = require('../../models/project');

const createProjectObject = (doc) => {
    return new Project(
        doc.id,
        doc.data().clientName,
        doc.data().projectTitle,
        doc.data().site,
        doc.data().contractAmount,
        doc.data().paymentMode,
        doc.data().deliverBy,
        doc.data().expectPaymentBy,
        doc.data().subject,
        doc.data().source,
        doc.data().BoQ,
        doc.data().BoQ_revised,
        doc.data().BoM,
        doc.data().proforma,
        doc.data().status,
        doc.data().updates,
        doc.data().trelloCardId
    );
}

const createProjectsObjectIfData = (data, noDataWarning) => {
    const projectsArray = [];
    if (data.empty) {
        functions.logger.error(noDataWarning)
        return null;
    } else {
        data.forEach(doc => {
            const project = createProjectObject(doc)
            projectsArray.push(project);
        });
        return projectsArray;
    }
}

module.exports = {
    createProjectObject,
    createProjectsObjectIfData
}
