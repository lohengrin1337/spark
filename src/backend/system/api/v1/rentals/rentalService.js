// rentalService.js

const rentalModel = require('./rentalModel');
const { createInvoiceForRental } = require('../billing/rentalBillingService');

function assertRentalModelShape() {
  // This guard makes the “what is being required at runtime?” question trivial.
  if (!rentalModel || typeof rentalModel !== 'object') {
    throw new Error(`[RentalService] rentalModel export is invalid: ${typeof rentalModel}`);
  }
  if (typeof rentalModel.createRental !== 'function') {
    const keys = Object.keys(rentalModel);
    throw new Error(
      `[RentalService] rentalModel.createRental is not a function. Exported keys: ${keys.join(', ')}`
    );
  }
  if (typeof rentalModel.completeRental !== 'function') {
    const keys = Object.keys(rentalModel);
    throw new Error(
      `[RentalService] rentalModel.completeRental is not a function. Exported keys: ${keys.join(', ')}`
    );
  }
}

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
 * @param {string} start_zone
 * @returns {object} { rental_id }
 */
async function createRental(customer_id, bike_id, start_point, start_zone) {
  assertRentalModelShape();

  const rental_id = await rentalModel.createRental(customer_id, bike_id, start_point, start_zone);
  return { rental_id };
}

/**
 * Complete an ongoing rental.
 * Updates the rental and generates an invoice.
 * @param {number} id
 * @param {object} end_point
 * @param {string} end_zone
 * @param {Array} route
 * @returns invoice
 */
async function completeRental(id, end_point, end_zone, route) {
  assertRentalModelShape();

  const affectedRows = await rentalModel.completeRental(id, end_point, end_zone, route);

  if (affectedRows === 0) {
    throw new Error('Rental not found or already completed');
  }

  return await createInvoiceForRental(id);
}

module.exports = { getRentals, getRentalById, createRental, completeRental };
