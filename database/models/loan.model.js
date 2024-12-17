const mongoose = require("mongoose");

// Define the schema for loan information
const loanSchema = new mongoose.Schema({
  borrower: {
    name: { type: String, required: true }, // Borrower's name
    phoneNumber: { type: String, required: true }, // Borrower's phone number
    alternativeNumber: { type: String }, // Borrower's alternative phone number
    address: { type: String, required: true }, // Borrower's address
    loanDocument: { type: String, required: true }, // Store the URL to the document (e.g., S3 URL)
  },
  lender: {
    name: { type: String, required: true }, // Lender's name
  },
  principal: { type: Number, required: true }, // The principal loan amount
  ratePerUnit: { type: Number, required: true }, // The rate per 100 units of the principal (e.g., 2 for 2 rupees per 100)
  period: { type: Number, required: true }, // The total period of the loan in months or years
  periodType: { type: String, enum: ["month", "year"], required: true }, // Period type (month or year)
  startDate: { type: Date, required: true }, // The start date of the loan
  interestPerMonth: { type: Number, required: true }, // Monthly interest for the principal
  totalInterest: { type: Number, required: true }, // Total interest over the entire period
  totalAmount: { type: Number, required: true }, // Total amount (principal + total interest)
  monthsElapsed: { type: Number, required: true }, // Number of months elapsed from start date
  interestForElapsedMonths: { type: Number, required: true }, // Interest accrued for elapsed months
  totalAmountForElapsedMonths: { type: Number, required: true }, // Total amount for elapsed months
  partialPayment: { type: Number, default: 0 }, // Partial payment made by the borrower (e.g., paid interest for a year)
  interestPeriodType: { type: String, enum: ["month", "year"], required: true }, // Period type of the partial payment (month or year)
  remainingInterest: { type: Number, required: true }, // Remaining interest after partial payment
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Lender's ID (User model reference)
  status: {
    type: String,
    enum: ["active", "returned", "overdue"],
    default: "active",
  },
  isArchived: { type: Boolean, default: false }, // Whether the loan is archived
});

// Create a model from the schema
const Loan = mongoose.model("Loan", loanSchema);

module.exports = Loan;
