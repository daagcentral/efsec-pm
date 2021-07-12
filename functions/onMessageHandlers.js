const levelCommands = require('./levelcommands')
const { callbackQueryDistributer } = require('./onCallbackQueryUtils')
const { addEmployee, employeeLogout, getEmployee, employeeLogin } = require('./controllers/employeeController')
const { project_status, access_to } = require('./enums')
const { updateProject } = require('./controllers/projectController')

async function genLoginFromRegex(bot, msg, password) {
    const user_id = msg.chat.id
    if (password == '') {
        await bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /login followed by your password. \nEx: /login Pass1234!');
    } else {
        const { success, remark } = await employeeLogin(user_id, password, access_to.SALES)
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
    }
    return
}

async function genSignupFromRegex(bot, msg) {
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
        text = await addEmployee(msg.chat.id, employeeData)
        await bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
        await bot.sendMessage(env_config.service.efsec_admin_chat_id, `New User: ${first_name + ' ' + last_name
            }. Wants access to ${access_to.SALES} bot.`) // notify admin
        await bot.sendMessage(msg.chat.id, text)
    }
    return
}

async function genLogoutFromRegex(bot, msg) {
    const user_id = msg.chat.id
    const text = await employeeLogout(user_id)
    await bot.sendMessage(msg.chat.id, text);
    return
}

async function onSalesMessageDistributer(bot, msg) {
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
    } else if (startSalesFromRegex) {
        const user_id = msg.chat.id
        const emp = await getEmployee(user_id)
        var text = `Welcome ${msg.from.first_name}. `
        let options
        if (emp) {
            if (emp.getSession() == 'live' && emp.getAccessTo().includes(access_to.SALES)) {
                options = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: levelCommands.main_menu
                    })
                };
                text += 'Your session is active'
            } else {
                if (emp.getSession() != 'live') {
                    text += `\nYour session is not live. Please use /login and your password to log in. \nEx: /login PASSWORD`
                } else if (!emp.getAccessTo().includes(access_to.SALES)) {

                    text += '\nYou don\'t have access to EFSEC Sales Bot. Speak to Admin to request access.'
                }

            }

        } else {
            text = 'Employee doesn\'t exist. Please sign up using /signup followed by your password \nExample. /signup Password00!\n'
        }
        await bot.sendMessage(msg.chat.id, text, options);
        return
    } else if (signupFromRegex) {
        const password = signupFromRegex[1].trim()
        await genSignupFromRegex(bot, msg, password)
        return
    } else if (loginFromRegex) {
        const password = loginFromRegex[1].trim()
        await genLoginFromRegex(bot, msg, password)
        return
    } else if (logoutFromRegex) {
        await genLogoutFromRegex(bot, msg)
        return
    } else if (addNewProjectFromRegex) {
        await callbackQueryDistributer(bot, msg, 'add_project')
        return
    } else if (addNewBidFromRegex) {
        await callbackQueryDistributer(bot, msg, 'add_bid')
        return
    } else if (addNewSaleFromRegex) {
        await callbackQueryDistributer(bot, msg, 'add_sale')
        return
    } else if (uploadBoM) {
        await callbackQueryDistributer(bot, msg, 'send_bom')
        return
    } else if (viewPricesFromProcurementFromRegex) {
        await callbackQueryDistributer(bot, msg, 'view_boqs')
        return
    } else if (viewPricesReadyForClientsFromRegex) {
        await callbackQueryDistributer(bot, msg, 'prices_ready_for_client')
        return
    } else if (uploadMarginsForManagerReviewFromRegex) {
        await callbackQueryDistributer(bot, msg, 'send_margins_for_review')
        return
    } else if (pickaProjectFromRegex) {
        const project_id = pickaProjectFromRegex[1].trim()
        if (project_id == '' || project_id === null) {
            await callbackQueryDistributer(bot, msg, 'pick_project')
        } else {
            functions.logger.log('/pickaproject called with id ', project_id)
            // await callbackQueryDistributer(bot, msg, `projectPicked@${project_id}@${project_id}`) TODO
        }
        return
    } else if (pickaBidFromRegex) {
        const bid_id = pickaBidFromRegex[1].trim()
        if (bid_id == '' || bid_id === null) {
            await callbackQueryDistributer(bot, msg, 'pick_bid')
        } else {
            functions.logger.log('/pickabid called with id ', bid_id)
            // await callbackQueryDistributer(bot, msg, `bidPicked@${bid_id}@${bid_id}`) TODO
        }
        return
    } else if (pickaSaleFromRegex) {
        const sale_id = pickaSaleFromRegex[1].trim()
        if (sale_id == '' || sale_id === null) {
            await callbackQueryDistributer(bot, msg, 'pick_sale')
        } else {
            functions.logger.log('/pickasale called with id ', sale_id)
            // await callbackQueryDistributer(bot, msg, `salePicked@${sale_id}@${sale_id}`) TODO
        }
        return
    } else {
        await bot.sendMessage(msg.chat.id, 'Unrecognized command')
        return
    }
}

