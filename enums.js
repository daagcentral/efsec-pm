const project_status = {
    INIT: 'initialize',
    PENDING: 'pending',
    SIGNED: 'signed',
    PROCUREMENT_REVIEW: 'procurement_review',
    SALES_REVIEW_1: 'sales_review_1', // when procurement returns
    SALES_REVIEW_2: 'sales_review_2', // when managers return
    MANAGER_REVIEW: 'manager_review',
    CLOSED: 'closed',
}

const employee_status = {
    PENDING_APPROVAL: 'pending_approval',
    ACTIVE: 'active',
    TERMINATED: 'terminated'
}

const payment_mode = {
    CASH: 'cash',
    CREDIT: 'credit',
    CHECK: 'check',
}

const payment_status = {
    PENDING: 'pending',
    ADVANCE_PAID: 'advance_paid',
    FULLY_PAID: 'fully_paid'
}

const file_purpose = {
    PROFILE_PIC: 'profile_picture',
    BoM: 'bom'
}

const project_source = {
    BID: 'bid',
    RETAIL: 'retail',
    PROJECT: 'project',
}

const access_to = {
    SALES: 'sales',
    PROCUREMENT: 'procurement',
    ADMIN: 'admin'
}

module.exports = {project_status, employee_status, payment_mode, payment_status, file_purpose, project_source, access_to}