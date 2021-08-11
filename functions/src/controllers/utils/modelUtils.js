const respace = (phrase) => {
    return phrase.split('/$/').join(' ');
}

const despace = (phrase) => {
    var newPhrase = phrase.replace(/\s+/g, " ");
    return newPhrase.split(' ').join('/$/');
}

const getIdFromLink = (idLink) => {
    try {
        return idLink.substring(
            idLink.indexOf(".") + 1,
            idLink.lastIndexOf(".")
        )
    } catch (error) {
        Logger.log(error)
        return idLink
    }
}

module.exports = {
    respace,
    despace,
    getIdFromLink,
}
