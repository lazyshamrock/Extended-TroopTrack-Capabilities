export function getThirdTuesdayDate(myDate) {
    var workingDate = new Date(myDate.getUTCFullYear(),myDate.getMonth(),1)

    // Calculate the day of the week for the first day (0: Sunday, 1: Monday, etc.)
    var firstDayOfWeek = workingDate.getDay();
  
    // Calculate the number of days until the next Tuesday
    var daysUntilTuesday = (2 - firstDayOfWeek + 7) % 7;
  
    // Add 14 days to reach the third Tuesday of the month
    var thirdTuesdayDate = new Date(workingDate.getUTCFullYear(), workingDate.getMonth(), 1 + daysUntilTuesday + 14);
  
    // Format the date as YYYY-MM-DD
    // var formattedDate = thirdTuesdayDate.toISOString().slice(0, 10);
  
    return thirdTuesdayDate;
}