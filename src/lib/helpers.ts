/**
 * Pure UI helper functions — no mock data, no imports from mock-data
 */

export type ActorStatus = "Available" | "Booked" | "On Hold";
export type EventType   = "Audition" | "Callback" | "Booking" | "Meeting";
export type SubmissionStatus = "Submitted" | "Viewed" | "Shortlisted" | "Callback" | "Booked" | "Rejected";

export function getStatusVariant(status: ActorStatus) {
  switch (status) {
    case "Available": return "available" as const;
    case "Booked":    return "booked"    as const;
    case "On Hold":   return "on-hold"   as const;
  }
}

export function getEventVariant(type: EventType) {
  switch (type) {
    case "Audition": return "audition" as const;
    case "Callback": return "callback" as const;
    case "Booking":  return "booking"  as const;
    case "Meeting":  return "meeting"  as const;
  }
}

export function getSubmissionStatusColor(status: SubmissionStatus) {
  switch (status) {
    case "Submitted":  return "text-muted-foreground";
    case "Viewed":     return "text-event-audition";
    case "Shortlisted":return "text-event-callback";
    case "Callback":   return "text-event-callback";
    case "Booked":     return "text-status-available";
    case "Rejected":   return "text-destructive";
  }
}
