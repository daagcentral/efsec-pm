const enums = require('../enums')
class Project {
    constructor(id, clientName, projectTitle, site, contractAmount,
        paymentMode, deliverBy, expectPaymentBy, subject, source, BoQ, BoM, status, updates) {
        this.id = id;
        this.clientName = clientName;
        this.projectTitle = projectTitle;
        this.site = site;
        this.contractAmount = contractAmount;
        this.paymentMode = paymentMode;
        this.deliverBy = deliverBy;
        this.expectPaymentBy = expectPaymentBy;
        this.subject = subject;
        this.source = source;
        this.BoQ = BoQ;
        this.BoM = BoM;
        this.status = status; // enums.status.INIT ??
        this.updates = updates;
    }
    getId() {
        return this.id
    }
    getClientName() {
        return this.clientName
    }
    getProjectTitle() {
        return this.projectTitle
    }
    getSite() {
        return this.site
    }
    getContractAmount() {
        return this.contractAmount
    }
    getPaymentMode() {
        return this.paymentMode
    }
    getDeliverBy() {
        return this.deliverBy
    }
    getExpectPaymentBy() {
        return this.expectPaymentBy
    }
    getSubject() {
        return this.subject
    }
    getSource() {
        return this.source
    }
    getBoQ() {
        return this.BoQ
    }
    getBoM() {
        return this.BoM
    }
    getStatus() {
        return this.status
    }
    getUpdates() {
        return this.updates
    }

}

module.exports = Project