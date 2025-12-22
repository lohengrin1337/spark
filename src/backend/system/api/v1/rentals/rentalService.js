// rental services

const rentalModel = require('./rentalModel');

const { createInvoiceForRental } = require('../billing/rentalBillingService');

/**
 * Gets all rentals from model.
 * @returns Array of rentals
 */
async function getRentals() {
    return rentalModel.getAllRentals();
}

/**
 * Gets one rental from model.
 * @param { number } id rental id
 * @returns rental as object (if found)
 */
async function getRentalById(id) {
    return rentalModel.getOneRental(id);
}


/**
 * Create a new rental.
 * @param {number} customer_id
 * @param {number} bike_id
 * @param {object} start_point
 * @param {number} start_zone
 * @returns {number} New rental_id.
 */
async function createRental(customer_id, bike_id, start_point, start_zone) {
    return rentalModel.createRental(customer_id, bike_id, start_point, start_zone);
  }
  
/**
 * Complete an ongoing rental.
 * Updates the rental and generates an invoice.
 * @param {number} id - Rental ID.
 * @param {object} end_point
 * @param {number} end_zone
 * @param {Array} route
 * @returns {object} The generated invoice.
 * @throws {Error} If rental not found or already completed.
 */
async function completeRental(id, end_point, end_zone, route) {
    const affectedRows = await rentalModel.completeRental(id, end_point, end_zone, route);
  
    if (affectedRows === 0) {
      throw new Error('Rental not found or already completed');
    }
  
    return await createInvoiceForRental(id);
  }
  
  module.exports = { getRentals, getRentalById, createRental, completeRental };