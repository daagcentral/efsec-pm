const respace = (phrase) => {
    return phrase.split('/$/').join(' ');
}

module.exports = {respace}
