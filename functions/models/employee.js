
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
        this.accessTo=accessTo;
    }

    getAccessTo() {
        return this.accessTo;
    }

    getSession() {
        return this.session
    }

}

module.exports = Employee