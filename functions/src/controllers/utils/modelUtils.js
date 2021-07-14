const respace = (phrase) => {
    functions.logger.log(phrase)
    return phrase.split('/$/').join(' ');
}

module.exports = {respace}
