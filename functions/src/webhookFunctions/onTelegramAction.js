const levelCommands = require('../levelcommands')
const { genAddEmployee, genEmployeeLogout, genEmployee, genEmployeeLogin } = require('../controllers/employeeController')
const { genAllOpenProjects, genAllOpenProjectsWithSource, genAllOpenProjectsWithStatus, genProjectWithId, genUpdateProject } = require('../controllers/projectController')
const { genTrelloMoveCardFromListtoList } = require('../controllers/trelloController')
const { generateProjectsList, generateProjectStatusOptions, generateProjectsListforBoMUpload, generateProjectsListforBoQDownload, generateProjectsListforBoQReview, generateProjectsListforBoQUpload, generateProjectsListforBoMDownload, generatePaymentModeOptions, genMenuForProjectPicked } = require('../levelcommands')
const { access_to, project_source, project_status } = require('../values/enums')
const { project_status_to_trello_idList_map } = require('../values/maps')
const { respace } = require('../controllers/utils/modelUtils')
const { sales_bot, procurement_bot } = require('../bots')

const genSendGoogleForm = async (bot, msg, form) => {
    const text =
        `Step 1: Copy your ID link:\nwww.${msg.chat.id}.com\n\nStep 2: Add the new project here:\n${form}` // google form URL
    await bot.sendMessage(msg.chat.id, text);
    return
}

