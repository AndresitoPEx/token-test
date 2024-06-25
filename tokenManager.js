import express from 'express';
import * as ZOHOCRMSDK from '@zohocrm/nodejs-sdk-6.0';
import dotenv from 'dotenv';
import { CustomStore } from './customStore.js';

dotenv.config();

const app = express();
const PORT = 3000;

class TokenManager {
  static async getAccessToken() {
    try {
      // Crear un logger
      let logger = new ZOHOCRMSDK.LogBuilder()
        .level(ZOHOCRMSDK.Levels.INFO)
        .filePath("D:/sdk-zoho/node.log")
        .build();

      // Especificar el entorno
      let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();

      // Crear un token OAuth con 'new'
      let token = new ZOHOCRMSDK.OAuthBuilder()
        .clientId(process.env.CLIENT_ID)
        .clientSecret(process.env.CLIENT_SECRET)
        .refreshToken(process.env.REFRESH_TOKEN)
        .redirectURL("https://cableredperu.com/soporte/")
        .findUser(false)
        .build();

      // Configuración SDK
      let sdkConfig = new ZOHOCRMSDK.SDKConfigBuilder()
        .autoRefreshFields(true)
        .pickListValidation(false)
        .build();

      let resourcePath = "./resources";

      // Inicializar el SDK
      await new ZOHOCRMSDK.InitializeBuilder()
        .environment(environment)
        .token(token)
        .store(new CustomStore())  // Usar CustomStore para la persistencia de tokens
        .SDKConfig(sdkConfig)
        .resourcePath(resourcePath)
        .logger(logger)
        .initialize();

      console.log("SDK inicializado correctamente");

      // Obtener el token de acceso desde el almacenamiento
      const accessToken = await token.getAccessToken();
      return accessToken;
    } catch (error) {
      console.log("Error al obtener el token de acceso:", error);
      throw error;
    }
  }
}

app.get('/getAccessToken', async (req, res) => {
  try {
    const accessToken = await TokenManager.getAccessToken();
    res.json({ accessToken });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
