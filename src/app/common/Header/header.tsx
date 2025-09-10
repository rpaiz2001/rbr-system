import React from "react";
import { Divider } from "antd";
import styles from "./header.module.css";

const Header = ({ name, subheader }: { name: string; subheader?: string }) => {
  const items: string[] = [
    "1 year to go",
    "Started on 6 August 2025",
    "Wedding day on 6 August 2026",
    "Planning in progress",
  ];
  return (
    <div className={styles["header"]}>
      <h1>{name}</h1>
      {subheader && (
        <div className={styles["sub-header-container"]}>
          <Divider plain>
            <h2>{subheader}</h2>
          </Divider>
        </div>
      )}
      <div
        style={{
          display: "flex",
          maxWidth: "100vw",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {items.map((element, index) => {
          return (
            <div
              key={index}
              style={{
                display: "flex",
                width: "fit-content",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ width: "30px !important" }}>
                <Divider></Divider>
              </div>{" "}
              <p style={{ height: "fit-content", maxWidth: "200px" }}>
                element
              </p>
              <div style={{ width: "30px !important" }}>
                <Divider></Divider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
