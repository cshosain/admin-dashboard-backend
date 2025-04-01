import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.route.js";
import generalUserRoutes from "./routes/generalUser.route.js";
import shoeRoutes from "./routes/shoes.route.js";
import bkashRoutes from "./routes/payment.bkash.route.js";
import bodyParser from "body-parser";

dotenv.config(); // Load environment variables at the top

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(bodyParser.json());

// ROUTES
app.use("/api/generalUsers", generalUserRoutes); // General Users
app.use("/api", userRoutes); // Admin Users
app.use("/api/shoes", shoeRoutes); // Products (Shoes)
app.use("/api", bkashRoutes); // Bkash Payment

const startServer = async () => {
  try {
    const { primary, secondary } = await connectDB(); // Connect to DB before starting server
    console.log("All DB connections established successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Exit with failure if DB connection fails
  }
};

startServer();
