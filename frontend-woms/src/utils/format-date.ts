export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short", // Mar
      day: "2-digit", // 31
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  