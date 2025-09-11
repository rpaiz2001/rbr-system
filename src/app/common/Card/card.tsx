import React from "react";
import styles from "./card.module.css";
const Card = () => {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        padding: "40px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2);",
        backgroundColor: "var(--primary-background)",
        borderRadius: "8px",
      }}
    >
      <p className={styles["header"]}>Header</p>
    </div>
  );
};

export default Card;
