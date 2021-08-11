const levelCommands = require('../levelcommands')
const { unixTimeConverter } = require("./utils")
const {
    genAddEmployee,
    genEmployeeLogout,
    genEmployee,
    genEmployeeLogin
} = require('../controllers/employeeController')
const {
    genAllOpenProjectsWithStatus,
    genOpenProjectsWithFileType,
    genProjectWithId,
    genProjectWithPINum,
    genUpdateProject,
    genAddFileToProject
} = require('../controllers/projectController')
const {
    genTrelloMoveCardFromListtoList,
    genTrelloAddUpdateToDescription
} = require('../controllers/trelloController')
const {
    generateProjectListForStatusChange,
    generateProjectListForSendOrViewDoc,
    document_types,
    generateProjectStatusOptions,
    generatePaymentModeOptions,
    genMenuForProjectPicked
} = require('../levelcommands')
const {
    access_to,
    project_status,
} = require('../values/enums')
const { project_status_to_trello_idList_map } = require('../values/maps')
const { respace } = require('../controllers/utils/modelUtils')
const {
    sales_bot
} = require('../bots')

const genSendGoogleForm = (bot, msg, form) => {
    const text =
        `Step 1: Copy your ID link:\nwww.${msg.chat.id}.com\n\nStep 2: Add the new project here:\n${form}` // google form URL
    bot.sendMessage(msg.chat.id, text);
    return
}


const genPickInitProjectHandler = async (bot, msg) => {
    let opts, text;
    const open_projects = await genAllOpenProjectsWithStatus(project_status.INIT)
    if (open_projects) {
        const open_projects_list = generateProjectListForStatusChange(open_projects, msg.chat.id)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: open_projects_list
            })
        };
        text = '\nSelect one \n';
    } else {
        text = `No open projects`
    }
    bot.sendMessage(msg.chat.id, text, opts);
    return
}

const genLeaveHandler = async (bot, msg) => {
    const text = await genEmployeeLogout(msg.chat.id)
    bot.sendMessage(msg.chat.id, text)
    return
}

const genProjectPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    try {
        const source = (await genProjectWithId(project_id)).getSource()
        const menu = genMenuForProjectPicked(project_id, source)
        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: menu
            }),
        };
        bot.sendMessage(msg.chat.id, "Select one...", options);
    } catch (error) {
        functions.logger.error("error\n" + error)
        bot.sendMessage(msg.chat.id, 'Failed to get info on project. Make sure the id is correct')
    }
    return
}

const genSendForManagerReviewFromRegexHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const status = (await genProjectWithId(project_id)).getStatus()
    let text, options
    if (status == project_status.SALES_REVIEW_1) {
        text = `Reply to this text with attached file (note: file must be pdf, excel, or photo). Doing so will notify management.\nprojectId: ${project_id}`
        options = {
            reply_markup: JSON.stringify({
                force_reply: true,
            })
        };
    } else {
        text = 'Prices already sent for review'
    }
    bot.sendMessage(msg.chat.id, text, options);
    return
}

const genChangeProjectStatusHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const project = await genProjectWithId(project_id)
    const text = `Current status for ${respace(project.getProjectTitle())} is ${project.getStatus()}. Change it to:`
    const menu = generateProjectStatusOptions(project.getId(), project.getStatus(), msg.chat.id)
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: menu
        }),
    }
    bot.sendMessage(msg.chat.id, text, options);
    return
}

const genStatusPickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_status = regex[2]
    const project = await genProjectWithId(project_id)
    const idCard = project.getTrelloCardId()
    const old_status = project.getStatus()
    const text = await genUpdateProject(project_id, { 'status': new_status })
    const employeeName = (await genEmployee(msg.chat.id)).getFirstName()
    await genTrelloAddUpdateToDescription(idCard, `Status changed by ${employeeName} on ${unixTimeConverter(msg.date)} from ${old_status} to ${new_status}`)
    genTrelloMoveCardFromListtoList(idCard, project_status_to_trello_idList_map[new_status])
    bot.sendMessage(msg.chat.id, text);
    return
}

const genPaymentModePickedHandler = async (bot, msg, regex) => {
    const project_id = regex[1]
    const new_mode = regex[2]
    const text = await genUpdateProject(project_id, { 'paymentMode': new_mode })
    bot.sendMessage(msg.chat.id, text);
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
    bot.sendMessage(msg.chat.id, text, options)
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
    bot.sendMessage(msg.chat.id, text, options)
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
    await bot.sendMessage(msg.chat.id, text)
    text = `Reply to this message with new expected payment date (DD-MM-YYYY).\nprojectId: ${project_id}`
    const options = {
        reply_markup: JSON.stringify({
            force_reply: true
        })
    };
    bot.sendMessage(msg.chat.id, text, options)
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
    bot.sendMessage(msg.chat.id, text, options);
    return
}

