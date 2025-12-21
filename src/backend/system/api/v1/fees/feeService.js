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
 * @param { Date } date default now
 */
async function getOne(date) {
    if (!date) {
        date = new Date().toISOString();
        console.log(date);
    }
    const feeAtDate = await feeModel.getFeesAtDate(date);
    return feeAtDate;
}

/**
 * Gets current price list
 */
async function getLatest() {
    return feeModel.getLatestFee();
}


/**
 * Insert a new fee version
 */
async function createFee(fee) {
  return feeModel.insertFee(fee);
}

module.exports = { getAll, getOne, getLatest, createFee };
