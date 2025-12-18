// pricing services

const feeModel = require('./feeModel');

/**
 * Gets all current and historical price lists
 */
async function getAll() {
    const allFees = await feeModel.getAllFees();
    return allFees;
}

/**
 * Gets one price list from model, defaults to current.
 * @param { Date } dateTime default now
 */
async function getOne(dateTime) {
    const feeAtDate = await feeModel.getFeesAtDate(dateTime);
    return feeAtDate;
}

/**
 * Update one or more fees
 */
async function updateFee(newFees) {
    console.log(newFees);
}

module.exports = { getAll, getOne, updateFee };
