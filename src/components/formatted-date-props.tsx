import React from 'react';

interface FormattedDateProps {
  date: string | Date;
}

const FormattedDate: React.FC<FormattedDateProps> = ({ date }) => {
  const formattedDate = new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true, // 12-hour time format
  });

  return <>{formattedDate}</>;
};

export default FormattedDate;
