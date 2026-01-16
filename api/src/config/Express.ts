import express from "express";
import dotenv from "dotenv";

import { Connection } from '../database/Connection';

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../swagger_config";
import router from "../router";

dotenv.config()

export class Express {
    public server: express.Application;

    constructor() {
        this.server = express();
        this.middleware();
        this.connection();
        this.routes();
    }

    private middleware() {
        this.server.use(express.json());
    }

    private routes() {
        this.server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        this.server.use(router);
    }

    private async connection() {
        await Connection.connect();
    }
}