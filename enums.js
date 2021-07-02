const project_status = {
    INIT: 'initialize',
    PENDING: 'pending',
    SIGNED: 'signed',
    PROCUREMENT_REVIEW: 'under precurement review', // hide from viewers
    SALES_REVIEW_1: 'under sales review', // when procurement returns // hide from viewers
    MANAGER_REVIEW: 'under manager review', // hide from viewers
    SALES_REVIEW_2: 'ready for client', // when managers return // hide from viewers
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
    MANAGEMENT: 'management',
    ADMIN: 'admin'
}

module.exports = {project_status, employee_status, payment_mode, payment_status, file_purpose, project_source, access_to}