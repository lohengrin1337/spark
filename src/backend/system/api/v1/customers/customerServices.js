// customer services

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
 * Change/toggle blocked status for a customer
 * @param {number} id 
 * @param {boolean} blocked 
 * @returns {number} affected rows
 */
async function changeCustomerBlocked(id, blocked) {
    return customerModel.toggleCustomerBlocked(id, blocked);
}


module.exports = { getCustomers, getCustomerById, changeCustomerBlocked };
