import { EventCardProps } from "../components/events-list/models/event-card-props-model";

export enum EventActions {
  SET_OPEN_CREATE_EVENT_MODAL = "SET_OPEN_CREATE_EVENT_MODAL",
  SET_SELECTED_EVENT = "SET_SELECTED_EVENT",
  SET_ALL_EVENTS = "SET_ALL_EVENTS",
}

export type EventAction =
  | { type: EventActions.SET_ALL_EVENTS; payload: EventCardProps[] }
  | { type: EventActions.SET_SELECTED_EVENT; payload: number | null }
  | { type: EventActions.SET_OPEN_CREATE_EVENT_MODAL; payload: boolean };
