import React from "react";
import styles from "./event-card.module.css";
import { Button, Divider } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { EventCardProps } from "../models/event-card-props-model";
import { EventStatus } from "../models/enums/event-list-enums";

export const EventCard: React.FC<EventCardProps> = ({
  eventName,
  status,
  date,
  description,
  clients,
  location,
  invites,
  rsvp,
  tasks,
  sits,
}) => {
  const statusCSSVariables: Record<EventStatus, string> = {
    [EventStatus.NOT_STARTED]: "var(--status-not-started)",
    [EventStatus.IN_PROGRESS]: "var(--status-in-progress)",
    [EventStatus.COMPLETED]: "var(--status-completed)",
    [EventStatus.CANCELED]: "var(--status-canceled)",
  };

  return (
    <div className={styles["event-card"]}>
      <div className={styles["event-card-container"]}>
        <div className={styles["event-card-left-side"]}>
          <div className={styles["event-card-content"]}>
            <div className={styles["event-card-header"]}>
              <div style={{ display: "flex" }}>
                <p>
                  {eventName} -{" "}
                  <span style={{ color: statusCSSVariables[status] }}>
                    {status}
                  </span>
                </p>
              </div>
              <p>{date}</p>
            </div>
            <Divider></Divider>
            <div className={styles["event-card-body"]}>
              <p>Description - {description}</p>
              <p>Clients - {clients}</p>
              <p>Location - {location}</p>
            </div>
            <div className={styles["event-card-footer"]}>
              <p>Invites - {invites}</p>
              <p>RSVPs - {rsvp}</p>
              <p>Tasks Pending - {tasks}</p>
              <p>Assigned Sits - {sits}</p>
            </div>
          </div>
        </div>
        <div className={styles["event-card-right-side"]}>
          <Button
            className={styles["event-card-button"]}
            style={{ backgroundColor: statusCSSVariables[status] }}
            type="text"
            icon={<EditOutlined />}
          ></Button>
        </div>
      </div>
    </div>
  );
};
