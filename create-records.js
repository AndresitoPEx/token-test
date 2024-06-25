import * as ZOHOCRMSDK from '@zohocrm/nodejs-sdk-6.0';
import dbConfig from './dbConfig.js'; 

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
            .clientId("1000.OAPW7Z0QX4AYOQNV6YF74ORCRMDJUB")
            .clientSecret("f81daa85a9a2a2a2de91783ab6e8ef45022685ed27")
            .grantToken("1000.35fb5fe903c25e64e4e00fd4b70b1d93.dc2df3b61f5ea6d0cae987d463b38d10")
            .redirectURL("https://cableredperu.com/servicios/")
            .build();

        // Inicializar el SDK
        (await new ZOHOCRMSDK.InitializeBuilder())
            .environment(environment)
            .token(token)
            .store(dbConfig) //DBStore
            .initialize()
            .catch(error => {
                console.log(error);
            });
    }
}

await Initializer.initialize();








// import * as ZOHOCRMSDK from '@zohocrm/nodejs-sdk-6.0';
// import dbConfig from './dbConfig.js'; 

// class Initializer {
//     static async initialize() {
//         let logger = new ZOHOCRMSDK.LogBuilder()
//             .level(ZOHOCRMSDK.Levels.INFO)
//             .filePath("D:/sdk-zoho/node.log")
//             .build();
//         ZOHOCRMSDK.Logger.getInstance().setLogger(logger);
//         let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();
//         let token = new ZOHOCRMSDK.OAuthBuilder()
//             .clientId("1000.3SJHZYRNPCS48CUBIUWQ0FI0600FWE")
//             .clientSecret("e6a64cf4ea762dbdde64a8851f49f754d94160a1f6")
//             .grantToken("1000.6e7a1bb8642ef42446794de7257d2cd1.f5456a8187120d11977349e54de7a92a")
//             .redirectURL("https://cableredperu.com/soporte/")
//             .build();

//         (await new ZOHOCRMSDK.InitializeBuilder())
//             .environment(environment)
//             .token(token)
//             .store(dbConfig) //DBStore
//             .initialize()
//             .catch(error => {
//                 console.log(error);
//             });
//     }
// }

// await Initializer.initialize();

