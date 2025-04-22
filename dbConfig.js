import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";

dotenv.config();

// Configuración para MySQL en Aiven con SSL
const dbConfig = new ZOHOCRMSDK.DBBuilder()
  .host(process.env.DB_HOST)
  .databaseName(process.env.DB_NAME || "zohooauth")
  .userName(process.env.DB_USER)
  .password(process.env.DB_PASSWORD)
  .portNumber(process.env.DB_PORT || 3306)
  .tableName("oauthtoken")
  // Configuración SSL para Aiven
  .sslMode(true)
  .build();

export default dbConfig;