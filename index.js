
require('dotenv').config()
global.fetch = require("node-fetch");

const Employee = require('./models/employee');
const levelCommands = require('./levelcommands')
const { callbackQueryDistributer } = require('./onCallbackQueryUtils')
const { addEmployee, employeeLogout, getAllEmployees, getEmployee, updateEmployee, deleteEmployee, employeeLogin } = require('./controllers/employeeController')
const { access_to } = require('./enums')


// ########################### SALES BOT START ########################### //
const { sales_bot } = require('./bots')
sales_bot.on("polling_error", console.log);

sales_bot.onText(/\/help/, async function (msg) {
    const text = 'Welcome to the EFSEC Sales tool.\
    \n Below are the available commands \
    \n \
    \n/start can be used to access main menu. Be sure to login before using this command.\n\
    \n/login followed by password is used to login.\
    \nExample: /login Password00!\n\
    \n/signup - followed by password is used to sign up.\
    \nExample. /signup Password00!\n\
    \n/logout - is used to logout \n\
    \n/pickaproject is used to pick a project and proceed to actions menu.\
    \nIf you know your project\'s id, use /pickaproject followed by id to get straight to action menu.\
    \nExample /pickaproject 1234567\n\
    \n/addnewproject is used to add a new project.\n\
    \n/pickabid is used to pick a bid and proceed to actions menu.\
    \nIf you know your bid\'s id, use /pickabid followed by id to get straight to action menu.\
    \nExample /pickabid 1234567\n\
    \n/addnewbid is used to add a new bid.\n\
    \n/pickasale is used to pick a retail sale and proceed to actions menu.\
    \nIf you know your sale\'s id, use /pickasale followed by id to get straight to action menu.\
    \nExample /pickasale 1234567\n\
    \n/addnewsale is used to add a new retail sale.\n\
    \n/clear - is used to declutter 48 hours of operations\n'


    sales_bot.sendMessage(msg.chat.id, text)
})

sales_bot.onText(/\/start/, async function (msg) {
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
        text = 'Employee doesn\'t exist. Please sign up or talk to admin'
    }
    sales_bot.sendMessage(msg.chat.id, text, options);
})
//sales_bot.onText(/\/signup ((?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$)/, function(msg, match) {
sales_bot.onText(/\/signup(.*)/, async function (msg, match) {

    const password = match[1].trim()
    if (password == '') {
        sales_bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /signup followed by your password. \nEx: /signup Pass1234!');
    } else {
        const first_name = msg.from.first_name ? msg.from.first_name : '';
        const last_name = msg.from.last_name ? msg.from.last_name : '';
        var employeeData = {
            "firstName": first_name,
            "lastName": last_name,
            "password": password,
            "accessTo": [access_to.SALES],
            "status": 'pending'
        }
        text = await addEmployee(msg.chat.id, employeeData)
        sales_bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
        sales_bot.sendMessage(process.env.EFSEC_ADMIN_CHAT_ID, `New User: ${first_name + ' ' + last_name
            }. wants access to ${access_to.SALES} bot.`) // notify admin
        sales_bot.sendMessage(msg.chat.id, text)
    }
})

sales_bot.onText(/\/login(.*)/, async function (msg, match) {
    //  Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:
    const user_id = msg.chat.id
    const password = match[1].trim()

    if (password == '') {
        sales_bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /login followed by your password. \nEx: /login Pass1234!');
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
        sales_bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
        sales_bot.sendMessage(msg.chat.id, remark, options)
    }

})

sales_bot.onText(/\/logout/, async function (msg, match) {
    const user_id = msg.chat.id
    const text = await employeeLogout(user_id)
    sales_bot.sendMessage(msg.chat.id, text);
})

sales_bot.onText(/\/addnewproject/, async function (msg) {
    await callbackQueryDistributer(sales_bot, msg, 'add_project')
})

sales_bot.onText(/\/addnewbid/, async function (msg) {
    await callbackQueryDistributer(sales_bot, msg, 'add_bid')
})

sales_bot.onText(/\/addnewsale/, async function (msg) {
    await callbackQueryDistributer(sales_bot, msg, 'add_sale')
})

sales_bot.onText(/\/pickaproject(.*)/, async function (msg, match) {
    const project_id = match[1].trim()
    if (project_id == '' || project_id === null) {
        await callbackQueryDistributer(sales_bot, msg, 'pick_project')
    } else {
        console.log(project_id)
        // await callbackQueryDistributer(sales_bot, msg, `projectPicked@${project_id}@${project_id}`) TODO
    }
})

