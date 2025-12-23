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
    conn = await pool.getConnection();
    const customer = await conn.query("SELECT * FROM customer WHERE email = ?", [email]);
    return customer[0];
  },
  /** 
   * Insert a customer with email and password.
   * @param { string } email - new customer email.
   * @param { string|null } - customer name if provided.
   * @param { string } password - hashed password.
   * @returns { number } customer_id of newly inserted customer.
  */
 async saveEmailCustomer(email, name = null, password) {
    let conn;
    try {
        conn = await pool.getConnection();
        const newCustomer = await conn.query("INSERT INTO customer (email, name, password) VALUES (?, ?, ?)", [email, name, password]);
        return newCustomer.insertId;
    } finally {
        if (conn) conn.release();
    }
 }
};

module.exports = authModel;
