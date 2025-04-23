import express from "express";
import bodyParser from "body-parser";
import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import dotenv from "dotenv";
import dbConfig from "./dbConfig.js";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

class Initializer {
  static async initialize() {
    const logFilePath = process.env.LOG_FILE_PATH || "./logs/node.log";
    const logDir = path.dirname(logFilePath);

    // Crear el directorio de logs si no existe
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    let logger = new ZOHOCRMSDK.LogBuilder()
      .level(ZOHOCRMSDK.Levels.INFO)
      .filePath(logFilePath)
      .build();

    let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();

    let token = new ZOHOCRMSDK.OAuthBuilder()
      .clientId(process.env.CLIENT_ID)
      .clientSecret(process.env.CLIENT_SECRET)
      .refreshToken(process.env.REFRESH_TOKEN)
      .redirectURL(process.env.REDIRECT_URL)
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

    console.log("SDK inicializado correctamente");
  }
}

// Función para obtener los tratos (deals) asociados a un contacto por su nombre completo
async function getContactDeals(contactFullName) {
  try {
    console.log(`Buscando tratos para el contacto: ${contactFullName}`);

    const moduleAPIName = "Deals";
    const recordOperations = new ZOHOCRMSDK.Record.RecordOperations(
      moduleAPIName
    );

    const paramInstance = new ZOHOCRMSDK.ParameterMap();
    // Buscar tratos donde el nombre del contacto coincida
    await paramInstance.add(
      ZOHOCRMSDK.Record.SearchRecordsParam.CRITERIA,
      `(Contact_Name:equals:'${contactFullName}')`
    );

    const headerInstance = new ZOHOCRMSDK.HeaderMap();

    const response = await recordOperations.searchRecords(
      paramInstance,
      headerInstance
    );

    if (response.getStatusCode() === 200) {
      const responseObject = response.getObject();

      if (responseObject instanceof ZOHOCRMSDK.Record.ResponseWrapper) {
        const records = responseObject.getData();

        if (records.length > 0) {
          // Extraer las direcciones de instalación de los tratos
          const addresses = records.map((deal) => {
            return {
              direccion:
                deal.getKeyValue("Domicilio_de_la_Instalaci_n") ||
                "Dirección no especificada",
              dealName: deal.getKeyValue("Deal_Name") || "Trato sin nombre",
            };
          });

          console.log(
            `Se encontraron ${addresses.length} direcciones de instalación`
          );
          return addresses;
        } else {
          console.log("No se encontraron tratos para este contacto");
          return [];
        }
      } else if (responseObject instanceof ZOHOCRMSDK.Record.APIException) {
        const errorMsg = `Error al obtener los tratos: ${responseObject
          .getMessage()
          .getValue()}`;
        console.log(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } else if (response.getStatusCode() === 204) {
      console.log("No se encontraron tratos para este contacto");
      return [];
    } else {
      const errorMsg = `Error al obtener los tratos: ${response.getStatusCode()}`;
      console.log(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error(`❌ Error al buscar tratos: ${error}`);
    throw error;
  }
}

// Función para validar la fecha de nacimiento de un contacto
async function validateBirthDate(dni, birthDate) {
  try {
    console.log(
      `Validando fecha de nacimiento para DNI: ${dni}, Fecha: ${birthDate}`
    );

    const moduleAPIName = "Contacts";
    const recordOperations = new ZOHOCRMSDK.Record.RecordOperations(
      moduleAPIName
    );

    const paramInstance = new ZOHOCRMSDK.ParameterMap();
    await paramInstance.add(
      ZOHOCRMSDK.Record.SearchRecordsParam.CRITERIA,
      `(N_mero_de_Documento:equals:'${dni}')`
    );

    const headerInstance = new ZOHOCRMSDK.HeaderMap();

    const response = await recordOperations.searchRecords(
      paramInstance,
      headerInstance
    );

    if (response.getStatusCode() === 200) {
      const responseObject = response.getObject();

      if (responseObject instanceof ZOHOCRMSDK.Record.ResponseWrapper) {
        const records = responseObject.getData();

        if (records.length > 0) {
          const contact = records[0];
          const contactBirthDate = contact.getKeyValue("Date_of_Birth");

          if (!contactBirthDate) {
            console.log(
              "❌ No se encontró fecha de nacimiento registrada para este contacto"
            );
            return {
              isValid: false,
              message:
                "No hay fecha de nacimiento registrada para este usuario",
            };
          }

          // Convertir la fecha de nacimiento almacenada a formato YYYY-MM-DD para comparación
          const storedDate = new Date(contactBirthDate);
          const formattedStoredDate = storedDate.toISOString().split("T")[0];

          // Comparar fechas en formato YYYY-MM-DD
          if (formattedStoredDate === birthDate) {
            console.log("✅ Fecha de nacimiento validada correctamente");
            return {
              isValid: true,
              contact: contact,
              message: "Fecha de nacimiento validada correctamente",
            };
          } else {
            console.log("❌ Fecha de nacimiento incorrecta");
            return {
              isValid: false,
              message:
                "La fecha de nacimiento no coincide con nuestros registros",
            };
          }
        } else {
          console.log(
            "❌ No se encontró el contacto por DNI durante la validación de fecha"
          );
          return {
            isValid: false,
            message: "No se encontró el contacto",
          };
        }
      }
    }

    return {
      isValid: false,
      message: "Error al validar la fecha de nacimiento",
    };
  } catch (error) {
    console.error(`❌ Error al validar fecha de nacimiento: ${error}`);
    return {
      isValid: false,
      message: "Error interno al validar fecha de nacimiento",
    };
  }
}

// Initialize the SDK
Initializer.initialize();

// Endpoint para verificar el DNI y determinar si necesita validación adicional
app.post("/validate-contact", async (req, res) => {
  try {
    const dni = req.body.dni;
    console.log(`DNI recibido: ${dni}`);

    const moduleAPIName = "Contacts";
    const recordOperations = new ZOHOCRMSDK.Record.RecordOperations(
      moduleAPIName
    );

    const paramInstance = new ZOHOCRMSDK.ParameterMap();
    await paramInstance.add(
      ZOHOCRMSDK.Record.SearchRecordsParam.CRITERIA,
      `(N_mero_de_Documento:equals:'${dni}')`
    );

    const headerInstance = new ZOHOCRMSDK.HeaderMap();

    const response = await recordOperations.searchRecords(
      paramInstance,
      headerInstance
    );

    if (response.getStatusCode() === 200) {
      const responseObject = response.getObject();

      if (responseObject instanceof ZOHOCRMSDK.Record.ResponseWrapper) {
        const records = responseObject.getData();

        if (records.length > 0) {
          const contact = records[0];
          const fullName = contact.getKeyValue("Full_Name");
          const firstName = contact.getKeyValue("First_Name");

          // Verificar si tiene direcciones y cuántas
          try {
            const addresses = await getContactDeals(fullName);

            // Si tiene 2 o más direcciones, solicitar fecha de nacimiento
            if (addresses.length >= 2) {
              res.json({
                status: `Hola ${firstName}, por seguridad necesitamos validar tu identidad.`,
                message:
                  "Validación por fecha de nacimiento...",
                requireBirthDate: true,
                access_granted: false, // Aún no, hasta validar fecha
                contactName: fullName,
                dni: dni,
              });
            } else {
              // Si tiene 0 o 1 dirección, no necesitamos validación adicional
              let messageStatus = `Hola ${firstName}, Bienvenido`;

              res.json({
                status: messageStatus,
                message: "¿Cómo te podemos ayudar?",
                requireBirthDate: false,
                access_granted: true,
                contactName: fullName,
                installations: addresses,
              });
            }
          } catch (error) {
            console.error(`Error al verificar direcciones: ${error}`);
            res.json({
              status: `Hola ${firstName}, Bienvenido`,
              message: "¿Cómo te podemos ayudar?",
              requireBirthDate: false,
              access_granted: true,
              contactName: fullName,
              installations: [],
            });
          }
        } else {
          res.json({
            status:
              "El DNI ingresado no existe en el sistema. Acceso denegado.❎",
            access_granted: false,
          });
        }
      } else if (responseObject instanceof ZOHOCRMSDK.Record.APIException) {
        res.json({
          status: `Error al obtener los registros: ${responseObject
            .getMessage()
            .getValue()}`,
          access_granted: false,
        });
      }
    } else if (response.getStatusCode() === 204) {
      res.json({
        status: "DNI no encontrado, asegúrese de ingresar el número correcto❌",
        access_granted: false,
      });
    } else {
      res.json({
        status: `Error al obtener los registros: ${response.getStatusCode()}`,
        access_granted: false,
      });
    }
  } catch (error) {
    console.error(`Error interno del servidor: ${error}`);
    res.status(500).json({
      status: "Error interno del servidor",
      access_granted: false,
    });
  }
});

// Endpoint para validar la fecha de nacimiento y entregar información completa
app.post("/validate-birthdate", async (req, res) => {
  try {
    const dni = req.body.dni;
    const birthDate = req.body.birthDate;

    console.log(`Validando fecha de nacimiento para DNI: ${dni}`);

    const validation = await validateBirthDate(dni, birthDate);

    if (validation.isValid) {
      const contact = validation.contact;
      const fullName = contact.getKeyValue("Full_Name");
      const firstName = contact.getKeyValue("First_Name");

      // Buscar tratos asociados al contacto validado
      try {
        const addresses = await getContactDeals(fullName);

        res.json({
          status: `Hola ${firstName}, identidad verificada correctamente.`,
          message: "¿Cómo te podemos ayudar?",
          access_granted: true,
          contactName: fullName,
          installations: addresses,
        });
      } catch (error) {
        console.error(
          `Error al buscar tratos después de validar fecha: ${error}`
        );
        res.json({
          status: `Hola ${firstName}, identidad verificada correctamente.`,
          message: "¿Cómo te podemos ayudar?",
          access_granted: true,
          contactName: fullName,
          installations: [],
        });
      }
    } else {
      res.json({
        status: validation.message,
        access_granted: false,
        requireBirthDate: true, // Seguir solicitando la fecha de nacimiento
        message:
          "Por favor, ingresa tu fecha de nacimiento correcta en formato YYYY-MM-DD",
      });
    }
  } catch (error) {
    console.error(
      `Error interno del servidor en validación de fecha: ${error}`
    );
    res.status(500).json({
      status: "Error interno del servidor",
      access_granted: false,
    });
  }
});

// Punto de entrada principal que procesa todo en una sola solicitud (para compatibilidad)
app.post("/validate-contact-sync", async (req, res) => {
  try {
    const dni = req.body.dni;
    const birthDate = req.body.birthDate; // Opcional, solo se usa si se proporciona

    console.log(`DNI recibido (modo síncrono): ${dni}`);

    const moduleAPIName = "Contacts";
    const recordOperations = new ZOHOCRMSDK.Record.RecordOperations(
      moduleAPIName
    );

    const paramInstance = new ZOHOCRMSDK.ParameterMap();
    await paramInstance.add(
      ZOHOCRMSDK.Record.SearchRecordsParam.CRITERIA,
      `(N_mero_de_Documento:equals:'${dni}')`
    );

    const headerInstance = new ZOHOCRMSDK.HeaderMap();

    const response = await recordOperations.searchRecords(
      paramInstance,
      headerInstance
    );

    if (response.getStatusCode() === 200) {
      const responseObject = response.getObject();

      if (responseObject instanceof ZOHOCRMSDK.Record.ResponseWrapper) {
        const records = responseObject.getData();

        if (records.length > 0) {
          const contact = records[0];
          const fullName = contact.getKeyValue("Full_Name");
          const firstName = contact.getKeyValue("First_Name");

          // Buscar tratos asociados al contacto
          try {
            const addresses = await getContactDeals(fullName);

            // Si tiene 2 o más direcciones y no proporcionó fecha de nacimiento, solicitarla
            if (addresses.length >= 2 && !birthDate) {
              res.json({
                status: `Hola ${firstName}, por seguridad necesitamos validar tu identidad.`,
                message:
                  "Por favor, ingresa tu fecha de nacimiento en formato YYYY-MM-DD",
                requireBirthDate: true,
                access_granted: false,
                contactName: fullName,
                dni: dni,
              });
              return;
            }

            // Si proporcionó fecha de nacimiento, validarla
            if (birthDate && addresses.length >= 2) {
              const validation = await validateBirthDate(dni, birthDate);

              if (!validation.isValid) {
                res.json({
                  status: validation.message,
                  access_granted: false,
                  requireBirthDate: true,
                  message:
                    "Por favor, ingresa tu fecha de nacimiento correcta en formato YYYY-MM-DD",
                });
                return;
              }
            }

            // Si no necesita fecha o ya se validó correctamente
            res.json({
              status: `Hola ${firstName}, Bienvenido, ¿Cómo te podemos ayudar?`,
              access_granted: true,
              contactName: fullName,
              installations: addresses,
            });
          } catch (dealError) {
            console.error(`Error al buscar tratos: ${dealError}`);
            res.json({
              status: `Hola ${firstName}, Bienvenido, ¿Cómo te podemos ayudar?`,
              access_granted: true,
              contactName: fullName,
              installations: [],
            });
          }
        } else {
          res.json({
            status:
              "El DNI ingresado no existe en el sistema. Acceso denegado.❎",
            access_granted: false,
          });
        }
      } else if (responseObject instanceof ZOHOCRMSDK.Record.APIException) {
        res.json({
          status: `Error al obtener los registros: ${responseObject
            .getMessage()
            .getValue()}`,
          access_granted: false,
        });
      }
    } else if (response.getStatusCode() === 204) {
      res.json({
        status: "DNI no encontrado, asegúrese de ingresar el número correcto❌",
        access_granted: false,
      });
    } else {
      res.json({
        status: `Error al obtener los registros: ${response.getStatusCode()}`,
        access_granted: false,
      });
    }
  } catch (error) {
    console.error(`Error interno del servidor: ${error}`);
    res
      .status(500)
      .json({ status: "Error interno del servidor", access_granted: false });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
