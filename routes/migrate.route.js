const express = require("express");
const mongoose = require("mongoose");
const Loan = require("../database/models/loan.model"); // Adjust the path to your Loan model
require("dotenv").config(); // Load environment variables from .env file

const router = express.Router();

// Migration endpoint (protected route)
router.post("/migrate-loans", async (req, res) => {
  try {
    // Connect to the database
    const dbUri = process.env.DEV_MONGO_URL;
    if (!dbUri) {
      throw new Error(
        "Database connection string is undefined. Check DEV_MONGO_URL in your .env file."
      );
    }

    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");

    // Perform the migration
    const result = await Loan.updateMany(
      { status: { $exists: false } }, // Check if `status` doesn't exist
      {
        $set: { status: "active", isArchived: false }, // Add default values
      }
    );

    console.log(`Migration complete: ${result.modifiedCount} loans updated.`);
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} loans updated.`,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    res.status(500).json({
      success: false,
      message: "Error during migration.",
      error: error.message,
    });
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
});

module.exports = router;
