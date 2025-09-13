import { EventStatus } from "./enums/event-list-enums";

export interface EventCardProps {
  eventName: string;
  status: EventStatus;
  date: string;
  description: string;
  clients: string;
  location: string;
  invites: number;
  rsvp: number;
  tasks: number;
  sits: number;
}
