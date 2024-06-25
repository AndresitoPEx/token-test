import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";
import dbConfig from "./dbConfig.js";

dotenv.config();

class Initializer {
  static async initialize() {
    // Crear un logger
    let logger = new ZOHOCRMSDK.LogBuilder()
      .level(ZOHOCRMSDK.Levels.INFO)
      .filePath("D:/sdk-zoho/node.log")
      .build();

    // Especificar el entorno
    let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();

    // Crear un token OAuth
    let token = new ZOHOCRMSDK.OAuthBuilder()
      .clientId(process.env.CLIENT_ID)
      .clientSecret(process.env.CLIENT_SECRET)
      .refreshToken(process.env.REFRESH_TOKEN)
      .redirectURL("https://cableredperu.com/soporte/")
      .findUser(false)
      .build();

      console.log("Token creado: ", token);

    // Configuración SDK
    let sdkConfig = new ZOHOCRMSDK.SDKConfigBuilder()
      .autoRefreshFields(true)
      .pickListValidation(false)
      .build();

    let resourcePath = "./resources";

    // Inicializar el SDK
    (await new ZOHOCRMSDK.InitializeBuilder())
      .environment(environment)
      .token(token)
      .store(dbConfig)
      .SDKConfig(sdkConfig)
      .resourcePath(resourcePath)
      .logger(logger)
      .initialize()
      .then(() => {
        console.log("Inicialización completada");
      })
      .catch((error) => {
        console.log("Error al inicializar el SDK:", error);
      });
      
  }
}

await Initializer.initialize();
console.log("SDK inicializado correctamente");

async function queryContacts() {
  try {
    const moduleAPIName = "Contacts";
    console.log("moduleAPIName:", moduleAPIName, "Tipo:", typeof moduleAPIName);

    // Crear una instancia de RecordOperations
    const recordOperations = new ZOHOCRMSDK.Record.RecordOperations(moduleAPIName);

    // Obtener los registros del módulo
    const paramInstance = new ZOHOCRMSDK.ParameterMap();
    await paramInstance.add(ZOHOCRMSDK.Record.GetRecordsParam.PAGE, 1);
    await paramInstance.add(ZOHOCRMSDK.Record.GetRecordsParam.PER_PAGE, 10);
    await paramInstance.add(ZOHOCRMSDK.Record.GetRecordsParam.FIELDS, "Full_Name,Email");

    const headerInstance = new ZOHOCRMSDK.HeaderMap();

    const response = await recordOperations.getRecords(paramInstance, headerInstance);

    // Verificar si la respuesta es exitosa
    if (response.getStatusCode() === 200) {
      // Obtener los datos de la respuesta
      const responseObject = response.getObject();

      // Verificar si los datos son una instancia de ResponseWrapper
      if (responseObject instanceof ZOHOCRMSDK.Record.ResponseWrapper) {
        const records = responseObject.getData();
        console.log(`Se encontraron ${records.length} registros:`);
        for (let record of records) {
          console.log(`ID: ${record.getId()}, Nombre: ${record.getKeyValue("Full_Name")}, Email: ${record.getKeyValue("Email")}`);
        }
      } else if (responseObject instanceof ZOHOCRMSDK.Record.APIException) {
        console.log("Error al obtener los registros:", responseObject.getMessage().getValue());
      }
    } else {
      console.log(`Error al obtener los registros: ${response.getStatusCode()}`);
      console.log('Detalle del error:', response.getObject());
    }
  } catch (error) {
    console.log(`Error al consultar los contactos: ${error}`);
  }
}

// Llama a la función queryContacts después de inicializar el SDK
await queryContacts();