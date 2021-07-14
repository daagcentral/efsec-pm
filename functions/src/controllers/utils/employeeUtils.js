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
        functions.logger.warn(noDataWarning)
        return null;
    } else {
        data.forEach(doc => {
            const employee = createEmployeeObject(doc)
            employeesArray.push(employee);
        });
        return employeesArray;
    }
}

const hashPassword = (password) => {
    // TODO find hash function
    return password
}

module.exports = {
    createEmployeeObject,
    createEmployeeObjectIfData,
    hashPassword
}