const genPickProjectHandler = async (bot, msg, source) => {
    let opts, text;
    const open_projects = await genAllOpenProjectsWithSource(source)
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

const genLeaveHandler = async (bot, msg) => {
    const text = await genEmployeeLogout(msg.chat.id)
    await bot.sendMessage(msg.chat.id, text)
    return
}

const genProjectPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project_name = respace(regex[2])
    try {
        const menu = await genMenuForProjectPicked(project_id)
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

const genSendForManagerReviewFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const status = (await genProjectWithId(project_id)).getStatus()
    let text, options
    if (status == project_status.SALES_REVIEW_1) {
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
const genUploadBoMFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const bom = (await genProjectWithId(project_id)).getBoM()
    let text, options
    if (bom == '' || bom == null) {
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

const genDownloadBoMFromRegexHandler = async (bot, msg, regex) => {
    try {
        const project_id = regex[1]
        const BoM_file_id = (await genProjectWithId(project_id)).getBoM()
        const channel_msg = await sales_bot.sendDocument(env_config.service.efsec_admin_chat_id, BoM_file_id)
        await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
    } catch (error) {
        functions.logger.warn("error\n" + error)
    }
    return
}

const genDownloadBoQFromRegexHandler = async (bot, msg, regex) => {
    try {
        const project_id = regex[1]
        const BoQ_file_id = (await genProjectWithId(project_id)).getBoQ()
        const channel_msg = await procurement_bot.sendDocument(env_config.service.efsec_admin_chat_id, BoQ_file_id)
        await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
        await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
    } catch (error) {
        functions.logger.warn("error\n" + error)
    }
    return
}

// TODO check uploaded file is pdf
const genUploadBoQFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const boq = (await genProjectWithId(project_id)).getBoQ()
    let text, options
    if (boq == '' || boq == null) {
        text = `Reply to this text with attached file (note: must be pdf or excel). Doing so will notify sales department.\nprojectId: ${project_id}`
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = "Prices already uploaded."
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}

const genChangeProjectStatusHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await genProjectWithId(project_id)
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

const genStatusPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_status = regex[2]
    const text = await genUpdateProject(project_id, { 'status': new_status })
    await bot.sendMessage(msg.chat.id, text);
    return
}

const genPaymentModePickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_mode = regex[2]
    const text = await genUpdateProject(project_id, { 'paymentMode': new_mode })
    await bot.sendMessage(msg.chat.id, text);
    return
}

// TODO contract amount needs to be int ONLY check
const genAddOrUpdateContractAmountHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await genProjectWithId(project_id)
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
const genAddOrUpdateDeliverByHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await genProjectWithId(project_id)
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
const genAddOrUpdateExpectPaymentDateHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await genProjectWithId(project_id)
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

const genAddOrUpdatePaymentModeHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await genProjectWithId(project_id)
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

const genViewBoMsHandler = async (bot, msg) => {
    var open_projects_with_BoM = await genAllOpenProjectsWithStatus(project_status.PROCUREMENT_REVIEW)
    if (open_projects_with_BoM) {
        // TODO error handling for when projects with status PROCUREMENT_REVIEW dont have BoMs
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

const genViewBoQsHandler = async (bot, msg) => {
    var open_projects_with_BoQ = await genAllOpenProjectsWithStatus(project_status.SALES_REVIEW_1)
    if (open_projects_with_BoQ) {
        // TODO error handling for when projects with status SALES_REVIEW_1 dont have BoQs
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

const genSendMarginsHandler = async (bot, msg) => {
    var open_projects_with_BoQ = await genAllOpenProjectsWithStatus(project_status.SALES_REVIEW_1);
    if (open_projects_with_BoQ) {
        // TODO error handling for when projects with status SALES_REVIEW_1 dont have BoQs
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


const genSendPricesHandler = async (bot, msg) => {
    var open_projects_with_BoM = await genAllOpenProjectsWithStatus(project_status.PROCUREMENT_REVIEW)
    if (open_projects_with_BoM) {
        // TODO error handling for when projects with status PROCUREMENT_REVIEW dont have BoMs
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

const genSendBoMsHandler = async (bot, msg) => {
    var open_projects_with_no_BoM = await genAllOpenProjects()
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

const genPriceForClientsHandler = async (bot, msg) => {

    var open_projects_with_revised_BoQ = await genAllOpenProjectsWithStatus(project_status.SALES_REVIEW_2);
    if (open_projects_with_revised_BoQ) {
        open_projects_with_revised_BoQ
            .forEach(async (project) => {
                const revised_BoQ_file_id = project.getRevisedBoQ()
                const channel_msg = await sales_bot.sendDocument(env_config.service.efsec_admin_chat_id, revised_BoQ_file_id)
                await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
                await bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
            });
        await bot.sendMessage(msg.chat.id, "Remember to change project status to pennding after sending PI to client.")
    } else {
        await bot.sendMessage(msg.chat.id, "There are no prices ready for client.")
    }
    return
}

async function genLoginFromRegex(bot, msg, password) {
    const user_id = msg.chat.id
    if (password == '') {
        await bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /login followed by your password. \nEx: /login Pass1234!');
    } else {
        try {
            const { success, remark } = await genEmployeeLogin(user_id, password, access_to.SALES)
            let options
            if (success) {
                options = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: levelCommands.main_menu
                    }),
                    chat_id: msg.chat.id,
                    message_id: msg.message_id,
                };
            }
            await bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
            await bot.sendMessage(msg.chat.id, remark, options)
        } catch (error) {
            functions.logger.warn("Password Error: ", error)
            await bot.sendMessage(msg.chat.id, "Failed authenticating password. Try again.")
        }
    }
    return
}

async function genSignupFromRegex(bot, msg, password) {
    if (password == '') {
        await bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /signup followed by your password. \nEx: /signup Pass1234!');
    } else {
        const first_name = msg.from.first_name ? msg.from.first_name : '';
        const last_name = msg.from.last_name ? msg.from.last_name : '';
        var employeeData = {
            'firstName': first_name,
            'lastName': last_name,
            'password': password,
            'accessTo': [access_to.SALES],
            'status': 'pending'
        }
        text = await genAddEmployee(msg.chat.id, employeeData)
        await bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
        await bot.sendMessage(env_config.service.efsec_admin_chat_id, `New User: ${first_name + ' ' + last_name
            }. Wants access to ${access_to.SALES} bot.`) // notify admin
        await bot.sendMessage(msg.chat.id, text)
    }
    return
}

async function genLogoutFromRegex(bot, msg) {
    const user_id = msg.chat.id
    const text = await genEmployeeLogout(user_id)
    await bot.sendMessage(msg.chat.id, text);
    return
}

async function genHelpSalesFromRegex(bot, msg) {
    const text = 'Welcome to the EFSEC Sales tool. Below are the available commands.\n\
    \n/start can be used to access main menu. Be sure to login before using this command.\n\
    \n/login followed by password is used to login.\
    \nExample: /login Password00!\n\
    \n/signup - followed by password is used to sign up.\
    \nExample. /signup Password00!\n\
    \n/logout - is used to logout \n\
    \n\nEDITTING RECORDS:\n\
    \n/pickaproject is used to pick a project and proceed to actions menu.\
    \nIf you know your project\'s id, use /pickaproject followed by id to get straight to action menu.\
    \nExample /pickaproject 1234567\n\
    \n/pickabid is used to pick a bid and proceed to actions menu.\
    \nIf you know your bid\'s id, use /pickabid followed by id to get straight to action menu.\
    \nExample /pickabid 1234567\n\
    \n/pickasale is used to pick a retail sale and proceed to actions menu.\
    \nIf you know your sale\'s id, use /pickasale followed by id to get straight to action menu.\
    \nExample /pickasale 1234567\n\
    \n\nYOUR DAY TO DAY TOOLS:\n\
    \n/uploadBoM is used to upload Bill of Materials for existing projects.\n\
    \n/viewpricesfromprocurement is used to view all prices to send back to clients.\n\
    \n/uploadmarginsformanagerreview is used to send margins to management\n\
    \n/viewpricesreadyforclient is used to view prices ready to be sent to client.\n\
    \n/addnewproject is used to add a new project.\n\
    \n/addnewbid is used to add a new bid.\n\
    \n/addnewsale is used to add a new retail sale.\n'
    await bot.sendMessage(msg.chat.id, text)
    return
}

async function genHelpProcurementFromRegex(bot, msg) {
    const text = 'Welcome to the EFSEC Procurement tool.\n\
        \nIf you are logged in, you will recieve notifications of new BoMs.\n\
        \nBelow are the available commands:\n\
        \n/start can be used to access main menu. Be sure to login before using this command.\n\
        \n/login followed by password is used to login.\
        \nExample: /login Password00!\n\
        \n/signup - followed by password is used to sign up.\
        \nExample. /signup Password00!\n\
        \n/logout - is used to logout \n\
        \n/viewBoMs - is used to view open Bill of Materials\n\
        \n/sendprices - is used to upload prices for a BoM\n'
    bot.sendMessage(msg.chat.id, text)
    return
}

async function genStartFromRegex(bot, msg, access_requested) {
    const user_id = msg.chat.id
    const emp = await genEmployee(user_id)
    var text = `Welcome ${msg.from.first_name}. `
    let options
    if (emp) {
        if (emp.getSession() == 'live' && emp.getAccessTo().includes(access_requested)) {
            options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: levelCommands.main_menu
                })
            };
            text += 'Your session is active'
        } else {
            if (emp.getSession() != 'live') {
                text += `\nYour session is not live. Please use /login and your password to log in. \nEx: /login PASSWORD`
            } else if (!emp.getAccessTo().includes(access_requested)) {
                access_requested = access_requested.charAt(0).toUpperCase() + access_requested.slice(1)
                text += `\nYou don\'t have access to EFSEC ${access_requested} Bot. Speak to Admin to request access.`
            }
        }
    } else {
        text = 'Employee doesn\'t exist. Please sign up using /signup followed by your password \nExample. /signup Password00!\n'
    }
    await bot.sendMessage(msg.chat.id, text, options);
    return
}

async function genSalesMessageDistributer(bot, msg) {
    // get data passed by button clicked regex match
    const helpSalesFromRegex = msg.text.match(/\/help/)
    const startSalesFromRegex = msg.text.match(/\/start/)
    const signupFromRegex = msg.text.match(/\/signup(.*)/)
    const loginFromRegex = msg.text.match(/\/login(.*)/)
    const logoutFromRegex = msg.text.match(/\/logout/)
    const addNewProjectFromRegex = msg.text.match(/\/addnewproject/)
    const addNewBidFromRegex = msg.text.match(/\/addnewbid/)
    const addNewSaleFromRegex = msg.text.match(/\/addnewsale/)
    const uploadBoM = msg.text.match(/\/uploadBoM/)
    const viewPricesFromProcurementFromRegex = msg.text.match(/\/viewpricesfromprocurement/)
    const viewPricesReadyForClientsFromRegex = msg.text.match(/\/viewpricesreadyforclient/)
    const uploadMarginsForManagerReviewFromRegex = msg.text.match(/\/uploadmarginsformanagerreview/)
    const pickaProjectFromRegex = msg.text.match(/\/pickaproject(.*)/)
    const pickaBidFromRegex = msg.text.match(/\/pickabid(.*)/)
    const pickaSaleFromRegex = msg.text.match(/\/pickasale(.*)/)

    if (helpSalesFromRegex) {
        await genHelpSalesFromRegex(bot, msg)
    } else if (startSalesFromRegex) {
        await genStartFromRegex(bot, msg, access_to.SALES)
    } else if (signupFromRegex) {
        const password = signupFromRegex[1].trim()
        await genSignupFromRegex(bot, msg, password)
    } else if (loginFromRegex) {
        const password = loginFromRegex[1].trim()
        await genLoginFromRegex(bot, msg, password)
    } else if (logoutFromRegex) {
        await genLogoutFromRegex(bot, msg)
    } else if (addNewProjectFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'add_project')
    } else if (addNewBidFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'add_bid')
    } else if (addNewSaleFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'add_sale')
    } else if (uploadBoM) {
        await genCallbackQueryDistributer(bot, msg, 'send_bom')
    } else if (viewPricesFromProcurementFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'view_boqs')
    } else if (viewPricesReadyForClientsFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'prices_ready_for_client')
    } else if (uploadMarginsForManagerReviewFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'send_margins_for_review')
    } else if (pickaProjectFromRegex) {
        const project_id = pickaProjectFromRegex[1].trim()
        if (project_id == '' || project_id === null) {
            await genCallbackQueryDistributer(bot, msg, 'pick_project')
        } else {
            functions.logger.log('/pickaproject called with id ', project_id)
            // await genCallbackQueryDistributer(bot, msg, genMenuForProjectPicked@${project_id}@${project_id}`) TODO
        }
    } else if (pickaBidFromRegex) {
        const bid_id = pickaBidFromRegex[1].trim()
        if (bid_id == '' || bid_id === null) {
            await genCallbackQueryDistributer(bot, msg, 'pick_bid')
        } else {
            functions.logger.log('/pickabid called with id ', bid_id)
            // await genCallbackQueryDistributer(bot, msg, `bidPicked@${bid_id}@${bid_id}`) TODO
        }
    } else if (pickaSaleFromRegex) {
        const sale_id = pickaSaleFromRegex[1].trim()
        if (sale_id == '' || sale_id === null) {
            await genCallbackQueryDistributer(bot, msg, 'pick_sale')
        } else {
            functions.logger.log('/pickasale called with id ', sale_id)
            // await genCallbackQueryDistributer(bot, msg, `salePicked@${sale_id}@${sale_id}`) TODO
        }
    } else {
        await bot.sendMessage(msg.chat.id, 'Unrecognized command')
    }
    return
}

