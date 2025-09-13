import React from "react";
import { Divider } from "antd";
import styles from "./header.module.css";

const Header = ({
  name,
  subheader,
  items,
}: {
  name: string;
  subheader?: string;
  items?: string[];
}) => {
  return (
    <div className={styles["header"]}>
      <h2>{name}</h2>
      {subheader && (
        <div className={styles["sub-header-container"]}>
          <Divider plain>
            <h3>{subheader}</h3>
          </Divider>
        </div>
      )}
      <div
        style={{
          display: "flex",
          maxWidth: "100vw",
          flexWrap: "wrap",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {items?.map((element, index) => {
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
              <div>
                <Divider></Divider>
              </div>
              <p
                style={{
                  height: "fit-content",
                  maxWidth: "200px",
                  fontSize: "0.8rem",
                  color: "var(--text-color-secondary)",
                  fontWeight: "var(--bold-font)",
                }}
              >
                {element}
              </p>
              {index !== items.length - 1 && (
                <div style={{ color: "black" }}>
                  <Divider style={{ width: "30px" }}></Divider>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
