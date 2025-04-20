"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  filters: { startDate: string | null; endDate: string | null };
  setFilters: React.Dispatch<
    React.SetStateAction<{ startDate: string | null; endDate: string | null }>
  >;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  filters,
  setFilters,
}) => {
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    let fromDate = filters.startDate ? new Date(filters.startDate) : undefined;
    let toDate = filters.endDate ? new Date(filters.endDate) : undefined;
  
    return {
      from: fromDate,
      to: toDate,
    };
  });
  
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    setFilters({
      startDate: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : null,
      endDate: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : null,
    });
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
