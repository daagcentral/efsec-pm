// not used yet

async function onMessageDistributer(bot, msg) {
    // get data passed by button clicked regex match
    const projectPickedFromRegex = msg.match(/\/help(.*)/) // project id @ name
    const helpFromRegex = msg.match(/\/help/)
    const startFromRegex = msg.match(/\/start/)
    const signupFromRegex = msg.match(/\/signup(.*)/)
    const loginFromRegex = msg.match(/\/login(.*)/)
    const logoutFromRegex = msg.match(/\/logout/)
    const addNewProjectFromRegex = msg.match(/\/addnewproject/)
    const addNewBidFromRegex = msg.match(/\/addnewbid/)
    const addNewSaleFromRegex = msg.match(/\/addnewsale/)
    const uploadBoM = msg.match(/\/uploadBoM/)
    const viewPricesFromProcurementFromRegex = msg.match(/\/viewpricesfromprocurement/)
    const viewPricesReadyForClientsFromRegex = msg.match(/\/viewpricesreadyforclient/)
    const uploadMarginsForManagerReviewFromRegex = msg.match(/\/uploadmarginsformanagerreview/)
    const pickaProjectFromRegex = msg.match(/\/pickaproject(.*)/)
    const pickaBidFromRegex = msg.match(/\/pickabid(.*)/)
    const pickaSaleFromRegex = msg.match(/\/pickasale(.*)/)
}