const genPIFromRegexHandler = async (bot, msg, pi_num) => {
    try {
        const project = await genProjectWithPINum(parseInt(pi_num)) // there's only one of this
        if (project) {
            const owner = (await genEmployee(project.getOwner())).getFirstName()
            await bot.sendMessage(msg.chat.id, `ID: ${project.getId()}\nTitle: ${respace(project.getProjectTitle())}\nOwner: ${owner}`)
            genCallbackQueryDistributer(bot, msg, `view@proforma@${project.getId()}`)
        } else {
            bot.sendMessage(msg.chat.id, `No project with PI # ${pi_num}`)
        }
    } catch (error) {
        functions.logger.error(error)
    }
    return
}

const genViewDocFromRegexHandler = async (bot, msg, doc_type, id) => {
    let channel_msg
    bot.sendChatAction(msg.chat.id, "upload_document")
    const docs = (await genProjectWithId(id)).getDoc(doc_type)
    if (docs.length === 0 || !docs) {
        bot.sendMessage(msg.chat.id, `${doc_type} not found`)
    } else {
        try {
            const doc_file_id = docs[docs.length - 1] // get latest doc
            try {
                channel_msg = await sales_bot.sendPhoto(env_config.service.efsec_admin_chat_id, doc_file_id)
                console.log("1", channel_msg)
            } catch (error) {
                channel_msg = await sales_bot.sendDocument(env_config.service.efsec_admin_chat_id, doc_file_id)
                console.log("2", channel_msg)
            }
            await bot.forwardMessage(msg.chat.id, channel_msg.chat.id, channel_msg.message_id)
            bot.deleteMessage(channel_msg.chat.id, channel_msg.message_id)
        } catch (error) {
            functions.logger.error("error\n" + error)
            bot.sendMessage(msg.chat.id, "Failed. Try again.")
        }
        return
    }
}

const genSendDocFromRegexHandler = (bot, msg, doc_type, id) => {
    let text, options

    text = `Reply to this text with attached ${doc_type} (note: file must be pdf, excel, or photo).\nprojectId: ${id}`
    options = {
        reply_markup: JSON.stringify({
            force_reply: true,
        })
    };

    bot.sendMessage(msg.chat.id, text, options);
    return
}
const genViewOrSendDoc = async (bot, msg, doc_type, view_or_send) => {
    let open_projects, text, opts

    switch (view_or_send) {
        case 'view':
            open_projects = await genOpenProjectsWithFileType(doc_type)
            break
        case 'send':
            open_projects = await genAllOpenProjectsWithStatus(project_status.INIT)
            break
        default:
            break
    }
    if (open_projects) {
        const menu = generateProjectListForSendOrViewDoc(open_projects, view_or_send, doc_type, msg.chat.id)
        opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: menu
            })
        };
        text = `${view_or_send} ${doc_type} for...`
    } else {
        text = `There are no open projects to ${view_or_send} ${doc_type}`
    }
    bot.sendMessage(msg.chat.id, text, opts);
    return
}


const genDocPicker = (bot, msg, view_or_send) => {
    try {
        const opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: document_types(view_or_send)
            })
        };
        bot.sendMessage(msg.chat.id, 'Select type', opts);
    } catch (error) {
        functions.logger.log(error)
        bot.sendMessage(msg.chat.id, 'Failed. Try again');
    }
    return
}

async function genLoginFromRegex(bot, msg, password) {
    const user_id = msg.chat.id
    if (password == '') {
        bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /login followed by your password. \nEx: /login Pass1234!');
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
            bot.sendMessage(msg.chat.id, remark, options)
        } catch (error) {
            functions.logger.error("Password Error: ", error)
            bot.sendMessage(msg.chat.id, "Failed authenticating password. Try again.")
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
        bot.sendMessage(env_config.service.efsec_admin_chat_id, `New User: ${first_name + ' ' + last_name
            }. Wants access to ${access_to.SALES} bot.`) // notify admin
        bot.sendMessage(msg.chat.id, text)
    }
    return
}

