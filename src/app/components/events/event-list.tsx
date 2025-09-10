import React from "react";
import styles from "./event-list.module.css";
import { EventCard } from "./components/event-card";
import { EventCardProps } from "./models/event-card-props-model";
import Header from "@/app/common/Header/header";

const EventList = () => {
  const eventList: EventCardProps[] = [
    {
      clients: "Sarah Fowler, Mike's Fuller",
      date: "28 August 2025",
      description: "Sarah's and Mike's wedding",
      eventName: "Sarah's and Mike's wedding plan for august",
      invites: 100,
      location: "San Antonio, Texas",
      status: "In Progress",
      rsvp: 100,
      sits: 100,
      tasks: 100,
    },
    {
      clients: "Sarah Fowler, Mike's Fuller",
      date: "28 August 2025",
      description: "Sarah's and Mike's wedding",
      eventName: "Sarah's and Mike's wedding plan for august",
      invites: 100,
      location: "San Antonio, Texas",
      status: "In Progress",
      rsvp: 100,
      sits: 100,
      tasks: 100,
    },
    {
      clients: "Sarah Fowler, Mike's Fuller",
      date: "28 August 2025",
      description: "Sarah's and Mike's wedding",
      eventName: "Sarah's and Mike's wedding plan for august",
      invites: 100,
      location: "San Antonio, Texas",
      status: "In Progress",
      rsvp: 100,
      sits: 100,
      tasks: 100,
    },
    {
      clients: "Sarah Fowler, Mike's Fuller",
      date: "28 August 2025",
      description: "Sarah's and Mike's wedding",
      eventName: "Sarah's and Mike's wedding plan for august",
      invites: 100,
      location: "San Antonio, Texas",
      status: "In Progress",
      rsvp: 100,
      sits: 100,
      tasks: 100,
    },
    {
      clients: "Sarah Fowler, Mike's Fuller",
      date: "28 August 2025",
      description: "Sarah's and Mike's wedding",
      eventName: "Sarah's and Mike's wedding plan for august",
      invites: 100,
      location: "San Antonio, Texas",
      status: "In Progress",
      rsvp: 100,
      sits: 100,
      tasks: 100,
    },
  ];
  return (
    <div className={styles["page-container"]}>
      <Header name="Planning Center" subheader="Events"></Header>
      <div className={styles["cards-container"]}>
        {eventList.map((element, index) => {
          return <EventCard {...element} key={index}></EventCard>;
        })}
      </div>
    </div>
  );
};

export default EventList;
