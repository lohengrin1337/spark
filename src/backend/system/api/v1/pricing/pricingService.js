// pricing services

const pricingModel = require('./pricingModel');

/**
 * Gets current price list from model.
 */
async function getPriceList() {
    return pricingModel.getPriceList();
}

module.exports = { getPriceList };
