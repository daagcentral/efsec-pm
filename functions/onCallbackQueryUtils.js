const { addProject, getAllProjects, getAllOpenProjects, getAllOpenProjectsWithSource, getAllOpenProjectsWithRevisedBoQ, getAllOpenProjectsWithBoQ, getAllOpenProjectsWithBoM, getProject, updateProject, deleteProject } = require('./controllers/projectController')
const { addEmployee, getAllEmployees, employeeLogout, getEmployee, updateEmployee, deleteEmployee } = require('./controllers/employeeController')
const { generateProjectsList, generateProjectStatusOptions, generateProjectsListforBoMUpload, generateProjectsListforBoQDownload, generateProjectsListforBoQReview, generateProjectsListforBoQUpload, generateProjectsListforBoMDownload, generatePaymentModeOptions, project_menu, projectPicked, } = require('./levelcommands')
const { respace } = require('./controllers/utils/modelUtils')
const { project_source, project_status } = require('./enums')
const { sales_bot, procurement_bot } = require('./bots')

const sendGoogleForm = async function (bot, msg, form) {
    const text =
        `Step 1: Copy your ID link:\nwww.${msg.chat.id}.com\n\nStep 2: Add the new project here:\n${form}` // google form URL
    await bot.sendMessage(msg.chat.id, text);
    return
}

const pickProjectHandler = async function (bot, msg, source) {
    let opts, text;
    const open_projects = await getAllOpenProjectsWithSource(source)
    if (open_projects) {
        const open_projects_list = generateProjectsList(open_projects)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        text = '\nSelect one \n';
    } else {
        text = `No open ${source}s`
    }
    await bot.sendMessage(msg.chat.id, text, opts);
    return
}

const leaveHandler = async (bot, msg) => {
    const text = await employeeLogout(msg.chat.id)
    await bot.sendMessage(msg.chat.id, text)
    return
}

const projectPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project_name = respace(regex[2])
    try {
        const menu = await projectPicked(project_id)
        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: menu
            }),
        };
        await bot.sendMessage(msg.chat.id, project_name, options);
    } catch (error) {
        functions.logger.warn("error\n" + error)
        await bot.sendMessage(msg.chat.id, 'Failed to get info on project. Make sure the id is correct')
    }
    return
}

const sendForManagerReviewFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    let text, options
    if (project.getStatus() == project_status.SALES_REVIEW_1) {
        text = `Reply to this text with attached file (note: must be pdf or excel). Doing so will notify management.\nprojectId: ${project_id}`
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = 'Prices already sent for review'
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}


// TODO check uploaded file is pdf
const uploadBoMFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    let text, options
    if (project.getBoM() == '') {
        text = `Reply to this text with attached file (note: must be pdf or excel). Doing so will notify procurement department.\nprojectId: ${project_id}`
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = 'Bill of Materials already uploaded'
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}

const downloadBoMFromRegexHandler = async (bot, msg, regex) => {
    try {
        const project_id = regex[1]
        const project = await getProject(project_id)
        const BoM_file_id = project.getBoM()
        const channel_msg = await sales_bot.sendDocument(env_config.service.efsec_admin_chat_id, BoM_file_id)
        await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
    } catch (error) {
        functions.logger.warn("error\n" + error)
    }
    return
}

const downloadBoQFromRegexHandler = async (bot, msg, regex) => {
    try {
        const project_id = regex[1]
        const project = await getProject(project_id)
        const BoM_file_id = project.getBoQ()
        const channel_msg = await procurement_bot.sendDocument(env_config.service.efsec_admin_chat_id, BoM_file_id)
        await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
    } catch (error) {
        functions.logger.warn("error\n" + error)
    }
    return
}

// TODO check uploaded file is pdf
const uploadBoQFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    let text, options
    if (project.getBoQ() == '') {
        text = `Reply to this text with attached file (note: must be pdf or excel). Doing so will notify sales department.\nprojectId: ${project_id}`
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = `Prices already uploaded for ${project.getProjectTitle()}`
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}

const changeProjectStatusHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const text = `Current status for ${respace(project.getProjectTitle())} is ${project.getStatus()}. Change it to:`
    const menu = generateProjectStatusOptions(project.getId(), project.getStatus())
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: menu
        }),
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}

const statusPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_status = regex[2]
    const text = await updateProject(project_id, { 'status': new_status })
    await bot.sendMessage(msg.chat.id, text);
    return
}

const paymentModePickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_mode = regex[2]
    const text = await updateProject(project_id, { 'paymentMode': new_mode })
    await bot.sendMessage(msg.chat.id, text);
    return
}

// TODO contract amount needs to be int ONLY check
const addOrUpdateContractAmountHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const current_ammount = project.getContractAmount()
    var text = `Current contract amount for ${respace(project.getProjectTitle())} is ${current_ammount === '' ? 'not added' : current_ammount}`
    await bot.sendMessage(msg.chat.id, text)
    text = `Reply to this message with new amount.\nprojectId: ${project_id}`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    await bot.sendMessage(msg.chat.id, text, options)
    return
}

// TODO date format needs checks
const addOrUpdateDeliverByHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const current_date = project.getDeliverBy()
    var text = `Current delivery date for ${respace(project.getProjectTitle())} is ${current_date === ''
        ? 'not added'
        : current_date}.`

    await bot.sendMessage(msg.chat.id, text)
    text = `Reply to this message with new deliver date (DD-MM-YYYY).\nprojectId: ${project_id}`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    await bot.sendMessage(msg.chat.id, text, options)
    return
}

// TODO date format needs checks
const addOrUpdateExpectPaymentDateHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const current_date = project.getExpectPaymentBy()
    var text = `Current expected payment date for ${respace(project.getProjectTitle())} is ${current_date === ''
        ? 'not added'
        : current_date}.` 
    bot.sendMessage(msg.chat.id, text)
    text = `Reply to this message with new expected payment date (DD-MM-YYYY).\nprojectId: ${project_id}`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    await bot.sendMessage(msg.chat.id, text, options)
    return
}

const addOrUpdatePaymentModeHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const currentPaymentMode = project.getPaymentMode();
    const text = `Current payment mode for ${respace(project.getProjectTitle())} is ${currentPaymentMode === ''
        ? 'not added. Choose payment mode below:'
        : currentPaymentMode + '. Change to:'}`

    const menu = generatePaymentModeOptions(project.getId(), currentPaymentMode)
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: menu
        }),
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}

const viewBoMsHandler = async (bot, msg) => {
    var open_projects_with_BoM = await getAllOpenProjectsWithBoM()
    if (open_projects_with_BoM) {
        open_projects_with_BoM = open_projects_with_BoM.filter(project => project.getStatus() == project_status.PROCUREMENT_REVIEW)
        const open_projects_list = generateProjectsListforBoMDownload(open_projects_with_BoM)
        const opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        const text = open_projects_with_BoM.length === 0 ? 'No BoMs ready for review' : "Download BoM for..."
        await bot.sendMessage(msg.chat.id, text, opts);
    } else {
        await bot.sendMessage(msg.chat.id, "There are no open projects with uploaded BoMs");
    }
    return
}

const viewBoQsHandler = async (bot, msg) => {
    var open_projects_with_BoQ = await getAllOpenProjectsWithBoQ()
    if (open_projects_with_BoQ) {
        open_projects_with_BoQ = open_projects_with_BoQ.filter(project => project.getStatus() == project_status.SALES_REVIEW_1)
        const open_projects_list = generateProjectsListforBoQDownload(open_projects_with_BoQ)
        const opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        const text = open_projects_with_BoQ.length === 0 ? 'There are no BoQs ready for review.' : "Download BoQ for..."
        await bot.sendMessage(msg.chat.id, text, opts);
    } else {
        await bot.sendMessage(msg.chat.id, "There are no BoQs ready for review.");
    }
    return
}

