import { Express } from "./config/Express";
import { config } from "dotenv";

config()

const PORT = process.env.PORT || 4000;

export default new Express().server.listen(PORT, () => console.log(`Server running on port ${PORT}`))