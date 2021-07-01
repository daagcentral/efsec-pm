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
        doc.data().status,
        doc.data().updates
    );
}


module.exports = {
    createProjectObject
}