const sendMarginsHandler = async (bot, msg) => {
    var open_projects_with_BoQ = await getAllOpenProjectsWithBoQ();
    if (open_projects_with_BoQ) {
        open_projects_with_BoQ = open_projects_with_BoQ.filter(project => project.getStatus() == project_status.SALES_REVIEW_1)
        const open_projects_list = generateProjectsListforBoQReview(open_projects_with_BoQ)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        const text = open_projects_with_BoQ.length === 0 ? 'There are no BoQs awaiting review.' : "Get reviews for..."
        await bot.sendMessage(msg.chat.id, text, opts);
    } else {
        await bot.sendMessage(msg.chat.id, "There are no BoQs awaiting review.");
    }
    return
}


const sendPricesHandler = async (bot, msg) => {
    var open_projects_with_BoM = await getAllOpenProjectsWithBoM()
    if (open_projects_with_BoM) {
        open_projects_with_BoM = open_projects_with_BoM.filter(project => project.getStatus() == project_status.PROCUREMENT_REVIEW);
        const open_projects_list = generateProjectsListforBoQUpload(open_projects_with_BoM)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        const text = open_projects_with_BoM.length === 0 ? "There are no open projects with uploaded BoMs" : "Upload Prices for..."
        await bot.sendMessage(msg.chat.id, text, opts);
    } else {
        await bot.sendMessage(msg.chat.id, "There are no open projects with uploaded BoMs");
    }
    return
}

const sendBoMsHandler = async (bot, msg) => {
    var open_projects_with_no_BoM = await getAllOpenProjects()
    if (open_projects_with_no_BoM) {
        open_projects_with_no_BoM = open_projects_with_no_BoM.filter(project => project.getBoM() == '');
        const open_projects_list = generateProjectsListforBoMUpload(open_projects_with_no_BoM)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        const text = open_projects_with_no_BoM.length === 0 ? 'There are no open projects without BoMs.' : "Upload BoM for..."
        await bot.sendMessage(msg.chat.id, text, opts);
    } else {
        await bot.sendMessage(msg.chat.id, 'There are no open projects without BoMs.');
    }
    return
}

const priceForClientsHandler = async (bot, msg) => {

    var open_projects_with_revised_BoQ = await getAllOpenProjectsWithRevisedBoQ();
    if (open_projects_with_revised_BoQ === null) {
        await bot.sendMessage(msg.chat.id, "There are no prices ready for client.")
        return
    }
    open_projects_with_revised_BoQ
        .forEach(async (project) => {
            const revised_BoQ_file_id = project.getRevisedBoQ()
            const channel_msg = await sales_bot.sendDocument(env_config.service.efsec_admin_chat_id, revised_BoQ_file_id)
            await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
            await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
        });
    return
}


