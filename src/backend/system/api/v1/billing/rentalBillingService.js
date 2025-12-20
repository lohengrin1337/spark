const rentalModel = require('../rentals/rentalModel');
const pricingModel = require('../pricing/pricingModel');
const invoiceModel = require('../invoices/invoiceModel');
const { calculateRentalCost } = require('../pricing/calculateRentalCost');

/**
 * Orchestrates the invoice creation for a completed rental.
 * 
 * Helps to keep the other service/model pairs lean and focused.
 *
 * It fetches the finalized rental data from db, working only against persisted
 * data, fetches current pricing state, and uses it to calculate the rental cost,
 * based on duration, start_zone and end_zone for the rental, with the help of a
 * supporing function, and finally creates the complete invoice in the db.
 *
 * It intentionally contains no persistence or pricing logic itself,
 * delegating those responsibilities to their respective models/services,
 * for clean separation of concerns.
 *
 * @param {string|number} rental_id - The completed rental to invoice.
 * @param {number} [dueDays=30] - Number of days until the invoice is due (default=30).
 * @returns {Promise<Object>} The created invoice record.
 * @throws {Error} If the rental does not exist or is not yet completed.
 */
async function createInvoiceForRental(rental_id, dueDays = 30) {
    const rental = await rentalModel.getOneRental(rental_id);
    if (!rental || !rental.end_time) {
        throw new Error(`Rental ${rental_id} not completed or not found`);
    }

    const fee = await pricingModel.getCurrentPricing();

    const durationMinutes =
        Math.floor((new Date(rental.end_time) - new Date(rental.start_time)) / 60000);

    const amount = calculateRentalCost(
        rental.start_zone,
        rental.end_zone,
        durationMinutes,
        fee
    );

    const due_date = new Date();
    due_date.setDate(due_date.getDate() + dueDays);

    return invoiceModel.createInvoice({
        rental_id,
        amount,
        due_date
    });
}

module.exports = { createInvoiceForRental };
