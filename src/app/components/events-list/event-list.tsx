import React from "react";
import styles from "./event-list.module.css";
import { EventCard } from "./components/event-card";
import Header from "@/app/common/Header/header";
import { EventStatus } from "./models/enums/event-list-enums";
import { eventList } from "@/app/data/EventList";
import { EventCardProps } from "./models/event-card-props-model";

const EventList = () => {
  const sortedEvents = eventList.sort((a, b) => {
    const statusOrder = {
      [EventStatus.IN_PROGRESS]: 1,
      [EventStatus.NOT_STARTED]: 2,
      [EventStatus.CANCELED]: 3,
      [EventStatus.COMPLETED]: 4,
    };

    return statusOrder[a.status] - statusOrder[b.status];
  });

  const getStatusCounts = (events: EventCardProps[]) => {
    const counts = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<EventStatus, number>);

    return Object.entries(counts).map(([status, count]) => {
      const statusText = status.replace(/([A-Z])/g, " $1").trim();
      return `${count} ${statusText}`;
    });
  };

  return (
    <div className={styles["page-container"]}>
      <Header
        name="Events"
        items={getStatusCounts(eventList)}
        subheader="Planning Center"
      ></Header>
      <div className={styles["cards-container"]}>
        {sortedEvents.map((element, index) => {
          return <EventCard {...element} key={index}></EventCard>;
        })}
      </div>
    </div>
  );
};

export default EventList;