async function genProcurementMessageDistributer(bot, msg) {
    const helpProcurementFromRegex = msg.text.match(/\/help/)
    const startProcurementFromRegex = msg.text.match(/\/start/)
    const signupFromRegex = msg.text.match(/\/signup(.*)/)
    const loginFromRegex = msg.text.match(/\/login(.*)/)
    const logoutFromRegex = msg.text.match(/\/logout/)
    const viewBoMsFromRegex = msg.text.match(/\/viewBoMs/)
    const sendPricesFromRegex = msg.text.match(/\/sendprices/)

    if (helpProcurementFromRegex) {
        await genHelpProcurementFromRegex(bot, msg)
    } else if (startProcurementFromRegex) {
        await genStartFromRegex(bot, msg, access_to.PROCUREMENT)
    } else if (signupFromRegex) {
        const password = signupFromRegex[1].trim()
        await genSignupFromRegex(bot, msg, password)
    } else if (loginFromRegex) {
        const password = loginFromRegex[1].trim()
        await genLoginFromRegex(bot, msg, password)
    } else if (logoutFromRegex) {
        await genLogoutFromRegex(bot, msg)
    } else if (viewBoMsFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'view_boms')
    } else if (sendPricesFromRegex) {
        await genCallbackQueryDistributer(bot, msg, 'send_prices')
    } else {
        await bot.sendMessage(msg.chat.id, 'Unrecognized command')
    }
    return
}

