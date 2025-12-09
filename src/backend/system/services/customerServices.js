// customer services

const customerModel = require('../models/customerModel.js');

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

module.exports = { getCustomers, getCustomerById };
