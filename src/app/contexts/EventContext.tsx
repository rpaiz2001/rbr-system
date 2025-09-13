"use client";

import React, { createContext, ReactNode, useContext, useReducer } from "react";
import { EventContextInterface } from "./InitialState";
import { EventAction, EventActions } from "./EventActions";
import { eventList } from "../data/EventList";

const initialState: EventContextInterface = {
  events: {
    allEvents: eventList,
    selectedEvent: null,
    openCreateOpenModal: false,
  },
};

function eventReducer(
  state: EventContextInterface,
  action: EventAction
): EventContextInterface {
  switch (action.type) {
    case EventActions.SET_ALL_EVENTS:
      return {
        ...state,
        events: {
          ...state.events,
          allEvents: action.payload,
        },
      };
    case EventActions.SET_OPEN_CREATE_EVENT_MODAL:
      return {
        ...state,
        events: {
          ...state.events,
          openCreateOpenModal: action.payload,
        },
      };
    case EventActions.SET_SELECTED_EVENT:
      console.log(state.events.allEvents[action.payload ?? 0]);
      return {
        ...state,
        events: {
          ...state.events,
          selectedEvent: state.events.allEvents[action.payload ?? 0],
        },
      };
    default:
      return state;
  }
}
const EventContext = createContext<{
  state: EventContextInterface;
  dispatch: React.Dispatch<EventAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  const value = {
    state,
    dispatch,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};