async function genLogoutFromRegex(bot, msg) {
    const user_id = msg.chat.id
    const text = await genEmployeeLogout(user_id)
    bot.sendMessage(msg.chat.id, text);
    return
}

function genHelpSalesFromRegex(bot, msg) {
    const text = 'Welcome to the EFSEC Sales tool. Below are the available commands.\n\
    \n/start can be used to access main menu. Be sure to login before using this command.\n\
    \n/login followed by password is used to login.\
    \nExample: /login Password00!\n\
    \n/signup - followed by password is used to sign up.\
    \nExample. /signup Password00!\n\
    \n/logout - is used to logout \n\
    \n\nYOUR DAY TO DAY TOOLS:\n\
    \n/getproforma followed by proforma number sends informations about proforma\
    \nExample: /getproforma 122\n'
    bot.sendMessage(msg.chat.id, text)
    return
}

function genHelpProcurementFromRegex(bot, msg) {
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
    let options
    var text = `Welcome ${msg.from.first_name}. `
    if (user_id === 1932113257) { // reporting personnel
        genSendGoogleForm(bot, msg, 'https://forms.gle/nt245cLFZW2XbpjEA')
        return
    }
    const emp = await genEmployee(user_id)
    if (emp) {
        if (emp.getSession() == 'live' && emp.getAccessTo().includes(access_requested)) {
            options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: levelCommands.main_menu_for(access_requested)
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
    bot.sendMessage(msg.chat.id, text, options);
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
    const viewPricesReadyForClientsFromRegex = msg.text.match(/\/viewpricesreadyforclient/)
    const uploadMarginsForManagerReviewFromRegex = msg.text.match(/\/uploadmarginsformanagerreview/)
    const pickaProjectFromRegex = msg.text.match(/\/pickaproject(.*)/)
    const getPIFromRegex = msg.text.match(/\/getproforma(.*)/)

    if (helpSalesFromRegex) {
        genHelpSalesFromRegex(bot, msg)
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
    } else if (getPIFromRegex) {
        const pi_num = getPIFromRegex[1].trim()
        await genPIFromRegexHandler(bot, msg, pi_num)
    }
    else {
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
        genHelpProcurementFromRegex(bot, msg)
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
    var [oldText, project_id] = msg.reply_to_message.text.split('projectId: ')
    const doc_type = oldText.trim().split(' attached ')[1].split(' (note')[0]
    let text, document, trello_card_id;
    bot.sendChatAction(msg.chat.id, "typing")
    switch (oldText.trim()) {
        case 'Reply to this message with new amount.':
            try {
                text = await genUpdateProject(project_id, { 'contractAmount': msg.text })
                trello_card_id = (await genProjectWithId(project_id)).getTrelloCardId()
                const employeeName = (await genEmployee(msg.chat.id)).getFirstName()
                genTrelloAddUpdateToDescription(trello_card_id, `Contract amount updated by ${employeeName} on ${unixTimeConverter(msg.date)}. New amount is ${msg.text}`)
                bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.error(error)
                bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            return
        case 'Reply to this message with new deliver date (DD-MM-YYYY).':
            try {
                text = await genUpdateProject(project_id, { 'deliverBy': msg.text })
                trello_card_id = (await genProjectWithId(project_id)).getTrelloCardId()
                const employeeName = (await genEmployee(msg.chat.id)).getFirstName()
                genTrelloAddUpdateToDescription(trello_card_id, `Delivery date updated by ${employeeName} on ${unixTimeConverter(msg.date)}. New date is ${msg.text}`)
                bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.error(error)
                bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            return
        case 'Reply to this message with new expected payment date (DD-MM-YYYY).':
            try {
                text = await genUpdateProject(project_id, { 'expectPaymentBy': msg.text })
                trello_card_id = (await genProjectWithId(project_id)).getTrelloCardId()
                const employeeName = (await genEmployee(msg.chat.id)).getFirstName()
                genTrelloAddUpdateToDescription(trello_card_id, `Expected Payment Date updated by ${employeeName} on ${unixTimeConverter(msg.date)}. New date is ${msg.text}`)
                bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.error(error)
                bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            return

        case 'Reply to this message with attached proforma (note: file must be pdf, excel, or photo).':
            try {
                const project = await genProjectWithPINum(parseInt(project_id.split("#")[1]))
                project_id = project.getId()
                trello_card_id = project.getTrelloCardId()
                document = msg.document
                var photo = msg.photo
                if (document) file_id = document.file_id
                else if (photo) file_id = photo[3].file_id

                text = await genAddFileToProject(project_id, 'proforma', file_id)
                const file_link = `https://europe-west1-efsec-pm.cloudfunctions.net/genClientFile?file_id=${file_id}&from=sales`
                const employeeName = (await genEmployee(msg.chat.id)).getFirstName()
                genTrelloAddUpdateToDescription(trello_card_id, `Proforma added by ${employeeName} on ${unixTimeConverter(msg.date)}. Download: ${file_link}`)
                bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.error(error)
                bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            return
        default:
            break
    }
    document = msg.document ?? msg.photo
    if (document) {
        file_id = document.file_id
        try {
            text = await genAddFileToProject(project_id, doc_type, file_id)
            bot.sendMessage(msg.chat.id, text)
            trello_card_id = (await genProjectWithId(project_id)).getTrelloCardId()
            const employeeName = (await genEmployee(msg.chat.id)).getFirstName()
            const file_link = `https://europe-west1-efsec-pm.cloudfunctions.net/genClientFile?file_id=${file_id}&from=sales`
            genTrelloAddUpdateToDescription(
                trello_card_id,
                `${(doc_type.charAt(0).toUpperCase() + doc_type.slice(1)).replace("_", " ")} added by ${employeeName} on ${unixTimeConverter(msg.date)} Download: ${file_link}`
            )
        } catch (error) {
            functions.logger.error(error)
            bot.sendMessage(msg.chat.id, 'Failed. Try again')
        }
    } else {
        bot.sendMessage(msg.chat.id, 'Reply unrecognized')
    }
    return
}

async function genCallbackQueryDistributer(bot, msg, action) {

    // get data passed by button clicked regex match
    const projectPickedFromRegex = action.match(/projectPicked@(.*)/) // project id
    const statusPickedFromRegex = action.match(/statusPicked@(.*)@(.*)/) // project id @ status
    const paymentModePickedFromRegex = action.match(/paymentModePicked@(.*)@(.*)/) // project id @ paymentMode
    const sendForManagerReviewFromRegex = action.match(/send_for_manager_review@(.*)/) // project id
    const changeProjectStatusFromRegex = action.match(/change_project_status@(.*)/) // project id
    const addOrUpdateContractAmountFromRegex = action.match(/add_or_update_contract_amount@(.*)/) // project id
    const addPaymentModeFromRegex = action.match(/add_payment_mode@(.*)/) // project id
    const addOrUpdateDeliverByFromRegex = action.match(/add_or_update_deliver_by@(.*)/) // project id
    const addOrUpdateExpectPaymentDateFromRegex = action.match(/add_or_update_expect_payment_date@(.*)/) // project id
    const viewDocFromRegex = action.match(/view@(.*)@(.*)/) // doc type and id
    const sendDocFromRegex = action.match(/send@(.*)@(.*)/) // doc type and id
    const viewDocTypeFromRegex = action.match(/view@(.*)/) // doc type
    const sendDocTypeFromRegex = action.match(/send@(.*)/) // doc type
    if (projectPickedFromRegex !== null) {
        await genProjectPickedHandler(bot, msg, projectPickedFromRegex)
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
    } else if (viewDocFromRegex !== null) {
        const doc_type = viewDocFromRegex[1]
        const id = viewDocFromRegex[2]
        await genViewDocFromRegexHandler(bot, msg, doc_type, id)
    } else if (sendDocFromRegex !== null) {
        const doc_type = sendDocFromRegex[1]
        const id = sendDocFromRegex[2]
        genSendDocFromRegexHandler(bot, msg, doc_type, id)
    } else if (viewDocTypeFromRegex !== null) {
        const doc_type = viewDocTypeFromRegex[1]
        await genViewOrSendDoc(bot, msg, doc_type, 'view')
    } else if (sendDocTypeFromRegex !== null) {
        const doc_type = sendDocTypeFromRegex[1]
        await genViewOrSendDoc(bot, msg, doc_type, 'send')
    }

    else {
        // regex not matched aka no external data passed
        switch (action) {
            case 'add_project':
                genSendGoogleForm(bot, msg, env_config.service.sales_project_forms_link)
                break
            case 'send_doc':
                genDocPicker(bot, msg, 'send')
                break
            case 'view_doc':
                genDocPicker(bot, msg, 'view')
                break
            case 'change_status':
                await genPickInitProjectHandler(bot, msg)
                break
            case 'leave':
                genLeaveHandler(bot, msg)
                break
            default:
                bot.sendMessage(msg.chat.id, 'functionality not implemented');
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
