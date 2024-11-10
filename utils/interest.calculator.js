// /**
//  * Function to calculate interest, principal, and total amount.
//  * @param {number} principal - The principal amount.
//  * @param {number} ratePerUnit - The rate per 100 units of the principal (e.g., 3 rupees for 100 rupees).
//  * @param {number} period - The period of the loan (in years or months).
//  * @param {string} periodType - The type of period ('month' or 'year').
//  * @param {Date} startDate - The start date of the loan.
//  * @returns {Object} - The calculated interest and total amounts.
//  */
// function calculateInterest(
//   principal,
//   ratePerUnit,
//   period,
//   periodType = "month",
//   startDate = new Date()
// ) {
//   const currentDate = new Date();

//   // If period is given in years, convert to months
//   let months = periodType === "year" ? period * 12 : period;

//   // Calculate interest for the given period (rate is monthly in this case)
//   let interestPerMonth = (ratePerUnit * principal) / 100; // Monthly interest for 100 units of principal
//   let totalInterest = interestPerMonth * months;

//   // Calculate total amount (principal + interest)
//   let totalAmount = principal + totalInterest;

//   // Calculate the time difference in months from the startDate to the current date
//   const monthsElapsed = Math.floor(
//     (currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)
//   ); // Roughly calculate months elapsed

//   // Interest for the months passed since start date
//   let interestForElapsedMonths = interestPerMonth * monthsElapsed;

//   // Total amount including interest for the elapsed months
//   let totalAmountForElapsedMonths = principal + interestForElapsedMonths;

//   // Return the results
//   return {
//     principal,
//     interestPerMonth,
//     totalInterest,
//     totalAmount,
//     monthsElapsed,
//     interestForElapsedMonths,
//     totalAmountForElapsedMonths,
//   };
// }

// // Export the function to make it reusable
// module.exports = { calculateInterest };

// interestCalculator.js

/**
 * Function to calculate interest, principal, and total amount with partial payments.
 * @param {number} principal - The principal amount.
 * @param {number} ratePerUnit - The rate per 100 units of the principal (e.g., 3 rupees for 100 rupees).
 * @param {number} period - The period of the loan (in years or months).
 * @param {string} periodType - The type of period ('month' or 'year').
 * @param {Date} startDate - The start date of the loan.
 * @param {number} partialPayment - The partial payment made by the lender.
 * @param {string} paymentPeriodType - The type of the period when payment is made ('month' or 'year').
 * @returns {Object} - The calculated interest, principal, and total amounts.
 */
function calculateInterest(
  principal,
  ratePerUnit,
  period,
  periodType = "month",
  startDate = new Date(),
  partialPayment = 0,
  paymentPeriodType = "year"
) {
  const currentDate = new Date();

  // If period is given in years, convert to months
  let months = periodType === "year" ? period * 12 : period;

  // Calculate interest per month for the given principal
  let interestPerMonth = (ratePerUnit * principal) / 100; // Monthly interest for 100 units of principal
  let totalInterest = interestPerMonth * months;

  // If the lender made a partial payment, subtract it from the total interest
  if (partialPayment > 0) {
    // Calculate how much interest is paid for the partial payment period
    const partialMonths = paymentPeriodType === "year" ? 12 : 1; // 12 months if payment is for a year, else 1 month
    let interestPaid = interestPerMonth * partialMonths;

    // Subtract the partial payment from the total interest
    totalInterest -= partialPayment;

    // Adjust the total interest for the remaining period
    let remainingInterest = totalInterest;

    // Update the total interest and remaining interest
    totalInterest = Math.max(remainingInterest, 0);
  }

  // Calculate the total amount (principal + total interest)
  let totalAmount = principal + totalInterest;

  // Calculate the time difference in months from the startDate to the current date
  const monthsElapsed = Math.floor(
    (currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)
  ); // Roughly calculate months elapsed

  // Interest for the months passed since start date
  let interestForElapsedMonths = interestPerMonth * monthsElapsed;

  // Total amount including interest for the elapsed months
  let totalAmountForElapsedMonths = principal + interestForElapsedMonths;

  // Return the results
  return {
    principal,
    interestPerMonth,
    totalInterest,
    totalAmount,
    monthsElapsed,
    interestForElapsedMonths,
    totalAmountForElapsedMonths,
    partialPayment,
    remainingInterest: totalInterest, // Remaining interest after the partial payment
  };
}

// Export the function to make it reusable
module.exports = { calculateInterest };
