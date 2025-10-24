export const formatWeeklyPeriod = (weekStart, weekEnd) => {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthName = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${monthName} ${startDay}-${endDay}, ${year}`;
  } else {
    const endMonthName = monthNames[end.getMonth()];
    return `${monthName} ${startDay} - ${endMonthName} ${endDay}, ${year}`;
  }
};

export const formatPeriod = (period) => {
  if (!period) return "";

  if (period.length === 4) {
    return period;
  }

  if (period.includes("-") && period.split("-").length === 2) {
    const [year, month] = period.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  if (period.includes("W")) {
    return `Week ${period.split("W")[1]}, ${period.split("-")[0]}`;
  }

  if (period.split("-").length === 3) {
    const [year, month, day] = period.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${parseInt(day)}, ${year}`;
  }

  return period;
};
