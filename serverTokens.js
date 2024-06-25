import express from "express";
import Initializer from "./server.js"; // Asegúrate de que este archivo tenga la inicialización del SDK
import dbConfig from "./dbConfig.js"; // Archivo de configuración de la base de datos
import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";

const app = express();

// Inicializar el SDK de Zoho CRM
async function initializeSDK() {
  await Initializer.initialize(); // Asegúrate de que esta función inicialice correctamente el SDK
}

// Función para obtener el token de acceso desde la base de datos
async function getAccessTokenFromDB() {
  try {
    const oAuthToken = await ZOHOCRMSDK.OAuthToken.getCurrentToken();
    if (oAuthToken) {
      return oAuthToken.getAccessToken();
    } else {
      throw new Error("No se encontró el token de acceso.");
    }
  } catch (error) {
    throw new Error("Error al obtener el token de acceso: " + error.message);
  }
}

// Endpoint para obtener el token de acceso
app.get("/getAccessToken", async (req, res) => {
  try {
    await initializeSDK();
    const accessToken = await getAccessTokenFromDB();
    res.json({ accessToken: accessToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
