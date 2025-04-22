import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = new ZOHOCRMSDK.DBBuilder()
  .host(process.env.DB_HOST)
  .databaseName(process.env.DB_NAME)
  .userName(process.env.DB_USER)
  .password(process.env.DB_PASSWORD)
  .portNumber(process.env.DB_PORT)
  .tableName("oauthtoken")
  .build();


export default dbConfig;
