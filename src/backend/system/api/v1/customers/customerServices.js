// customer services
const bcrypt = require('bcryptjs');

const customerModel = require('./customerModel.js');

/**
 * Gets all customers from model.
 * @returns Array of customers
 */
async function getCustomers() {
    return await customerModel.getAllCustomers();
}

/**
 * Gets one customer from model.
 * @param { number } id customer id
 * @param { object } user - user id and role from token
 * @returns customer as object (if found)
 */
async function getCustomerById(id, user) {
    if (user.role != "admin"){
        return await customerModel.getOneCustomer(user.id);
    }
    return customerModel.getOneCustomer(id);
}

/**
 * Update a customer
 * @param {string} id 
 * @param {string} name 
 * @param {string|null} password
 * @param { object } user - user id and role from token
 */
async function updateCustomer(id, name, password, user) {
    if (user.role !== "admin") {
        id = user.id;
    }
    const fields = [];
    const values = [];

    if (name) {
        fields.push("name");
        values.push(name);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        fields.push("password");
        values.push(hashedPassword);
    }

    const updatedRows = await customerModel.updateCustomer(id, fields, values);
    if (updatedRows == 0) {
        const err = new Error(`Customer with id ${id} not found.`);
        err.status = 404;
        throw err;
    }

    return updatedRows;
}

/**
 * Change/toggle blocked status for a customer
 * @param {number} id 
 * @param {boolean} blocked 
 * @returns {number} affected rows
 */
async function changeCustomerBlocked(id, blocked) {
    return await customerModel.toggleCustomerBlocked(id, blocked);
}


module.exports = { getCustomers, getCustomerById, updateCustomer, changeCustomerBlocked };
