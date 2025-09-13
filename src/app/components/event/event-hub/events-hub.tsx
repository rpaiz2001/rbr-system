import Card from "@/app/common/Card/card";
import Header from "@/app/common/Header/header";
import React from "react";
import styles from "./events-hub.module.css";
import { useEvent } from "@/app/contexts/EventContext";

const EventsHub = () => {
  const {
    state: {
      events: { selectedEvent },
    },
  } = useEvent();
  return (
    <div className={styles["events-hub-wrapper"]}>
      <Header
        name={selectedEvent?.eventName || ""}
        items={[
          "1 year to go",
          "Started on August 6, 2025",
          "Wedding day on August 6, 2026",
          "Status in progress",
        ]}
      ></Header>
      <Card>
        <div>
          <p>Event 1</p>
        </div>
      </Card>
      <Card>
        <div>
          <p>Event 2</p>
        </div>
      </Card>
    </div>
  );
};

export default EventsHub;
