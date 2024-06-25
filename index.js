import express from 'express';
import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";
import dbConfig from "./dbConfig.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

class Initializer {
  static async initialize() {
    let logger = new ZOHOCRMSDK.LogBuilder()
      .level(ZOHOCRMSDK.Levels.INFO)
      .filePath("./sdk-zoho/node.log")
      .build();

    let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();

    let token = new ZOHOCRMSDK.OAuthBuilder()
      .clientId(process.env.CLIENT_ID)
      .clientSecret(process.env.CLIENT_SECRET)
      .refreshToken(process.env.REFRESH_TOKEN)
      .redirectURL("https://cableredperu.com/soporte/")
      .findUser(false)
      .build();

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
      .initialize();

    console.log("SDK initialized successfully");
  }
}

// Initialize the SDK
Initializer.initialize();

app.post('/validate-contact', async (req, res) => {
  const { dni, password } = req.body;

  try {
    const moduleAPIName = "Contacts";
    const recordOperations = new ZOHOCRMSDK.Record.RecordOperations();
    const paramInstance = new ZOHOCRMSDK.ParameterMap();

    await paramInstance.add(ZOHOCRMSDK.Record.GetRecordsParam.PAGE, 1);
    await paramInstance.add(ZOHOCRMSDK.Record.GetRecordsParam.PER_PAGE, 10);
    await paramInstance.add(ZOHOCRMSDK.Record.GetRecordsParam.FIELDS, "Full_Name,Email,Password");

    const response = await recordOperations.searchRecords(moduleAPIName, `N_mero_de_Documento:equals:${dni}`, paramInstance);

    if (response.getStatusCode() === 200) {
      const responseObject = response.getObject();
      if (responseObject instanceof ZOHOCRMSDK.Record.ResponseWrapper) {
        const records = responseObject.getData();
        if (records.length > 0) {
          const contact = records[0];
          const storedPassword = contact.getKeyValue("Password");
          if (storedPassword === password) {
            const fullName = contact.getKeyValue("Full_Name");
            return res.json({ status: `Hola ${fullName}, Bienvenido, ¿Como te podemos ayudar?.` });
          }
        }
      }
    }

    return res.json({ status: "DNI no encontrado, asegúrese de ingresar el número correcto" });
  } catch (error) {
    console.log(`Error while validating contact: ${error}`);
    return res.status(500).json({ status: "Error interno del servidor" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
