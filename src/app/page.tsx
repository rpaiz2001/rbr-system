"use client";

import { NavBar } from "./common/navbar/nav-bar";
import styles from "./page.module.css";
import { Menu, MenuProps } from "antd";
import {
  HomeOutlined,
  ScheduleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import EventsHub from "./components/event/event-hub/events-hub";
import EventList from "./components/events-list/event-list";
import TableAssignmentPage from "./components/event/table-assignment/TableAssignmentPage";
import CreateEventModal from "./components/event/create-event-modal/create-event-modal";
export default function Home() {
  type MenuItem = Required<MenuProps>["items"][number];

  const [currentView, setCurrentView] = useState("events-hub");

  const renderContent = () => {
    switch (currentView) {
      case "events-hub":
        return <EventsHub />;
      case "events-list":
        return <EventList />;
      case "table-assignment":
        return <TableAssignmentPage />;
      default:
        return <EventsHub />;
    }
  };

  const items: MenuItem[] = [
    {
      key: "events",
      label: "Events",
      icon: <ScheduleOutlined />,
      children: [
        {
          key: "events-hub",
          label: "Events Hub",
          icon: <HomeOutlined />,
          onClick: () => setCurrentView("events-hub"),
        },
        {
          key: "events-list",
          label: "Events List",
          icon: <UnorderedListOutlined />,
          onClick: () => setCurrentView("events-list"),
        },
        {
          key: "table-assignment",
          label: "Table Assignment",
          icon: <TeamOutlined />,
          onClick: () => setCurrentView("table-assignment"),
        },
      ],
    },
    {
      type: "divider",
    },
    {
      key: "sub4",
      label: "Navigation Three",
      icon: <SettingOutlined />,
      children: [
        { key: "9", label: "Option 9" },
        { key: "10", label: "Option 10" },
        { key: "11", label: "Option 11" },
        { key: "12", label: "Option 12" },
      ],
    },
  ];

  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={styles["page"]}>
      <NavBar state={collapsed} setCollapsed={setCollapsed} />
      <div className={styles["page-container"]}>
        <div className={styles["menu-container"]}>
          <Menu
            onClick={() => {}}
            style={{
              maxWidth: "fit-content",
            }}
            className={styles["sidebar"]}
            mode="inline"
            inlineCollapsed={collapsed}
            items={items}
          />
        </div>
        <div className={styles["page-content"]}>{renderContent()}</div>
      </div>

      <CreateEventModal></CreateEventModal>
    </div>
  );
}
