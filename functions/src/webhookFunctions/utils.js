const unixTimeConverter = (unixTime) => {
    var date = new Date(unixTime * 1000);

    var year = date.getFullYear();
    var month = "0" + (parseInt(date.getMonth()) + 1).toString();
    var day = "0" + date.getDate();

    var formattedTime = year + '-' + (month.substr(-2)) + '-' + day.substr(-2);
    return formattedTime
}

module.exports = {
    unixTimeConverter
}

