const { project_status, project_source, payment_mode } = require('./enums')
const { getProject } = require('./controllers/projectController')
const { respace } = require('./controllers/utils/modelUtils')
const main_menu = [
    [{ text: 'New Items Sale', callback_data: 'add_items_sale' }],
    [{ text: 'New Bid', callback_data: 'add_bid' }],
    [{ text: 'New Project', callback_data: 'add_project' }],
    [{ text: 'Upload BoM', callback_data: 'send_bom' }],
    [{ text: 'View Prices from Procurement', callback_data: 'view_boqs' }],
    [{ text: 'Send Margins for Review', callback_data: 'send_margins_for_review' }],
    [{ text: 'View Prices Ready for Client', callback_data: 'prices_ready_for_client' }],
    [{ text: 'Leave', callback_data: 'leave' }],
]

const main_menu_procurement = [
    [{ text: 'View BoMs', callback_data: 'view_boms' }],
    [{ text: 'Send Prices', callback_data: 'send_prices' }],
    [{ text: 'Ask for Clarification', callback_data: 'ask_clarification' }],
    [{ text: 'Leave', callback_data: 'leave' }],
]

const projectPicked = async (id) => {
    const project = await getProject(id)
    const source = project.getSource()
    var menu = [
        project.getBoM() != '' ?
            [{
                text: 'Download BoM',
                callback_data: `download_BoM@${id}`
            }] : []
        ,
        project.getBoQ() != '' ?
            [{
                text: 'Download Prices',
                callback_data: `download_BoQ@${id}`
            }] : [{
                text: 'Send Procurement Dept. reminder to get prices',
                callback_data: `send_procurement_reminder@${id}`
            }]
        ,
        [{
            text: `Change Status`,
            callback_data: `change_project_status@${id}`
        }],
        [{
            text: 'Add Payment Mode',
            callback_data: `add_payment_mode@${id}`
        }],
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

const generateProjectStatusOptions = (id, currentOption) => {
    var status_list = Object.values(project_status).filter(
        status =>
            status !== currentOption &&
            status !== project_status.PROCUREMENT_REVIEW &&
            status !== project_status.SALES_REVIEW_1 &&
            status !== project_status.SALES_REVIEW_2 &&
            status !== project_status.MANAGER_REVIEW
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
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `projectPicked@${project.getId()}@${project.getProjectTitle()}` }])
}

const generateProjectsListforBoMDownload = (projects) => {
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `download_BoM@${project.getId()}` }])
}

const generateProjectsListforBoQDownload = (projects) => {
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `download_BoQ@${project.getId()}` }])
}

const generateProjectsListforBoMUpload = (projects) => {
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `upload_BoM@${project.getId()}` }])
}

const generateProjectsListforBoQUpload = (projects) => {
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `upload_BoQ@${project.getId()}` }])
}

const generateProjectsListforBoQReview = (projects) => {
    return projects.map(project => [{ text: respace(project.getProjectTitle()), callback_data: `send_for_manager_review@${project.getId()}` }])
}

module.exports = {
    main_menu,
    main_menu_procurement,
    generateProjectsListforBoMUpload,
    generateProjectsListforBoQDownload,
    generateProjectsListforBoQReview,
    generateProjectsListforBoMDownload,
    generateProjectsListforBoQUpload,
    generateProjectsList,
    generateProjectStatusOptions,
    generatePaymentModeOptions,
    projectPicked
}

