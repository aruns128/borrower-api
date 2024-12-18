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
    interestPeriodType,
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
      interestPeriodType
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
      interestPeriodType: interestPeriodType,
      remainingInterest: result.remainingInterest,
      owner: req.id, // Attach the authenticated user's ID to the loan
    });

    //Save the loan document in the database
    await newLoan.save();
    // Send the result as a response
    res.send({
      success: true,
      message: "Loan created and interest calculated successfully",
      loan: [],
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

// router.get("/dashboard", async (req, res) => {
//   try {
//     const data = await Loan.aggregate([
//       {
//         $group: {
//           _id: "$lender.name", // Group by lender name
//           totalPrincipal: { $sum: "$principal" }, // Sum up principal amounts
//         },
//       },
//       {
//         $project: {
//           lenderName: "$_id", // Rename _id to lenderName
//           totalPrincipal: 1,
//           _id: 0,
//         },
//       },
//     ]);

//     res.status(200).json({ success: true, data });
//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// });

// // Route to get total principal by lender name (requires authentication)
// router.get("/total-principal-by-lender", auth, async (req, res) => {
//   try {
//     // Aggregate the total principal amount by lender name
//     const loan = await Loan.findOne({ _id: id, owner: req.id }); // Fetch loan by ID for the authenticated user

//     console.log(req.id);

//     res.send({
//       success: true,
//       message: "Total principal by lender fetched successfully",
//       totalByLender,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       success: false,
//       message: "Error fetching total principal by lender",
//     });
//   }
// });
router.get("/dashboard", async (req, res) => {
  try {
    const data = await Loan.aggregate([
      {
        $match: {
          isArchived: { $ne: true }, // Exclude documents where isArchived is true
        },
      },
      {
        $group: {
          _id: { lender: "$lender.name", borrower: "$borrower.name" },
          totalPrincipal: { $sum: "$principal" },
        },
      },
      {
        $group: {
          _id: "$_id.lender",
          totalPrincipal: { $sum: "$totalPrincipal" },
          borrowers: {
            $push: {
              borrowerName: "$_id.borrower",
              totalPrincipalAmount: "$totalPrincipal",
            },
          },
        },
      },
      {
        $project: {
          lenderName: "$_id",
          totalPrincipal: 1,
          borrowers: 1,
          _id: 0,
        },
      },
      {
        $unwind: "$borrowers",
      },
      {
        $lookup: {
          from: "loans", // The collection name containing the loan details
          localField: "borrowers.borrowerName",
          foreignField: "borrower.name",
          as: "borrowers.loans",
        },
      },
      {
        $group: {
          _id: "$lenderName",
          totalPrincipal: { $first: "$totalPrincipal" },
          borrowers: { $push: "$borrowers" },
        },
      },
      {
        $project: {
          lenderName: "$_id",
          totalPrincipal: 1,
          borrowers: {
            $map: {
              input: "$borrowers",
              as: "borrower",
              in: {
                borrowerName: "$$borrower.borrowerName",
                totalPrincipalAmount: "$$borrower.totalPrincipalAmount",
                loans: "$$borrower.loans",
              },
            },
          },
        },
      },
      {
        $sort: { "borrowers.totalPrincipalAmount": -1 }, // Sort borrowers by total principal amount
      },
    ]);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/loans", async (req, res) => {
  const { lenderName } = req.query; // Extract lender name from query parameters

  if (!lenderName) {
    return res.status(400).json({
      success: false,
      message: "Lender name is required",
    });
  }

  try {
    const loans = await Loan.find({ "lender.name": lenderName });

    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No loans found for lender: ${lenderName}`,
      });
    }

    res.status(200).json({
      success: true,
      data: loans,
    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

// Route to edit a specific loan by ID
router.put("/loans/:id", auth, async (req, res) => {
  const { id } = req.params;
  const {
    borrowerName,
    borrowerPhoneNumber,
    borrowerAlternativeNumber,
    borrowerAddress,
    principal,
    ratePerUnit,
    period,
    periodType,
    startDate,
    partialPayment,
    interestPeriodType,
  } = req.body;

  // Validate input
  if (!borrowerName || !borrowerPhoneNumber || !principal || !ratePerUnit) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields for loan update",
    });
  }

  try {
    const loan = await Loan.findOne({ _id: id, owner: req.id });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found or not authorized",
      });
    }

    // Update loan fields
    loan.borrower.name = borrowerName;
    loan.borrower.phoneNumber = borrowerPhoneNumber;
    loan.borrower.alternativeNumber = borrowerAlternativeNumber;
    loan.borrower.address = borrowerAddress;
    loan.principal = principal;
    loan.ratePerUnit = ratePerUnit;
    loan.period = period;
    loan.periodType = periodType;
    loan.startDate = new Date(startDate);
    loan.partialPayment = partialPayment;
    loan.interestPeriodType = interestPeriodType;

    // Recalculate interest
    const result = calculateInterest(
      loan.principal,
      loan.ratePerUnit,
      loan.period,
      loan.periodType,
      loan.startDate,
      loan.partialPayment,
      loan.interestPeriodType
    );

    loan.interestPerMonth = result.interestPerMonth;
    loan.totalInterest = result.totalInterest;
    loan.totalAmount = result.totalAmount;
    loan.interestForElapsedMonths = result.interestForElapsedMonths;
    loan.totalAmountForElapsedMonths = result.totalAmountForElapsedMonths;
    loan.remainingInterest = result.remainingInterest;

    await loan.save();

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      loan,
    });
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({
      success: false,
      message: "Error updating loan",
    });
  }
});

// Route to delete a specific loan by ID
router.delete("/loans/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: id, owner: req.id },
      { isArchived: true, status: "returned" }, // Archive the loan by setting isArchived to true
      { new: true } // Return the updated loan document
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found or not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan archived successfully",
    });
  } catch (error) {
    console.error("Error archiving loan:", error);
    res.status(500).json({
      success: false,
      message: "Error archiving loan",
    });
  }
});

module.exports = router;
