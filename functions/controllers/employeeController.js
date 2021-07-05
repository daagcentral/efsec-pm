const admin = require('../db');
const firestore = admin.firestore()
const bucket = admin.storage().bucket()

const { createEmployeeObject, hashPassword } = require('./utils/employeeUtils');
const { project_status, employee_status, payment_mode } = require('../enums');

const addEmployee = async (id, data) => {
    id = `${id}`
    // check  if employee exists
    const employee = await getEmployee(id)
    if (!employee) {
        data.accessTo = []
        data.password = hashPassword(data.password)
        try {
            await firestore.collection('employees').doc(id).set(data);
            // TODO notify admin for approval
            return 'Record saved successfuly. Waiting for approval from admin';
        } catch (error) {
            console.log(error.message)
            return 'Failed. Try again.'
        }
    } else {
        const accessTo = employee.getAccessTo()
        if (accessTo.includes(data.accessTo[0])) {
            return 'User already exists. Please login'
        } else {
            // TODO notify admin for approval
            return 'User exists. Waiting bot usage approval from admin';
        }
    }
}


const getAllEmployees = async () => {
    try {
        const employees = await firestore.collection('employees');
        const data = await employees.get();
        const employeesArray = [];
        if (data.empty) {
            console.log('No employee record found')
            return null
        } else {
            data.forEach(doc => {
                const employee = createEmployeeObject(doc);
                employeesArray.push(employee);
            });
            return employeesArray;
        }
    } catch (error) {
        console.log(error.message);
        return null
    }
}

const getEmployeesWithStatus = async (status) => {
    try {
        const employees = await firestore.collection('employees');
        const data = await employees.where('status', '==', status).get();
        const employeesArray = [];
        if (data.empty) {
            console.log('No employee record found')
            return null
        } else {
            data.forEach(doc => {
                const employee = createEmployeeObject(doc);
                employeesArray.push(employee);
            });
            return employeesArray;
        }
    } catch (error) {
        console.log(error.message);
        return null
    }
}

const getEmployee = async (id) => {
    id = `${id}`
    try {
        const employee = await firestore.collection('employees').doc(id);
        const data = await employee.get();
        if (!data.exists) {
            console.log('No employee record found')
            return null;
        } else {
            return createEmployeeObject(data)
            
        }
    } catch (error) {
        console.log(error.message);
        return null
    }
}

const updateEmployee = async (id, data) => {
    id = `${id}`
    try {
        const employee = await firestore.collection('employees').doc(`${id}`);
        await employee.update(data);
        return 'Employee record updated successfuly';
    } catch (error) {
        console.log(error.message)
        return 'Failed. Try again.'
    }
}

const employeeLogout = async (id) => {
    id = `${id}`
    try {
        await firestore.collection('employees').doc(id).update({
            'session': 'dead'
        })
        return 'Successfully logged out'
    } catch (error) {
        console.log(error.message)
        return 'Failed to log out. Try again'
    }
}

const employeeLogin = async (id, password, accessTo) => {
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

        if (hashPassword(password) !== data.password) {
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
            console.log(error.message)
            return {
                success: false,
                remark: 'Failed to start session. Try again.'
            }
        }
    }
}

const deleteEmployee = async (id) => {
    try {
        await firestore.collection('employees').doc(id).delete();
        return 'Record deleted successfuly';
    } catch (error) {
        console.log(error.message)
        return 'Failed. Try again.'
    }
}

module.exports = {
    addEmployee,
    getAllEmployees,
    getEmployee,
    getEmployeesWithStatus,
    updateEmployee,
    deleteEmployee,
    employeeLogin,
    employeeLogout
}