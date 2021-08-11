const { file_purpose } = require('../values/enums')

class Project {
    constructor(id, owner, clientName, projectTitle, site, contractAmount,
        paymentMode, deliverBy, expectPaymentBy, subject, source, BoQ, revisedBoQ, BoM, proforma, status, updates, trelloCardId) {
        this.id = id;
        this.owner = owner
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
        this.proforma = proforma;
        this.status = status;
        this.updates = updates;
        this.trelloCardId = trelloCardId;
    }

    getId() {
        return this.id
    }
    getOwner() {
        return this.owner
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
    getDoc(doc_type) {
        let file
        switch (doc_type) {
            case file_purpose.BoM:
                file = this.getBoM()
                break
            case file_purpose.BoQ:
                file = this.getBoQ()
                break
            case file_purpose.BoQ_revised:
                file = this.getRevisedBoQ()
                break
            case file_purpose.PI:
                file = this.getProforma()
                break
            case file_purpose.PO:
                break
            case file_purpose.CONTRACT:
                break
            case file_purpose.BID:
                break
            case file_purpose.OTHER:
                break
            default:
                break
        }
        return file
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
    getProforma() {
        return this.proforma
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
