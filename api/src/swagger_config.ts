import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "YouTube Automatic Tools API",
            version: "1.0.0",
            description: "API documentation for YouTube Automatic Tools",
        },
        servers: [
            {
                url: "http://localhost:4000",
                description: "Local server",
            },
        ],
    },
    apis: [path.join(__dirname, "./routers/*.ts")], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
