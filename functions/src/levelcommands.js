const { project_status, project_source, access_to, payment_mode, file_purpose } = require('./values/enums')
const { respace } = require('./controllers/utils/modelUtils')
const main_menu_sales = [
    [{ text: 'New Sales Activity', callback_data: 'add_project' }],
    [{ text: 'View Client Document', callback_data: 'view_doc' }],
    [{ text: 'Upload Client Document', callback_data: 'send_doc' }],
    [{ text: `Change Project Status`, callback_data: `change_status` }],
    [{ text: 'Leave', callback_data: 'leave' }],
]
// [{ text: 'View Prices from Procurement', callback_data: 'view_boqs' }],
// [{ text: 'Send Margins for Review', callback_data: 'send_margins_for_review' }],
// [{ text: 'View Prices Ready for Client', callback_data: 'prices_ready_for_client' }],

const main_menu_procurement = [
    [{ text: 'View BoMs', callback_data: 'view_boms' }],
    [{ text: 'Send Prices', callback_data: 'send_prices' }],
    [{ text: 'Ask for Clarification', callback_data: 'ask_clarification' }],
    [{ text: 'Leave', callback_data: 'leave' }]
]

const main_menu_for = (access_requested) => {
    switch (access_requested) {
        case access_to.SALES:
            return main_menu_sales
        case access_to.PROCUREMENT:
            return main_menu_procurement
        default:
            return null
    }
}

const genMenuForProjectPicked = (id, source) => {
    var menu = [
        [{ text: 'View Client Document', callback_data: 'view_doc' }],
        [{ text: `Change Status`, callback_data: `change_project_status@${id}` }],
    ]
    switch (source) {
        case project_source.BID:
            menu.push([{
                text: 'Add or Update Bid Amount',
                callback_data: `add_or_update_contract_amount@${id}`
            }])
            break
        case project_source.PROJECT:
            menu.push([{
                text: 'Add or Update Contract Amount',
                callback_data: `add_or_update_contract_amount@${id}`
            }],
                [{
                    text: 'Add or Update Deliver By',
                    callback_data: `add_or_update_deliver_by@${id}`
                }],
                [{
                    text: 'Add or Update Expect Payment Date',
                    callback_data: `add_or_update_expect_payment_date@${id}`
                }])
            break

        case project_source.RETAIL:
            menu.push([{
                text: 'Add or Update Sale Amount',
                callback_data: `add_or_update_contract_amount@${id}`
            }])
            break
        default:
            break
    }

    return menu
}

const document_types = (view_or_send) => {
    return Object.values(file_purpose)
        .filter(type => type !== file_purpose.PROFILE_PIC && type !== file_purpose.BoQ_revised)
        .map(type => [{
            text: (type.charAt(0).toUpperCase() + type.slice(1)).replace("_", " "),
            callback_data: `${view_or_send}@${type}`
        }])
}

const generateProjectStatusOptions = (id, currentOption) => {
    var status_list = Object.values(project_status).filter(
        status => status !== currentOption
    )
    return status_list.map(status => [{ text: status, callback_data: `statusPicked@${id}@${status}` }])
}

const generatePaymentModeOptions = (id, currentOption) => {
    var payment_mode_list = Object.values(payment_mode).filter(
        mode =>
            mode !== currentOption
    )
    return payment_mode_list.map(mode => [{ text: mode, callback_data: `paymentModePicked@${id}@${mode}` }])
}

const generateProjectsList = (projects) => {
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `projectPicked@${project.getId()}` }])
}

const generateProjectListForSendOrViewDoc = (projects, view_or_send, doc_type, employee_id) => {
    return projects
        .filter(project => project.getOwner() == employee_id)
        .map(project => [{ text: respace(project.getProjectTitle()), callback_data: `${view_or_send}@${doc_type}@${project.getId()}` }])
}

const generateProjectListForStatusChange = (projects, employee_id) => {
    return projects
        .filter(project => project.getOwner() == employee_id)
        .map(project => [{ text: respace(project.getProjectTitle()), callback_data: `change_project_status@${project.getId()}` }])
}

module.exports = {
    main_menu_for,
    document_types,
    generateProjectListForSendOrViewDoc,
    generateProjectsList,
    generateProjectStatusOptions,
    generateProjectListForStatusChange,
    generatePaymentModeOptions,
    genMenuForProjectPicked
}
