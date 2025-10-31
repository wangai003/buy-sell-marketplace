import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const { days, hours, minutes, seconds } = timeLeft;

  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return <span className="text-danger fw-bold">Auction Ended</span>;
  }

  return (
    <div className="countdown-timer text-center">
      <small className="text-muted">Time Left:</small>
      <div className="d-flex justify-content-center gap-2 mt-1">
        {days > 0 && (
          <span className="badge bg-warning text-dark">
            {days}d
          </span>
        )}
        <span className="badge bg-warning text-dark">
          {hours}h
        </span>
        <span className="badge bg-warning text-dark">
          {minutes}m
        </span>
        <span className="badge bg-warning text-dark">
          {seconds}s
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;