async function onProcurementMessageDistributer(bot, msg) {
    const helpProcurementFromRegex = msg.text.match(/\/help/)
    const startProcurementFromRegex = msg.text.match(/\/start/)
    const signupFromRegex = msg.text.match(/\/signup(.*)/)
    const loginFromRegex = msg.text.match(/\/login(.*)/)
    const logoutFromRegex = msg.text.match(/\/logout/)
    const viewBoMsFromRegex = msg.text.match(/\/viewBoMs/)
    const sendPricesFromRegex = msg.text.match(/\/sendprices/)

    if (helpProcurementFromRegex) {
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
    } else if (startProcurementFromRegex) {
        const user_id = msg.chat.id
        const emp = await getEmployee(user_id)
        var text = `Welcome ${msg.from.first_name}. `
        let options
        if (emp) {
            if (emp.getSession() == 'live' && emp.getAccessTo().includes(access_to.PROCUREMENT)) {
                options = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: levelCommands.main_menu_procurement
                    })
                };
                text += 'Your session is active'
            } else {
                if (emp.getSession() != 'live') {
                    text += `\nYour session is not live. Please use /login and your password to log in. \nEx: /login PASSWORD`
                } else if (!emp.getAccessTo().includes(access_to.PROCUREMENT)) {
                    text += '\nYou don\'t have access to EFSEC Procurement Bot. Speak to Admin to request access.'
                }
            }
        } else {
            text = 'Employee doesn\'t exist. Please sign up using /signup followed by your password \nExample. /signup Password00!\n'
        }
        bot.sendMessage(msg.chat.id, text, options);
        return
    } else if (signupFromRegex) {
        const password = signupFromRegex[1].trim()
        await genSignupFromRegex(bot, msg, password)
        return
    } else if (loginFromRegex) {
        const password = loginFromRegex[1].trim()
        await genLoginFromRegex(bot, msg, password)
        return
    } else if (logoutFromRegex) {
        await genLogoutFromRegex(bot, msg)
        return
    } else if (viewBoMsFromRegex) {
        await callbackQueryDistributer(bot, msg, 'view_boms')
        return
    } else if (sendPricesFromRegex) {
        await callbackQueryDistributer(bot, msg, 'send_prices')
        return
    } else {
        await bot.sendMessage(msg.chat.id, 'Unrecognized command')
        return
    }
}

async function onReplyDistributer(bot, msg) {
    const [oldText, project_id] = msg.reply_to_message.text.split('projectId: ')
    let text;

    switch (oldText.trim()) {
        case 'Reply to this text with attached file (note: must be pdf or excel). Doing so will notify management.': // coming from sales_review_1
            try {
                await updateProject(project_id, { 'BoQ_revised': msg.document.file_id })
                text = await updateProject(project_id, { 'status': project_status.MANAGER_REVIEW })
                // TODO trello update card to MANAGER_REVIEW
                await bot.sendMessage(msg.chat.id, text + '. Waiting for manager\'s review')
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this text with attached file (note: must be pdf or excel). Doing so will notify procurement department.':
            try {
                await updateProject(project_id, { 'BoM': msg.document.file_id })
                text = await updateProject(project_id, { 'status': project_status.PROCUREMENT_REVIEW })
                // TODO trello update card to PROCUREMENT_REVIEW
                await bot.sendMessage(msg.chat.id, text + '. Waiting for precurement to send prices.')
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this text with attached file (note: must be pdf or excel). Doing so will notify sales department.':
            try {
                await updateProject(project_id, { 'BoQ': msg.document.file_id })
                text = await updateProject(project_id, { 'status': project_status.SALES_REVIEW_1 })
                // TODO trello update card to SALES_REVIEW
                await bot.sendMessage(msg.chat.id, text + '. Waiting review from sales dept.')
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this message with new amount.':
            try {
                text = await updateProject(project_id, { 'contractAmount': msg.text })
                await bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this message with new deliver date (DD-MM-YYYY).':
            try {
                text = await updateProject(project_id, { 'deliverBy': msg.text })
                await bot.sendMessage(msg.chat.id, text)
            } catch (error) {
                functions.logger.warn('error\n' + error)
                await bot.sendMessage(msg.chat.id, 'Failed. Try again')
            }
            break
        case 'Reply to this message with new expected payment date (DD-MM-YYYY).':
            try {
                text = await updateProject(project_id, { 'expectPaymentBy': msg.text })
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
module.exports = {
    onSalesMessageDistributer,
    onProcurementMessageDistributer,
    onReplyDistributer,
}