sales_bot.onText(/\/pickabid(.*)/, async function (msg, match) {
    const bid_id = match[1].trim()
    if (bid_id == '' || bid_id === null) {
        await callbackQueryDistributer(sales_bot, msg, 'pick_bid')
    } else {
        console.log(bid_id)
        // await callbackQueryDistributer(sales_bot, msg, `bidPicked@${bid_id}@${bid_id}`) TODO
    }
})

sales_bot.onText(/\/pickasale(.*)/, async function (msg, match) {
    const sale_id = match[1].trim()
    if (sale_id == '' || sale_id === null) {
        await callbackQueryDistributer(sales_bot, msg, 'pick_sale')
    } else {
        console.log(sale_id)
        // await callbackQueryDistributer(sales_bot, msg, `salePicked@${sale_id}@${sale_id}`) TODO
    }
})

sales_bot.onText(/\/clear/, async function (msg) {
    const chat_id = msg.chat.id
    const message_id = msg.message_id - 1
    const iteratable = Array(message_id - 0 + 1).fill().map((_, idx) => 0 + idx) // TODO 0 should be last cleared

    Promise.all(await iteratable.map(async (iter) => {
        try {
            await sales_bot.deleteMessage(chat_id, iter)
        } catch (error) {
            // do nothing
        }
    }))
})

sales_bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    await callbackQueryDistributer(sales_bot, msg, action)
});

// ########################### SALES BOT END ########################### //


// ######################## PROCUREMENT BOT END ######################## //
const { procurement_bot } = require('./bots')

procurement_bot.onText(/\/help/, async function (msg) {
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
    \n/sendprices - is used to upload prices for a BoM\n\
    \n/clear - is used to declutter 48 hours of operations\n\
    '
    procurement_bot.sendMessage(msg.chat.id, text)
})

procurement_bot.onText(/\/start/, async function (msg) {
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
        text = 'Employee doesn\'t exist. Please sign up or talk to admin'
    }
    procurement_bot.sendMessage(msg.chat.id, text, options);
})

//procurement_bot.onText(/\/signup ((?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$)/, function(msg, match) {
procurement_bot.onText(/\/signup(.*)/, async function (msg, match) {

    const password = match[1].trim()
    if (password == '') {
        procurement_bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /signup followed by your password. \nEx: /signup Pass1234!');
    } else {
        const first_name = msg.from.first_name ? msg.from.first_name : '';
        const last_name = msg.from.last_name ? msg.from.last_name : '';
        var employeeData = {
            "firstName": first_name,
            "lastName": last_name,
            "password": password,
            "accessTo": [access_to.PROCUREMENT],
            "status": 'pending'
        }
        text = await addEmployee(msg.chat.id, employeeData)

        procurement_bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
        procurement_bot.sendMessage(process.env.EFSEC_ADMIN_CHAT_ID, `New User: ${first_name + ' ' + last_name
            }. wants access to ${access_to.PROCUREMENT} bot.`) // notify admin
        procurement_bot.sendMessage(msg.chat.id, text)
    }
})

procurement_bot.onText(/\/login(.*)/, async function (msg, match) {
    //  Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:
    const user_id = msg.chat.id
    const password = match[1].trim()

    if (password == '') {
        procurement_bot.sendMessage(msg.chat.id, 'You forgot to add password. Use /login followed by your password. \nEx: /login Pass1234!');
    } else {
        const { success, remark } = await employeeLogin(user_id, password, access_to.PROCUREMENT)
        let options
        if (success) {
            options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: levelCommands.main_menu_procurement
                }),
                chat_id: msg.chat.id,
                message_id: msg.message_id,
            };
        }
        procurement_bot.deleteMessage(msg.chat.id, msg.message_id); // delete message to protect from password theft
        procurement_bot.sendMessage(msg.chat.id, remark, options)
    }

})

procurement_bot.onText(/\/logout/, async function (msg) {
    const user_id = msg.chat.id
    const text = await employeeLogout(user_id)
    procurement_bot.sendMessage(msg.chat.id, text);
})

procurement_bot.onText(/\/clear/, async function (msg) {
    const chat_id = msg.chat.id
    const message_id = msg.message_id
    const iteratable = Array(message_id - 0 + 1).fill().map((_, idx) => 0 + idx) // TODO 0 should be last cleared
    await Promise.all(iteratable.map(async (iter) => {
        try {
            await procurement_bot.deleteMessage(chat_id, iter)
        } catch (error) {
            //do nothing
        }

    }))
})

procurement_bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    await callbackQueryDistributer(procurement_bot, msg, action)
});

