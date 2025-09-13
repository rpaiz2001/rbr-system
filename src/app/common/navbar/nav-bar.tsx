import React from "react";
import styles from "./nav-bar.module.css";
import { BellOutlined, DownOutlined, PlusOutlined } from "@ant-design/icons";
import { Badge, Space, Button, Dropdown, MenuProps } from "antd";
import { eventList } from "@/app/data/EventList";
import { EventStatus } from "@/app/components/events-list/models/enums/event-list-enums";
import { useEvent } from "@/app/contexts/EventContext";
import { EventActions } from "@/app/contexts/EventActions";

type NavBarProps = {
  state: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export const NavBar: React.FC<NavBarProps> = ({ setCollapsed }) => {
  const {
    state,
    state: {
      events: { selectedEvent },
    },
    dispatch,
  } = useEvent();

  const mapEventList = eventList
    .filter((item) => item.status === EventStatus.IN_PROGRESS)
    .map((item) => {
      const originalIndex = eventList.findIndex((event) => event === item);
      return {
        label: item.eventName,
        key: originalIndex.toString(),
      };
    });

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const eventIndex = parseInt(e.key as string);
    dispatch({
      type: EventActions.SET_SELECTED_EVENT,
      payload: eventIndex,
    });
  };

  const menuProps = {
    items: mapEventList,
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
              {selectedEvent?.eventName || "Select Event"}
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
