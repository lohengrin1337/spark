// Auth model
const pool = require('../../../database/database');

const authModel = {
    /**
   * Fetch one customer by oauth_provider_id.
   * @param { number } oauthProviderId - the id returned from the oauth provider (github).
   * @returns { object|undefined } user object if found.
   */
  async getCustomerByOauth(oauthProviderId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const customer = await conn.query("SELECT * FROM customer WHERE oauth_provider_id = ?", [oauthProviderId]);
        return customer[0];
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Insert a customer with oauth identification.
   * @param { object } customer - contains { name, email, oauth_provider, oauth_provicer_id }
   * @returns { number } customer_id of newly inserted customer.
   */
  async saveOauthCustomer(customer) {
    let conn;
    try {
    conn = await pool.getConnection();
    const newCustomer = await conn.query("INSERT INTO customer (email, name, oauth_provider, oauth_provider_id) VALUES (?, ?, ?, ?)",
        [customer.email, customer.name, customer.oauth_provider, customer.oauth_provider_id]);
    console.log(newCustomer);
    return newCustomer.insertId;
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Get a customer by email.
   * @param { string } email - 
   */
  async getCustomerByEmail(email) {
    let conn;
    try {
        conn = await pool.getConnection();
        const customer = await conn.query("SELECT * FROM customer WHERE email = ?", [email]);
        return customer[0];
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Get admin
   * @param { string } admin - admin username
   */
  async getAdmin(adminId) {
    console.log(adminId);
    let conn;
    try {
        conn = await pool.getConnection();
        const admin = await conn.query("SELECT * FROM admin_account WHERE admin_id = ?", [adminId]);
        return admin[0];
    } finally {
        if (conn) conn.release();
    }
  },
  /**
   * Get third party
   * @param { string } thirdPartyId - third party username
   */
  async getThirdParty(thirdPartyId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const thirdParty = await conn.query("SELECT * FROM third_party WHERE third_party_id = ?", [thirdPartyId]);
        return thirdParty[0];
    } finally {
        if (conn) conn.release();
    }
  },
  /** 
   * Insert a customer with email and password.
   * @param { string } email - new customer email.
   * @param { string|null } - customer name if provided.
   * @param { string } password - hashed password.
  */
 async saveEmailCustomer(email, name, password) {
    let conn;
    try {
        conn = await pool.getConnection();
        const newCustomer = await conn.query("INSERT INTO customer (email, name, password) VALUES (?, ?, ?)", [email, name, password]);
        return Number(newCustomer.insertId);
    } finally {
        if (conn) conn.release();
    }
 }
};

module.exports = authModel;
