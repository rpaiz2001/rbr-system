import React from "react";
import styles from "./event-card.module.css";
import { Button, Divider } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { EventCardProps } from "../models/event-card-props-model";

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
  return (
    <div className={styles["event-card"]}>
      <div className={styles["event-card-container"]}>
        <div className={styles["event-card-left-side"]}>
          <div className={styles["event-card-content"]}>
            <div className={styles["event-card-header"]}>
              <div style={{ display: "flex" }}>
                <p>
                  {eventName} -{" "}
                  <span style={{ color: "var(--progress-color)" }}>
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
            type="text"
            icon={<EditOutlined />}
          ></Button>
        </div>
      </div>
    </div>
  );
};
