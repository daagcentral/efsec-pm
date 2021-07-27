const admin = require('../db');
const firestore = admin.firestore()

const { createEmployeeObject, createEmployeeObjectIfData, hashPassword, compare } = require('./utils/employeeUtils');
const { employee_status } = require('../values/enums');

const genAddEmployee = async (id, data) => {
    id = `${id}`
    // check  if employee exists
    const employee = await genEmployee(id)
    if (!employee) {
        data.accessTo = []
        data.password = await hashPassword(data.password)
        
        try {
            await firestore.collection('employees').doc(id).set(data);
            return 'Record saved successfuly. Waiting for approval from admin.';
        } catch (error) {
            functions.logger.error(error)
            return 'Failed. Try again.'
        }
    } else {
        const accessTo = employee.getAccessTo()
        if (accessTo.includes(data.accessTo[0])) {
            return 'User already exists. Please login.'
        } else {
            return 'User exists. Waiting usage approval from admin.';
        }
    }
}

const genAllEmployees = async () => {
    try {
        const data = await firestore.collection('employees').get();
        return createEmployeeObjectIfData(data, 'No employee record found')
    } catch (error) {
        functions.logger.error(error);
        return null
    }
}

const genEmployeesWithStatus = async (status) => {
    try {
        const data = await firestore.collection('employees').where('status', '==', status).get();
        return createEmployeeObjectIfData(data, 'No employee record found')
    } catch (error) {
        functions.logger.error(error);
        return null
    }
}

const genEmployee = async (id) => {
    id = `${id}`
    try {
        const data = await firestore.collection('employees').doc(id).get();
        if (!data.exists) {
            functions.logger.log('No employee record found')
            return null;
        } else {
            return createEmployeeObject(data)
        }
    } catch (error) {
        functions.logger.error(error);
        return null
    }
}

const genUpdateEmployee = async (id, data) => {
    id = `${id}`
    try {
        const employee = await firestore.collection('employees').doc(`${id}`);
        await employee.update(data);
        return 'Employee record updated successfuly';
    } catch (error) {
        functions.logger.error(error)
        return 'Failed. Try again.'
    }
}

const genEmployeeLogout = async (id) => {
    id = `${id}`
    try {
        await firestore.collection('employees').doc(id).update({
            'session': 'dead'
        })
        return 'Successfully logged out'
    } catch (error) {
        functions.logger.error(error)
        return 'Failed to log out. Try again'
    }
}

const genEmployeeLogin = async (id, password, accessTo) => {
    id = `${id}`
    var employee = await firestore.collection('employees').doc(id).get()

    if (!employee.exists) {
        return {
            success: false,
            remark: 'Employee doesnt exist. Please sign up first.'
        }
    } else {
        const data = employee.data()
        if (!data.accessTo.includes(accessTo)) {
            return {
                success: false,
                remark: `You dont have access to EFSEC ${accessTo.charAt(0).toUpperCase()
                    + accessTo.slice(1)} bot. Speak to Admin to request access.`
            }
        }

        if (data.status !== employee_status.ACTIVE) {
            return {
                success: false,
                remark: 'Your account is still waiting for approval. Please wait or talk to admin.'
            }
        }
        
        const hash = await hashPassword(password)
    
        const correctPassword = await compare(data.password.hashedPassword, hash);
        if (correctPassword) {
            return {
                success: false,
                remark: 'Wrong password. Try again.'
            }
        }

        try {
            await firestore.collection('employees').doc(id).update({
                'session': 'live'
            })
            return {
                success: true,
                remark: 'Successfully logged in.'
            }
        } catch (error) {
            functions.logger.error(error)
            return {
                success: false,
                remark: 'Failed to start session. Try again.'
            }
        }
    }
}

const genDeleteEmployee = async (id) => {
    try {
        await firestore.collection('employees').doc(id).delete();
        return 'Record deleted successfuly';
    } catch (error) {
        functions.logger.error(error)
        return 'Failed. Try again.'
    }
}

module.exports = {
    genAddEmployee,
    genAllEmployees,
    genEmployee,
    genEmployeesWithStatus,
    genUpdateEmployee,
    genDeleteEmployee,
    genEmployeeLogin,
    genEmployeeLogout
}