async function callbackQueryDistributer(bot, msg, action) {
    // get data passed by button clicked regex match
    const projectPickedFromRegex = action.match(/projectPicked@(.*)@(.*)/) // project id @ name
    const statusPickedFromRegex = action.match(/statusPicked@(.*)@(.*)/) // project id @ status
    const paymentModePickedFromRegex = action.match(/paymentModePicked@(.*)@(.*)/) // project id @ paymentMode
    const uploadBoMFromRegex = action.match(/upload_BoM@(.*)/) // project id
    const uploadBoQFromRegex = action.match(/upload_BoQ@(.*)/) // project id
    const downloadBoMFromRegex = action.match(/download_BoM@(.*)/) // project id
    const downloadBoQFromRegex = action.match(/download_BoQ@(.*)/) // project id
    const sendForManagerReviewFromRegex = action.match(/send_for_manager_review@(.*)/) // project id
    const changeProjectStatusFromRegex = action.match(/change_project_status@(.*)/) // project id
    const addOrUpdateContractAmountFromRegex = action.match(/add_or_update_contract_amount@(.*)/) // project id
    const addPaymentModeFromRegex = action.match(/add_payment_mode@(.*)/) // project id
    const addOrUpdateDeliverByFromRegex = action.match(/add_or_update_deliver_by@(.*)/) // project id
    const addOrUpdateExpectPaymentDateFromRegex = action.match(/add_or_update_expect_payment_date@(.*)/) // project id

    if (projectPickedFromRegex !== null) {
        await projectPickedHandler(bot, msg, projectPickedFromRegex)
    } else if (uploadBoMFromRegex !== null) {
        await uploadBoMFromRegexHandler(bot, msg, uploadBoMFromRegex)
    } else if (uploadBoQFromRegex !== null) {
        await uploadBoQFromRegexHandler(bot, msg, uploadBoQFromRegex)
    } else if (downloadBoMFromRegex !== null) {
        await downloadBoMFromRegexHandler(bot, msg, downloadBoMFromRegex)
    } else if (downloadBoQFromRegex !== null) {
        await downloadBoQFromRegexHandler(bot, msg, downloadBoQFromRegex)
    } else if (sendForManagerReviewFromRegex !== null) {
        await sendForManagerReviewFromRegexHandler(bot, msg, sendForManagerReviewFromRegex)
    } else if (changeProjectStatusFromRegex !== null) {
        await changeProjectStatusHandler(bot, msg, changeProjectStatusFromRegex)
    } else if (statusPickedFromRegex !== null) {
        await statusPickedHandler(bot, msg, statusPickedFromRegex)
    } else if (addOrUpdateContractAmountFromRegex !== null) {
        await addOrUpdateContractAmountHandler(bot, msg, addOrUpdateContractAmountFromRegex)
    } else if (addOrUpdateDeliverByFromRegex !== null) {
        await addOrUpdateDeliverByHandler(bot, msg, addOrUpdateDeliverByFromRegex)
    } else if (addOrUpdateExpectPaymentDateFromRegex !== null) {
        await addOrUpdateExpectPaymentDateHandler(bot, msg, addOrUpdateExpectPaymentDateFromRegex)
    } else if (addPaymentModeFromRegex !== null) {
        await addOrUpdatePaymentModeHandler(bot, msg, addPaymentModeFromRegex)
    } else if (paymentModePickedFromRegex !== null) {
        await paymentModePickedHandler(bot, msg, paymentModePickedFromRegex)
    }

    else {
        // regex not matched aka no external data passed
        switch (action) {
            case 'add_items_sale':
                await sendGoogleForm(bot, msg, env_config.service.sales_item_form_link)
                break
            case 'add_bid':
                await sendGoogleForm(bot, msg, env_config.service.sales_bid_form_link)
                break
            case 'add_project':
                await sendGoogleForm(bot, msg, env_config.service.sales_project_forms_link)
                break
            case 'pick_project':
                await pickProjectHandler(bot, msg, project_source.PROJECT)
                break
            case 'pick_sale':
                await pickProjectHandler(bot, msg, project_source.RETAIL)
                break
            case 'pick_bid':
                await pickProjectHandler(bot, msg, project_source.BID)
                break
            case 'send_bom':
                await sendBoMsHandler(bot, msg)
                break
            case 'view_boms':
                await viewBoMsHandler(bot, msg)
                break
            case 'view_boqs':
                await viewBoQsHandler(bot, msg)
                break
            case 'send_prices':
                await sendPricesHandler(bot, msg)
                break
            case 'send_margins_for_review':
                await sendMarginsHandler(bot, msg)
                break
            case 'prices_ready_for_client':
                await priceForClientsHandler(bot, msg)
                break
            case 'leave':
                leaveHandler(bot, msg)
                break
            default:
                await bot.sendMessage(msg.chat.id, 'functionality not implemented');
                break
        }
    }
    return
}

module.exports = { callbackQueryDistributer }