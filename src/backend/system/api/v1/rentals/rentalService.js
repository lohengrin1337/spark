// rental services

const rentalModel = require('./rentalModel');

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

module.exports = { getRentals, getRentalById };
