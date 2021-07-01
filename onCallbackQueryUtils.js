const { addProject, getAllProjects, getAllOpenProjects, getAllOpenProjectsWithSource, getAllOpenProjectsWithBoQ, getAllOpenProjectsWithBoM, getProject, updateProject, deleteProject } = require('./controllers/projectController')
const { addEmployee, getAllEmployees, employeeLogout, getEmployee, updateEmployee, deleteEmployee } = require('./controllers/employeeController')
const { generateProjectsList, generateProjectStatusOptions, generateProjectsListforBoQReview, generateProjectsListforBoQUpload, generateProjectsListforBoMDownload, generatePaymentModeOptions, project_menu, projectPicked, } = require('./levelcommands')
const { respace } = require('./controllers/utils/modelUtils')
const { project_source, project_status } = require('./enums')
const { sales_bot, procurement_bot } = require('./bots')

const sendGoogleForm = function (bot, msg, form) {
    const text =
        `Step 1: Copy your ID link:\nwww.${msg.chat.id}.com\n\nStep 2: Add the new project here:\n${form}` // google form URL
    bot.sendMessage(msg.chat.id, text);
    return
}

const pickProjectHandler = async function (bot, msg, source) {
    const text = '\nSelect one \n';
    let opts;
    const open_projects = await getAllOpenProjectsWithSource(source)
    if (open_projects) {
        const open_projects_list = generateProjectsList(open_projects)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
    }
    // TODO else for error handdling
    bot.sendMessage(msg.chat.id, text, opts);
    return
}

const leaveHandler = async (bot, msg) => {
    const text = await employeeLogout(msg.chat.id)
    bot.sendMessage(msg.chat.id, text)
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
        bot.sendMessage(msg.chat.id, project_name, options);
    } catch (error) {
        console.log(error.message)
        bot.sendMessage(msg.chat.id, 'Failed to get info on project. Make sure the id is correct')
    }
    return
}

const sendForManagerReviewFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    if (project_id === '__ALL__') {
        // TODO send all to manager
        bot.sendMessage(msg.chat.id, 'Functionality not implemented yet. Please pick one at a time')
    } else {
        const project = await getProject(project_id)
        let text, options
        if (project.getRevisedBoQ() == '') {
            text = "Reply to this text with attached file"
            options = {
                reply_markup: JSON.stringify({
                    force_reply: true,
                })
            };
        } else {
            text = 'Bill of Materials already uploaded'
        }
        const sent = await bot.sendMessage(msg.chat.id, text, options);
        bot.onReplyToMessage(sent.chat.id, sent.message_id, async function (file) {
            try {
                const text = await updateProject(project_id, { 'BoQ_revised': file.document.file_id, 'status': project_status.MANAGER_REVIEW })
                bot.sendMessage(sent.chat.id, text+ '. Waiting for manager\'s review')
            } catch (error) {
                console.log(error.message)
                bot.sendMessage(sent.chat.id, 'Failed. Try again')
            }
        })        
    }
}


// TODO check uploaded file is pdf
const uploadBoMFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    let text, options
    if (project.getBoM() == '') {
        text = "Reply to this text with attached file"
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = 'Bill of Materials already uploaded'
    }
    const sent = await bot.sendMessage(msg.chat.id, text, options);
    bot.onReplyToMessage(sent.chat.id, sent.message_id, async function (file) {
        try {
            const text = await updateProject(project_id, { 'BoM': file.document.file_id, 'status': project_status.PROCUREMENT_REVIEW })
            bot.sendMessage(sent.chat.id, text)
        } catch (error) {
            console.log(error.message)
            bot.sendMessage(sent.chat.id, 'Failed. Try again')
        }
    })
    return
}

const downloadBoMFromRegexHandler = async (bot, msg, regex) => {
    try {
        const project_id = regex[1]
        const project = await getProject(project_id)
        const BoM_file_id = project.getBoM()
        const channel_msg = await sales_bot.sendDocument(process.env.EFSEC_ADMIN_CHAT_ID, BoM_file_id)
        await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id + 1)
    } catch (error) {
        console.log(error.message)
    }
    return
}

const downloadBoQFromRegexHandler = async (bot, msg, regex) => {
    try {

        const project_id = regex[1]
        const project = await getProject(project_id)
        const BoM_file_id = project.getBoQ()
        const channel_msg = await procurement_bot.sendDocument(process.env.EFSEC_ADMIN_CHAT_ID, BoM_file_id)
        await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id + 1)
    } catch (error) {
        console.log(error.message)
    }
    return
}

// TODO check uploaded file is pdf
const uploadBoQFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    let text, options
    if (project.getBoQ() == '') {
        text = "Reply to this text with attached file"
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = `Prices already uploaded for ${project.getProjectTitle()}`
    }
    const sent = await bot.sendMessage(msg.chat.id, text, options);
    bot.onReplyToMessage(sent.chat.id, sent.message_id, async function (file) {
        try {
            const text = await updateProject(project_id, { 'BoQ': file.document.file_id, 'status': project_status.SALES_REVIEW_1 })
            // TODO notify sales 
            bot.sendMessage(sent.chat.id, text)
        } catch (error) {
            console.log(error.message)
            bot.sendMessage(sent.chat.id, 'Failed. Try again')
        }
    })
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
    bot.sendMessage(msg.chat.id, text, options);
    return
}

const statusPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_status = regex[2]
    const text = await updateProject(project_id, { 'status': new_status })
    bot.sendMessage(msg.chat.id, text);
    return
}

const paymentModePickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_mode = regex[2]
    const text = await updateProject(project_id, { 'paymentMode': new_mode })
    bot.sendMessage(msg.chat.id, text);
    return
}

// TODO contract amount needs to be int ONLY check
const addOrUpdateContractAmountHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const current_ammount = project.getContractAmount()
    const text = `Current contract amount for ${respace(project.getProjectTitle())} is \
    ${current_ammount === '' ? 'not added' : current_ammount} Reply to this message with new amount. \n\nListening...`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    bot.sendMessage(msg.chat.id, text, options).then(async function (sent) {
        bot.onReplyToMessage(sent.chat.id, sent.message_id, async function (newContractAmount) {
            const text = await updateProject(project_id, { 'contractAmount': newContractAmount.text })
            bot.sendMessage(sent.chat.id, text)
        })
    })
    return
}

// TODO date format needs checks
const addOrUpdateDeliverByHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const current_date = project.getDeliverBy()
    const text = `Current delivery date for ${respace(project.getProjectTitle())} is ${current_date === ''
        ? 'not added'
        : current_date}. Reply to this message with new date (DD-MM-YYYY).\n\nListening...`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    bot.sendMessage(msg.chat.id, text, options).then(async function (sent) {
        bot.onReplyToMessage(sent.chat.id, sent.message_id, async function (newDate) {
            const text = await updateProject(project_id, { 'deliverBy': newDate.text })
            bot.sendMessage(sent.chat.id, text)
        })
    })
    return
}

// TODO date format needs checks
const addOrUpdateExpectPaymentDateHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await getProject(project_id)
    const current_date = project.getExpectPaymentBy()
    const text = `Current expected payment date for ${respace(project.getProjectTitle())} is ${current_date === ''
        ? 'not added'
        : current_date}. Reply to this message with new date (DD-MM-YYYY).\n\nListening...`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    bot.sendMessage(msg.chat.id, text, options).then(async function (sent) {
        bot.onReplyToMessage(sent.chat.id, sent.message_id, async function (newDate) {
            const text = await updateProject(project_id, { 'expectPaymentBy': newDate.text })
            bot.sendMessage(sent.chat.id, text)
        })
    })
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
    bot.sendMessage(msg.chat.id, text, options);
    return
}

const viewBoMsHandler = async (bot, msg) => {
    const open_projects_with_BoM = await getAllOpenProjectsWithBoM();

    if (open_projects_with_BoM) {
        const open_projects_list = generateProjectsListforBoMDownload(open_projects_with_BoM)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        bot.sendMessage(msg.chat.id, "Download BoM for...", opts);
    } else {
        bot.sendMessage(msg.chat.id, "There are no open projects with uploaded BoMs");
    }
    return
}

const downloadAllBoQHandler = async (bot, msg) => {
    // TODO track status of bom and boq to see where in the cycle they are
    var open_projects_with_BoQ = await getAllOpenProjectsWithBoQ();
    open_projects_with_BoQ
        .filter(project => project.getStatus() === project_status.SALES_REVIEW_1)
        .forEach(async (project) => {
            const BoQ_file_id = project.getBoM()
            try {
                const channel_msg = await sales_bot.sendDocument(process.env.EFSEC_ADMIN_CHAT_ID, BoQ_file_id)
                await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
                await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
            } catch (error) {
                console.log(error.message)
            }
        });
    return
}

const sendPricesHandler = async (bot, msg) => {
    const open_projects_with_BoM = await getAllOpenProjectsWithBoM();
    if (open_projects_with_BoM) {
        const open_projects_list = generateProjectsListforBoQUpload(open_projects_with_BoM)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        bot.sendMessage(msg.chat.id, "Upload Prices for...", opts);
    } else {
        bot.sendMessage(msg.chat.id, "There are no open projects with uploaded BoMs");
    }
    return

}

const sendMarginsHandler = async (bot, msg) => {
    var open_projects_with_BoQ = await getAllOpenProjectsWithBoQ();
    if (open_projects_with_BoQ === null) {
        bot.sendMessage(msg.chat.id, "There are no BoQs awaiting review");
    }
    open_projects_with_BoQ = open_projects_with_BoQ.filter(project => project.getStatus() === project_status.SALES_REVIEW_1)
    if (open_projects_with_BoQ) {
        const open_projects_list = generateProjectsListforBoQReview(open_projects_with_BoQ)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        bot.sendMessage(msg.chat.id, "Get reviews for...", opts);
    } else {
        bot.sendMessage(msg.chat.id, "There are no BoQs awaiting review");
    }
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
                sendGoogleForm(bot, msg, process.env.SALES_ITEMS_FORM_LINK)
                break
            case 'add_bid':
                sendGoogleForm(bot, msg, process.env.SALES_BID_FORM_LINK)
                break
            case 'add_project':
                sendGoogleForm(bot, msg, process.env.SALES_PROJECT_FORM_LINK)
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
            case 'view_boms':
                await viewBoMsHandler(bot, msg)
                break
            case 'download_all_BoQ':
                await downloadAllBoQHandler(bot, msg)
                break
            case 'send_prices':
                await sendPricesHandler(bot, msg)
                break
            case 'send_margins_for_review':
                await sendMarginsHandler(bot, msg)
                break
            case 'ask_clarification':
                break
            case 'leave':
                leaveHandler(bot, msg)
                break
            default:
                bot.sendMessage(msg.chat.id, 'functionality not implemented');
                break
        }
    }
    return
}

module.exports = { callbackQueryDistributer }