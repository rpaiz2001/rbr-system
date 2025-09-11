import Card from "@/app/common/Card/card";
import Header from "@/app/common/Header/header";
import React from "react";
import styles from "./events-hub.module.css";

const EventsHub = () => {
  return (
    <div className={styles["events-hub-wrapper"]}>
      <Header name="Sarah & Mikes Wedding"></Header>
      <Card></Card>
      <Card></Card>
    </div>
  );
};

export default EventsHub;
