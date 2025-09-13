import React from "react";
import styles from "./card.module.css";
const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles["card"]}>
      <p className={styles["header"]}>Header</p>
      <div>{children}</div>
    </div>
  );
};

export default Card;
