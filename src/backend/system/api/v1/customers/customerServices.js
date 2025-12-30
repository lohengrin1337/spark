// customer services
const bcrypt = require('bcryptjs');

const customerModel = require('./customerModel.js');

/**
 * Gets all customers from model.
 * @returns Array of customers
 */
async function getCustomers() {
    return customerModel.getAllCustomers();
}

/**
 * Gets one customer from model.
 * @param { number } id customer id
 * @returns customer as object (if found)
 */
async function getCustomerById(id) {
    return customerModel.getOneCustomer(id);
}

/**
 * Update a customer
 * @param {string} id 
 * @param {string} name 
 * @param {string|null} password 
 */
async function updateCustomer(id, name, password) {
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
    return customerModel.toggleCustomerBlocked(id, blocked);
}


module.exports = { getCustomers, getCustomerById, updateCustomer, changeCustomerBlocked };
