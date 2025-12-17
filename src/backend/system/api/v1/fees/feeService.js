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
 * @param { Date } timeStamp specified timestamp or now
 */
async function getOne(timeStamp = new Date()) {
    const feeAtDate = await feeModel.getFeeAtDate(timeStamp);
    return feeAtDate;
}


module.exports = { getAll, getOne };
