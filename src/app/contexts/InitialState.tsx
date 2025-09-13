import { EventCardProps } from "../components/events-list/models/event-card-props-model";

export interface EventContextInterface {
  events: {
    selectedEvent: EventCardProps | null;
    allEvents: EventCardProps[];
    openCreateOpenModal: boolean;
  };
}
