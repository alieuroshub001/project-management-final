// utils/dateUtils.ts
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end date
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const getBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }): string => {
  const now = new Date();
  const diffInMilliseconds = Math.abs(now.getTime() - date.getTime());
  const isPast = date < now;
  
  // Convert milliseconds to different units
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  let result = '';

  if (diffInYears > 0) {
    result = `${diffInYears} year${diffInYears > 1 ? 's' : ''}`;
  } else if (diffInMonths > 0) {
    result = `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}`;
  } else if (diffInWeeks > 0) {
    result = `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''}`;
  } else if (diffInDays > 0) {
    result = `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInHours > 0) {
    result = `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInMinutes > 0) {
    result = `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  } else {
    result = 'less than a minute';
  }

  if (options?.addSuffix) {
    return isPast ? `${result} ago` : `in ${result}`;
  }

  return result;
};