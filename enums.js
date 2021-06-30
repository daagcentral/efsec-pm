const project_status = {
    INIT: 'initialize',
    PENDING: 'pending',
    SIGNED: 'signed',
    CLOSED: 'closed',
}

const employee_status = {
    PENDING: 'pending',
    ACTIVE: 'active',
    TERMINATED: 'terminated'
}

const payment_mode = {
    CASH: 'cash',
    CREDIT: 'credit',
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
    PROCUREMENT: 'procurement'
}

module.exports = {project_status, employee_status, payment_mode, file_purpose, project_source, access_to}