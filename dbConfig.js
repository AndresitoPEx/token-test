import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";

dotenv.config();

// Determinar si estamos en producción (Render)
const isProd = process.env.NODE_ENV === 'production';

// Crear el builder base
const builder = new ZOHOCRMSDK.DBBuilder()
  .host(process.env.DB_HOST)
  .databaseName(process.env.DB_NAME || "zohooauth")
  .userName(process.env.DB_USER)
  .password(process.env.DB_PASSWORD)
  .portNumber(process.env.DB_PORT || 3306)
  .tableName("oauthtoken");

// Añadir SSL solo en producción
if (isProd) {
  builder.sslMode(true);
}

const dbConfig = builder.build();

export default dbConfig;