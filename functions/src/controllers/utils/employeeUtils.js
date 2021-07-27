const crypto = require('crypto');
const Employee = require('../../models/employee');

const createEmployeeObject = (doc) => {
    return new Employee(
        doc.id,
        doc.data().firstName,
        doc.data().lastName,
        doc.data().hireDate,
        doc.data().phoneNumber,
        doc.data().status,
        doc.data().session,
        doc.data().accessTo,
    )
}

const createEmployeeObjectIfData = (data, noDataWarning) => {
    const employeesArray = [];
    if (data.empty) {
        functions.logger.error(noDataWarning)
        return null;
    } else {
        data.forEach(doc => {
            const employee = createEmployeeObject(doc)
            employeesArray.push(employee);
        });
        return employeesArray;
    }
}

const generateSalt = (rounds) => {
    if (rounds == null) {
        rounds = 12;
    }
    if (rounds >= 15) {
        throw new Error(`${rounds} is greater than 15,Must be less that 15`);
    }
    if (typeof rounds !== 'number') {
        throw new Error('rounds param must be a number');
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};

const hasher = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        hashedPassword: value
    };
};

const hashPassword = async (password) => {
    const salt = generateSalt(10);
    const hashedPassword = await hasher(password, salt)
    return hashedPassword
}

const compare = async (password, hash) => {
    if (password == null || hash == null) {
        throw new Error('password and hash is required to compare');
    }
    let passwordData = await hasher(password, hash.salt);
    if (passwordData.hashedPassword === hash.hashedPassword) {
        return true;
    }
    return false
};

module.exports = {
    createEmployeeObject,
    createEmployeeObjectIfData,
    hashPassword,
    compare
}
