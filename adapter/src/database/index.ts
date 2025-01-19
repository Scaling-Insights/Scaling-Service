import { AppDataSource } from "src/database/data-source";

AppDataSource.initialize().then(async () => {
    console.log("Database initialized in index.ts");    
}).catch(error => {
    console.error("Database Initialization Error in database/index.ts: ", error);
});