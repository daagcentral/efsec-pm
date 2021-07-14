class Project {
    constructor(id, clientName, projectTitle, site, contractAmount,
        paymentMode, deliverBy, expectPaymentBy, subject, source, BoQ, revisedBoQ, BoM, status, updates, trelloCardId) {
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
        this.revisedBoQ = revisedBoQ;
        this.BoM = BoM;
        this.status = status;
        this.updates = updates;
        this.trelloCardId = trelloCardId;
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
    getRevisedBoQ() {
        return this.revisedBoQ
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
    getTrelloCardId() {
        return this.trelloCardId
    }

}

module.exports = Project