async function genReplyDistributer(bot, msg) {
    const [oldText, project_id] = msg.reply_to_message.text.split('projectId: ')
    let text;

    switch (oldText.trim()) {
        case 'Reply to this text with attached file (note: must be pdf or excel). Doing so will notify management.': // coming from sales_review_1
            try {
                await genUpdateProject(project_id, { 'BoQ_revised': msg.document.file_id })
                text = await genUpdateProject(project_id, { 'status': project_status.MANAGER_REVIEW })
                await bot.sendMessage(msg.chat.id, text + '. Waiting for manager\'s review')

                const trello_card = (await genProjectWithId(project_id)).getTrelloCardId()
                await genTrelloMoveCardFromListtoList(trello_card, project_status_to_trello_idList_map[project_status.MANAGER_REVIEW])
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this text with attached file (note: must be pdf or excel). Doing so will notify procurement department.':
            try {
                await genUpdateProject(project_id, { 'BoM': msg.document.file_id })
                text = await genUpdateProject(project_id, { 'status': project_status.PROCUREMENT_REVIEW })
                await bot.sendMessage(msg.chat.id, text + '. Waiting for precurement to send prices.')

                const trello_card = (await genProjectWithId(project_id)).getTrelloCardId()
                await genTrelloMoveCardFromListtoList(trello_card, project_status_to_trello_idList_map[project_status.PROCUREMENT_REVIEW])
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this text with attached file (note: must be pdf or excel). Doing so will notify sales department.':
            try {
                await genUpdateProject(project_id, { 'BoQ': msg.document.file_id })
                text = await genUpdateProject(project_id, { 'status': project_status.SALES_REVIEW_1 })
                await bot.sendMessage(msg.chat.id, text + '. Waiting review from sales dept.')

                const trello_card = (await genProjectWithId(project_id)).getTrelloCardId()
                await genTrelloMoveCardFromListtoList(trello_card, project_status_to_trello_idList_map[project_status.SALES_REVIEW_1])
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this message with new amount.':
            try {
                text = await genUpdateProject(project_id, { 'contractAmount': msg.text })
                await bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this message with new deliver date (DD-MM-YYYY).':
            try {
                text = await genUpdateProject(project_id, { 'deliverBy': msg.text })
                await bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this message with new expected payment date (DD-MM-YYYY).':
            try {
                text = await genUpdateProject(project_id, { 'expectPaymentBy': msg.text })
                await bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        default:
            await bot.sendMessage(msg.chat_id, 'Reply unrecognized')
            break
    }
    return
}

async function genCallbackQueryDistributer(bot, msg, action) {
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
        await genProjectPickedHandler(bot, msg, projectPickedFromRegex)
    } else if (uploadBoMFromRegex !== null) {
        await genUploadBoMFromRegexHandler(bot, msg, uploadBoMFromRegex)
    } else if (uploadBoQFromRegex !== null) {
        await genUploadBoQFromRegexHandler(bot, msg, uploadBoQFromRegex)
    } else if (downloadBoMFromRegex !== null) {
        await genDownloadBoMFromRegexHandler(bot, msg, downloadBoMFromRegex)
    } else if (downloadBoQFromRegex !== null) {
        await genDownloadBoQFromRegexHandler(bot, msg, downloadBoQFromRegex)
    } else if (sendForManagerReviewFromRegex !== null) {
        await genSendForManagerReviewFromRegexHandler(bot, msg, sendForManagerReviewFromRegex)
    } else if (changeProjectStatusFromRegex !== null) {
        await genChangeProjectStatusHandler(bot, msg, changeProjectStatusFromRegex)
    } else if (statusPickedFromRegex !== null) {
        await genStatusPickedHandler(bot, msg, statusPickedFromRegex)
    } else if (addOrUpdateContractAmountFromRegex !== null) {
        await genAddOrUpdateContractAmountHandler(bot, msg, addOrUpdateContractAmountFromRegex)
    } else if (addOrUpdateDeliverByFromRegex !== null) {
        await genAddOrUpdateDeliverByHandler(bot, msg, addOrUpdateDeliverByFromRegex)
    } else if (addOrUpdateExpectPaymentDateFromRegex !== null) {
        await genAddOrUpdateExpectPaymentDateHandler(bot, msg, addOrUpdateExpectPaymentDateFromRegex)
    } else if (addPaymentModeFromRegex !== null) {
        await genAddOrUpdatePaymentModeHandler(bot, msg, addPaymentModeFromRegex)
    } else if (paymentModePickedFromRegex !== null) {
        await genPaymentModePickedHandler(bot, msg, paymentModePickedFromRegex)
    }

    else {
        // regex not matched aka no external data passed
        switch (action) {
            case 'add_items_sale':
                await genSendGoogleForm(bot, msg, env_config.service.sales_item_form_link)
                break
            case 'add_bid':
                await genSendGoogleForm(bot, msg, env_config.service.sales_bid_form_link)
                break
            case 'add_project':
                await genSendGoogleForm(bot, msg, env_config.service.sales_project_forms_link)
                break
            case 'pick_project':
                await genPickProjectHandler(bot, msg, project_source.PROJECT)
                break
            case 'pick_sale':
                await genPickProjectHandler(bot, msg, project_source.RETAIL)
                break
            case 'pick_bid':
                await genPickProjectHandler(bot, msg, project_source.BID)
                break
            case 'send_bom':
                await genSendBoMsHandler(bot, msg)
                break
            case 'view_boms':
                await genViewBoMsHandler(bot, msg)
                break
            case 'view_boqs':
                await genViewBoQsHandler(bot, msg)
                break
            case 'send_prices':
                await genSendPricesHandler(bot, msg)
                break
            case 'send_margins_for_review':
                await genSendMarginsHandler(bot, msg)
                break
            case 'prices_ready_for_client':
                await genPriceForClientsHandler(bot, msg)
                break
            case 'leave':
                genLeaveHandler(bot, msg)
                break
            default:
                await bot.sendMessage(msg.chat.id, 'functionality not implemented');
                break
        }
    }
    return
}

module.exports = {
    genCallbackQueryDistributer,
    genProcurementMessageDistributer,
    genReplyDistributer,
    genSalesMessageDistributer,
}
