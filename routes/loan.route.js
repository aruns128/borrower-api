const express = require("express");
const { calculateInterest } = require("../utils/interest.calculator"); // Import the interest calculation function
const Loan = require("../database/models/loan.model"); // Import the Loan model
const { auth } = require("../middleware/auth"); // Import the auth middleware

const router = express.Router();

// Route to create a new loan
router.post("/create-loan", auth, async (req, res) => {
  const {
    borrowerName,
    borrowerPhoneNumber,
    borrowerAlternativeNumber,
    borrowerAddress,
    borrowerLoanDocument,
    lenderName,
    principal,
    ratePerUnit,
    period,
    periodType,
    startDate,
    partialPayment,
    paymentPeriodType,
  } = req.body;

  // Input validation
  if (
    !borrowerName ||
    !borrowerPhoneNumber ||
    !borrowerAddress ||
    !principal ||
    !ratePerUnit ||
    !period ||
    !periodType ||
    !startDate ||
    !lenderName
  ) {
    return res.status(400).send({
      success: false,
      message: "Missing required parameters",
    });
  }

  // Parse startDate to Date object
  const start = new Date(startDate);
  if (isNaN(start)) {
    return res.status(400).send({
      success: false,
      message: "Invalid start date",
    });
  }

  try {
    // Calculate interest and other values
    const result = calculateInterest(
      principal,
      ratePerUnit,
      period,
      periodType,
      start,
      partialPayment,
      paymentPeriodType
    );

    // Save the loan and calculation results to MongoDB
    const newLoan = new Loan({
      borrower: {
        name: borrowerName,
        phoneNumber: borrowerPhoneNumber,
        alternativeNumber: borrowerAlternativeNumber,
        address: borrowerAddress,
        loanDocument: borrowerLoanDocument,
      },
      lender: {
        name: lenderName,
      },
      principal,
      ratePerUnit,
      period,
      periodType,
      startDate: start,
      interestPerMonth: result.interestPerMonth,
      totalInterest: result.totalInterest,
      totalAmount: result.totalAmount,
      monthsElapsed: result.monthsElapsed,
      interestForElapsedMonths: result.interestForElapsedMonths,
      totalAmountForElapsedMonths: result.totalAmountForElapsedMonths,
      partialPayment: partialPayment,
      paymentPeriodType: paymentPeriodType,
      remainingInterest: result.remainingInterest,
      owner: req.id, // Attach the authenticated user's ID to the loan
    });

    // Save the loan document in the database
    await newLoan.save();

    // Send the result as a response
    res.send({
      success: true,
      message: "Loan created and interest calculated successfully",
      loan: newLoan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
});

// Route to get all loans (requires authentication)
router.get("/loans", auth, async (req, res) => {
  try {
    const loans = await Loan.find({ owner: req.id }); // Fetch loans belonging to the authenticated user
    res.send({
      success: true,
      message: "Loans fetched successfully",
      loans,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error fetching loans",
    });
  }
});

// Route to get a specific loan by ID (requires authentication)
router.get("/loans/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await Loan.findOne({ _id: id, owner: req.id }); // Fetch loan by ID for the authenticated user
    if (!loan) {
      return res.status(404).send({
        success: false,
        message: "Loan not found or not authorized",
      });
    }
    res.send({
      success: true,
      message: "Loan fetched successfully",
      loan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error fetching loan",
    });
  }
});

// Route to delete a specific loan by ID (requires authentication)
router.delete("/loans/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await Loan.findOneAndDelete({ _id: id, owner: req.id }); // Delete loan by ID for the authenticated user
    if (!loan) {
      return res.status(404).send({
        success: false,
        message: "Loan not found or not authorized",
      });
    }
    res.send({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deleting loan",
    });
  }
});

// Route to update a specific loan by ID (requires authentication)
router.put("/loans/:id", auth, async (req, res) => {
  const { id } = req.params;
  const {
    principal,
    ratePerUnit,
    period,
    periodType,
    startDate,
    partialPayment,
    paymentPeriodType,
  } = req.body;

  try {
    const updatedLoan = await Loan.findOneAndUpdate(
      { _id: id, owner: req.id }, // Only allow updates for the authenticated user
      {
        principal,
        ratePerUnit,
        period,
        periodType,
        startDate,
        partialPayment,
        paymentPeriodType,
      },
      { new: true } // New: true returns the updated document
    );

    if (!updatedLoan) {
      return res.status(404).send({
        success: false,
        message: "Loan not found or not authorized",
      });
    }

    res.send({
      success: true,
      message: "Loan updated successfully",
      loan: updatedLoan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error updating loan",
    });
  }
});

module.exports = router;
