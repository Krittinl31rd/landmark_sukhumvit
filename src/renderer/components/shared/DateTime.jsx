import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const DateTime = () => {
  const [dateTime, setDateTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm font-bold text-primary-content">
      {dateTime.format("DD-MM-YYYY HH:mm:ss")}
    </div>
  );
};

export default DateTime;
