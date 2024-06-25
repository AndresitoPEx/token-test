import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";

import dbConfig from "./dbConfig.js"; // Asegúrate de tener configurada tu conexión a la base de datos

class CustomStore extends ZOHOCRMSDK.TokenStore {
  constructor() {
    super();
  }

  async getToken(user, tokenType) {
    const query = `SELECT * FROM oauth_tokens WHERE user_mail = ? AND token_type = ?`;
    const [rows] = await dbConfig.execute(query, [user.getEmail(), tokenType]);
    
    if (rows.length > 0) {
      const row = rows[0];
      return new ZOHOCRMSDK.OAuthToken(
        row.client_id,
        row.client_secret,
        row.refresh_token,
        row.grant_token,
        row.access_token,
        row.expires_in,
        row.expires_at
      );
    }
    return null;
  }

  async saveToken(user, token) {
    const query = `INSERT INTO oauth_tokens (user_mail, client_id, client_secret, refresh_token, access_token, expires_in, expires_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?) 
                   ON DUPLICATE KEY UPDATE 
                     access_token = VALUES(access_token), 
                     expires_in = VALUES(expires_in), 
                     expires_at = VALUES(expires_at)`;
    await dbConfig.execute(query, [
      user.getEmail(),
      token.getClientId(),
      token.getClientSecret(),
      token.getRefreshToken(),
      token.getAccessToken(),
      token.getExpiresIn(),
      token.getExpiresAt()
    ]);
  }

  async deleteToken(user, tokenType) {
    const query = `DELETE FROM oauth_tokens WHERE user_mail = ? AND token_type = ?`;
    await dbConfig.execute(query, [user.getEmail(), tokenType]);
  }

  async getTokens() {
    const query = `SELECT * FROM oauth_tokens`;
    const [rows] = await dbConfig.execute(query);
    return rows.map(row => new ZOHOCRMSDK.OAuthToken(
      row.client_id,
      row.client_secret,
      row.refresh_token,
      row.grant_token,
      row.access_token,
      row.expires_in,
      row.expires_at
    ));
  }

  async deleteTokens() {
    const query = `DELETE FROM oauth_tokens`;
    await dbConfig.execute(query);
  }
}

export { CustomStore };
