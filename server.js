import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";
import dbConfig from "./dbConfig.js";

dotenv.config();

class Initializer {
  static async initialize() {
    let logger = new ZOHOCRMSDK.LogBuilder()
      .level(ZOHOCRMSDK.Levels.INFO)
      .filePath("D:/sdk-zoho/node.log")
      .build();

    let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();

    let token = new ZOHOCRMSDK.OAuthBuilder()
      .clientId(process.env.CLIENT_ID)
      .clientSecret(process.env.CLIENT_SECRET)
      .refreshToken(process.env.REFRESH_TOKEN)
      .redirectURL("https://cableredperu.com/soporte/")
      .findUser(false)
      .build();

      console.log("Token: ", token);

    let sdkConfig = new ZOHOCRMSDK.SDKConfigBuilder()
      .autoRefreshFields(true)
      .pickListValidation(false)
      .build();

    let resourcePath = "./resources";

    (await new ZOHOCRMSDK.InitializeBuilder())
      .environment(environment)
      .token(token)
      .store(dbConfig)
      .SDKConfig(sdkConfig)
      .resourcePath(resourcePath)
      .logger(logger)
      .initialize()
      .then(()=>{
        console.log("Inicializacion ok");
      })
      .catch(error => {
        console.log("Error al inicializar el SDK:", error);
      });
  }
}

export default Initializer;
