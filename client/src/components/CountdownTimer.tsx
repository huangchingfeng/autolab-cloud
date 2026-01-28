import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date | string;
  title?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, title = "距離活動開始" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4 text-center">
        <p className="text-lg font-semibold text-green-600">活動進行中</p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
        <span className="text-2xl sm:text-3xl font-bold">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs sm:text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
      </div>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <TimeBlock value={timeLeft.days} label="天" />
        <span className="text-2xl font-bold text-primary/50 mt-[-1rem]">:</span>
        <TimeBlock value={timeLeft.hours} label="時" />
        <span className="text-2xl font-bold text-primary/50 mt-[-1rem]">:</span>
        <TimeBlock value={timeLeft.minutes} label="分" />
        <span className="text-2xl font-bold text-primary/50 mt-[-1rem]">:</span>
        <TimeBlock value={timeLeft.seconds} label="秒" />
      </div>
    </div>
  );
}
