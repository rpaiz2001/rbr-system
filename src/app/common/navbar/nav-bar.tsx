import React from "react";
import styles from "./nav-bar.module.css";
import {
  BellOutlined,
  DownOutlined,
  PlusOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { Badge, Space, Button, Dropdown, MenuProps, message } from "antd";

type NavBarProps = {
  state: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export const NavBar: React.FC<NavBarProps> = ({ state, setCollapsed }) => {
  const items: MenuProps["items"] = [
    {
      label: "Emma & Liam’s Wedding",
      key: "1",
      icon: <GiftOutlined />,
    },
    {
      label: "Olivia & Noah’s Wedding",
      key: "2",
      icon: <GiftOutlined />,
    },
    {
      label: "Ava & Ethan’s Wedding",
      key: "3",
      icon: <GiftOutlined />,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    message.info("Click on menu item.");
    console.log("click", e);
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <div className={styles["navbar"]}>
      <div className={`${styles["navbar-item"]} ${styles["start"]}`}>
        <p
          className={styles["header"]}
          onClick={() => {
            setCollapsed(!state);
          }}
        >
          RBR Weddings
        </p>
      </div>
      <div className={`${styles["navbar-item"]} ${styles["end"]}`}>
        <Dropdown menu={menuProps}>
          <Button>
            <Space>
              Sarah & Mikes Wedding
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
        <Button icon={<PlusOutlined />} className={styles["button-color"]}>
          New Event
        </Button>
        <Badge
          count={3}
          size="small"
          style={{ backgroundColor: "var(--badge-color)" }}
        >
          <BellOutlined className={styles["icon"]} />
        </Badge>
      </div>
    </div>
  );
};
