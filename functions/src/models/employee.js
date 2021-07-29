class Employee {
    constructor(id, firstName, lastName,
        hireDate, phoneNumber, status, session, accessTo) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.hireDate = hireDate;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.session = session;
        this.accessTo = accessTo;
    }
    // TODO hange to getID
    getId() {
        return this.id;
    }
    getFirstName() {
        return this.firstName;
    }
    getLastName() {
        return this.lastName;
    }
    getHireDate() {
        return this.hireDate;
    }
    getPhoneNumber() {
        return this.phoneNumber
    };
    getStatus() {
        return this.status;
    }
    getSession() {
        return this.session;
    }
    getAccessTo() {
        return this.accessTo;
    }
}

module.exports = Employee
