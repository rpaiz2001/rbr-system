"use client";
import styles from "./table-assignment-page.module.css";
import data from "@/data/tables-data.json";
import {
  Badge,
  Card,
  Empty,
  Input,
  List,
  message,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  Button,
  Tooltip,
} from "antd";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import SeatingAIChat from "./SeatingAIChat";
import { FloatButton } from "antd";
import {
  BorderOutlined,
  ColumnWidthOutlined,
  ArrowsAltOutlined,
  TeamOutlined,
  MessageOutlined,
  CloseOutlined,
} from "@ant-design/icons";
// ...existing code...
import type {
  HFGuest,
  HFTable,
  SeatingResponse as HFSeatingResponse,
} from "./huggingface.service";

type Relation = {
  relation_id: string;
  name: string;
  description?: string | null;
};

type Guest = {
  guest_id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  relation_id: string;
  plus_one: boolean;
  rsvp_status: string;
  party_size: number;
  dietary_restrictions?: string | null;
  accessibility_needs?: string | null;
  notes?: string | null;
};

import { UserOutlined } from "@ant-design/icons";
type TableLayout = {
  layout_id: string;
  event_id: string;
  x_grid_size: number;
  y_grid_size: number;
  name: string;
  description?: string | null;
  is_active: boolean;
};

type Table = {
  table_id: string;
  layout_id: string;
  total_number: number;
  shape: "round" | "rectangular" | "square" | string;
  x_grid: number;
  y_grid: number;
};

type TableAssignment = {
  table_id: string;
  guest_id: string;
  seat_number: number;
};

type DragId = `guest:${string}` | `table:${string}` | "unassigned";

function fullName(g: Pick<Guest, "first_name" | "last_name">) {
  return `${g.first_name} ${g.last_name}`.trim();
}

function parseGuestIdFromDragId(id: unknown) {
  if (typeof id !== "string") return null;
  if (!id.startsWith("guest:")) return null;
  const guestId = id.slice("guest:".length);
  return guestId || null;
}

function getShapeIcon(shape: Table["shape"]) {
  switch (shape) {
    case "round":
      return <BorderOutlined />;
    case "rectangular":
      return <ColumnWidthOutlined />;
    case "square":
      return <ArrowsAltOutlined />;
    default:
      return <BorderOutlined />;
  }
}

function getNextAvailableSeatNumber(
  capacity: number,
  usedSeatNumbers: number[],
) {
  const used = new Set(usedSeatNumbers);
  for (let seat = 1; seat <= capacity; seat += 1) {
    if (!used.has(seat)) return seat;
  }
  return null;
}

const DraggableGuestRow = memo(function DraggableGuestRow({
  guest,
  relationName,
  isAssigned,
}: {
  guest: Guest;
  relationName?: string;
  isAssigned: boolean;
}) {
  const dragId: DragId = `guest:${guest.guest_id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId,
      data: { guestId: guest.guest_id },
    });

  const style: CSSProperties = useMemo(
    () =>
      transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : {},
    [transform],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        styles.draggableGuest,
        isDragging ? styles.dragging : "",
      ].join(" ")}
      {...listeners}
      {...attributes}
    >
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Space size={8} wrap>
          <Typography.Text strong>{fullName(guest)}</Typography.Text>
          {isAssigned ? (
            <Tag color="green">Assigned</Tag>
          ) : (
            <Tag>Unassigned</Tag>
          )}
          {guest.plus_one ? <Tag color="purple">+1</Tag> : null}
        </Space>
        <Space size={6} wrap>
          {relationName ? (
            <Tag color="gold">{relationName}</Tag>
          ) : (
            <Tag>Unknown relation</Tag>
          )}
          {guest.dietary_restrictions ? (
            <Tag color="green">{guest.dietary_restrictions}</Tag>
          ) : null}
          {guest.accessibility_needs ? (
            <Tag color="red">{guest.accessibility_needs}</Tag>
          ) : null}
        </Space>
      </Space>
    </div>
  );
});

const TableTileContent = memo(function TableTileContent({
  table,
  occupancy,
  capacity,
  label,
  badgeColor,
}: {
  table: Table;
  occupancy: number;
  capacity: number;
  label: string;
  badgeColor: string;
}) {
  return (
    <>
      <div className={styles.tableTileHeader}>
        <Space size={8}>
          <Typography.Text strong>{label}</Typography.Text>
        </Space>
        <Badge
          count={`${occupancy}/${capacity}`}
          color={badgeColor}
          className={styles.occupancyBadge}
        />
      </div>
      <Typography.Text type="secondary" className={styles.tableMeta}>
        {table.shape} • ({table.x_grid}, {table.y_grid})
      </Typography.Text>
    </>
  );
});

// 🔽 ADD THIS HELPER
function getTableShapeClass(shape: Table["shape"]) {
  switch (shape) {
    case "round":
      return styles.tableRound;
    case "square":
      return styles.tableSquare;
    case "rectangular":
      return styles.tableRectangular;
    default:
      return styles.tableSquare;
  }
}

// Friendly label for a table id (e.g. "table-01" -> "Table 1")
function getTableLabel(table: Table) {
  const m = table.table_id.match(/(?:table[-_]?)(\d+)/i);
  if (m) return `Table ${Number(m[1])}`;
  // fallback: capitalize and replace dashes
  return table.table_id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Return badge color based on occupancy ratio
function getBadgeColor(occupancy: number, capacity: number) {
  if (capacity <= 0) return "default";
  const ratio = occupancy / capacity;
  if (ratio >= 1) return "volcano"; // full/over
  if (ratio >= 0.8) return "orange"; // almost full
  if (ratio >= 0.5) return "gold"; // half or more
  return "green"; // plenty of space
}

const DroppableTableTile = memo(function DroppableTableTile({
  table,
  occupancy,
  isSelected,
  full,
  onSelect,
  gridWidth,
  gridHeight,
  canvasWidth,
  canvasHeight,
  onTableMove,
}: {
  table: Table;
  occupancy: number;
  isSelected: boolean;
  full: boolean;
  onSelect: () => void;
  gridWidth: number;
  gridHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  onTableMove: (tableId: string, newX: number, newY: number) => void;
}) {
  const dropId: DragId = `table:${table.table_id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { tableId: table.table_id },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dropId,
    data: { tableId: table.table_id, type: "table" },
  });

  // Calculate position based on grid coordinates
  const cellWidth = canvasWidth / gridWidth;
  const cellHeight = canvasHeight / gridHeight;
  const left = table.x_grid * cellWidth;
  const top = table.y_grid * cellHeight;

  const style: CSSProperties = {
    left: `${left}px`,
    top: `${top}px`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine refs
  const setRefs = (element: HTMLButtonElement | null) => {
    setDropRef(element);
    setDragRef(element);
  };

  return (
    <button
      ref={setRefs}
      type="button"
      style={style}
      className={[
        styles.tableTile,
        getTableShapeClass(table.shape),
        isSelected ? styles.tableTileSelected : "",
        isOver ? styles.tableTileOver : "",
      ].join(" ")}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      {/* compute label and badge color at parent level if needed */}
      <TableTileContent
        table={table}
        occupancy={occupancy}
        capacity={table.total_number}
        label={getTableLabel(table)}
        badgeColor={getBadgeColor(occupancy, table.total_number)}
      />
    </button>
  );
});

const TablesCanvas = memo(function TablesCanvas({
  tableOrder,
  tablesForActiveLayoutById,
  assignmentsByTable,
  selectedTableId,
  onSelectTable,
  gridWidth,
  gridHeight,
  onTableMove,
  guestsById,
}: {
  tableOrder: string[];
  tablesForActiveLayoutById: Map<string, Table>;
  assignmentsByTable: Map<string, TableAssignment[]>;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  gridWidth: number;
  gridHeight: number;
  onTableMove: (tableId: string, newX: number, newY: number) => void;
  guestsById: Map<string, Guest>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const canvasHeight = 700; // Fixed height

  useEffect(() => {
    const updateWidth = () => {
      if (canvasRef.current) {
        setCanvasWidth(canvasRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div ref={canvasRef} className={styles.tablesCanvas}>
      {tableOrder
        .map((id) => tablesForActiveLayoutById.get(id))
        .filter((t): t is Table => Boolean(t))
        .map((t) => {
          // occupancy should count people (party_size) rather than number of assigned rows
          const occupancy = (assignmentsByTable.get(t.table_id) ?? []).reduce(
            (sum, a) => {
              const g = guestsById.get(a.guest_id);
              return sum + (g?.party_size ?? 1);
            },
            0,
          );
          const isSelected = t.table_id === selectedTableId;
          const full = occupancy >= t.total_number;

          return (
            <DroppableTableTile
              key={t.table_id}
              table={t}
              occupancy={occupancy}
              isSelected={isSelected}
              full={full}
              onSelect={() => onSelectTable(t.table_id)}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onTableMove={onTableMove}
            />
          );
        })}
    </div>
  );
});

const UnassignedDropZone = memo(function UnassignedDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" as DragId });

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.unassignedDropZone,
        isOver ? styles.dropZoneOver : "",
      ].join(" ")}
      style={{ margin: 12 }}
    >
      <Space size={8} align="center">
        <UserOutlined />
        <Typography.Text strong>Drop here to unassign</Typography.Text>
      </Space>
      <Typography.Text type="secondary" className={styles.dropZoneHint}>
        Drag a guest onto a table tile to assign.
      </Typography.Text>
    </div>
  );
});

const TableAssignmentPage = () => {
  const relations = data.relations as Relation[];
  const guests = data.guests as Guest[];
  const layouts = data.table_layouts as TableLayout[];
  const [tables, setTables] = useState<Table[]>(data.tables as Table[]);
  const [assignments, setAssignments] = useState<TableAssignment[]>(
    data.table_assignments as TableAssignment[],
  );

  const activeLayout =
    layouts.find((l) => l.is_active) ?? (layouts.length ? layouts[0] : null);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState<string | undefined>(
    undefined,
  );
  const [sideView, setSideView] = useState<"guests" | "table">("guests");
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  // Floating AI Chat state
  const [aiChatOpen, setAIChatOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<DragId | null>(null);

  const relationsById = useMemo(() => {
    return new Map(relations.map((r) => [r.relation_id, r]));
  }, [relations]);

  const guestsById = useMemo(() => {
    return new Map(guests.map((g) => [g.guest_id, g]));
  }, [guests]);

  const tablesForActiveLayout = useMemo(() => {
    if (!activeLayout) return [];
    return tables
      .filter((t) => t.layout_id === activeLayout.layout_id)
      .slice()
      .sort((a, b) => a.table_id.localeCompare(b.table_id));
  }, [activeLayout, tables]);

  const tablesForActiveLayoutById = useMemo(() => {
    return new Map(tablesForActiveLayout.map((t) => [t.table_id, t]));
  }, [tablesForActiveLayout]);

  const tableOrder = useMemo(
    () => tablesForActiveLayout.map((t) => t.table_id),
    [tablesForActiveLayout],
  );

  const assignmentsByTable = useMemo(() => {
    const map = new Map<string, TableAssignment[]>();
    for (const a of assignments) {
      const arr = map.get(a.table_id) ?? [];
      arr.push(a);
      map.set(a.table_id, arr);
    }
    for (const [tableId, arr] of map.entries()) {
      arr.sort((a, b) => a.seat_number - b.seat_number);
      map.set(tableId, arr);
    }
    return map;
  }, [assignments]);

  const segmentedOptions = useMemo(
    () => [
      {
        label: (
          <Space size={6}>
            <UserOutlined />
            Guests
          </Space>
        ),
        value: "guests",
      },
      {
        label: (
          <Space size={6}>
            <TeamOutlined />
            Table
          </Space>
        ),
        value: "table",
      },
    ],
    [],
  );

  const assignedGuestIds = useMemo(() => {
    return new Set(assignments.map((a) => a.guest_id));
  }, [assignments]);

  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    return (
      tablesForActiveLayout.find((t) => t.table_id === selectedTableId) ?? null
    );
  }, [selectedTableId, tablesForActiveLayout]);

  const selectedTableAssignments = useMemo(() => {
    if (!selectedTableId) return [];
    return assignmentsByTable.get(selectedTableId) ?? [];
  }, [assignmentsByTable, selectedTableId]);

  const selectedTableGuests = useMemo(() => {
    return selectedTableAssignments
      .map((a) => guestsById.get(a.guest_id))
      .filter((g): g is Guest => Boolean(g));
  }, [guestsById, selectedTableAssignments]);

  const selectedTablePeopleCount = useMemo(() => {
    return selectedTableAssignments.reduce((sum, a) => {
      const g = guestsById.get(a.guest_id);
      return sum + (g?.party_size ?? 1);
    }, 0);
  }, [selectedTableAssignments, guestsById]);

  const filteredGuests = useMemo(() => {
    const q = guestSearch.trim().toLowerCase();
    return guests
      .filter((g) => (relationFilter ? g.relation_id === relationFilter : true))
      .filter((g) => {
        if (!q) return true;
        const name = fullName(g).toLowerCase();
        const email = (g.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice()
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [guests, guestSearch, relationFilter]);

  const relationOptions = useMemo(
    () => relations.map((r) => ({ value: r.relation_id, label: r.name })),
    [relations],
  );

  const onTableMove = useCallback(
    (tableId: string, newX: number, newY: number) => {
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.table_id === tableId ? { ...t, x_grid: newX, y_grid: newY } : t,
        ),
      );
    },
    [],
  );

  // Convert internal guest/table shapes into HF-compatible shapes
  const hfGuests = useMemo<HFGuest[]>(() => {
    return guests.map((g) => ({
      id: g.guest_id,
      name: fullName(g),
      tags: [relationsById.get(g.relation_id)?.name ?? "unknown"],
      tableId:
        assignments.find((a) => a.guest_id === g.guest_id)?.table_id ?? null,
      partySize: g.party_size ?? 1,
    }));
  }, [guests, assignments, relationsById]);

  const hfTables = useMemo<HFTable[]>(() => {
    return tablesForActiveLayout.map((t) => ({
      id: t.table_id,
      name: getTableLabel(t),
      shape: t.shape,
      capacity: t.total_number,
      position: { x: t.x_grid, y: t.y_grid },
    }));
  }, [tablesForActiveLayout]);

  const handleApplyAISeating = (
    assignmentsFromAI: HFSeatingResponse["assignments"],
  ) => {
    // Map AI assignments into our TableAssignment shape. We'll assign seat numbers greedily.
    setAssignments((prev) => {
      // Start from previous assignments but remove any assignments for guests present in AI result
      const withoutAI = prev.filter(
        (a) => !assignmentsFromAI.find((x) => x.guestId === a.guest_id),
      );

      // Build a map of current used seats per table
      const usedSeats = new Map<string, number[]>();
      for (const a of withoutAI) {
        const arr = usedSeats.get(a.table_id) ?? [];
        arr.push(a.seat_number);
        usedSeats.set(a.table_id, arr);
      }

      const newAssignments: TableAssignment[] = [];

      for (const ai of assignmentsFromAI) {
        const tableId = ai.tableId;
        const tbl = tablesForActiveLayout.find((t) => t.table_id === tableId);
        if (!tbl) continue; // skip unknown tables

        const used = usedSeats.get(tableId) ?? [];
        const seat = getNextAvailableSeatNumber(tbl.total_number, used) ?? 1;
        used.push(seat);
        usedSeats.set(tableId, used);

        newAssignments.push({
          table_id: tableId,
          guest_id: ai.guestId,
          seat_number: seat,
        });
      }

      return [...withoutAI, ...newAssignments];
    });
  };

  const onSelectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    setSideView("table");
  }, []);

  const dragOverlayContent = useMemo(() => {
    if (!activeDragId || !activeDragId.startsWith("guest:")) return null;
    const guestId = activeDragId.slice("guest:".length);
    const g = guestsById.get(guestId);
    return g ? fullName(g) : "Guest";
  }, [activeDragId, guestsById]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragStart = (evt: DragStartEvent) => {
    setActiveDragId(evt.active.id as DragId);
  };

  const onDragEnd = (evt: DragEndEvent) => {
    setActiveDragId(null);

    // Handle table dragging
    if (
      typeof evt.active.id === "string" &&
      evt.active.id.startsWith("table:") &&
      evt.active.data.current?.type === "table"
    ) {
      const tableId = evt.active.id.slice("table:".length);
      const delta = evt.delta;

      if (delta.x !== 0 || (delta.y !== 0 && activeLayout)) {
        setTables((prevTables) => {
          const table = prevTables.find((t) => t.table_id === tableId);
          if (!table) return prevTables;

          // Get canvas dimensions from somewhere - we'll use a rough estimate
          // In a real scenario, you'd pass these from the canvas component
          const canvasWidth = 800; // approximate
          const canvasHeight = 560;
          if (!activeLayout) return prevTables;

          const cellWidth = canvasWidth / activeLayout.x_grid_size;
          const cellHeight = canvasHeight / activeLayout.y_grid_size;

          // Calculate new grid position based on pixel movement
          const deltaGridX = delta.x / cellWidth;
          const deltaGridY = delta.y / cellHeight;

          const newXGrid = Math.max(
            0,
            Math.min(
              activeLayout.x_grid_size - 1,
              Math.round(table.x_grid + deltaGridX),
            ),
          );
          const newYGrid = Math.max(
            0,
            Math.min(
              activeLayout.y_grid_size - 1,
              Math.round(table.y_grid + deltaGridY),
            ),
          );

          return prevTables.map((t) =>
            t.table_id === tableId
              ? { ...t, x_grid: newXGrid, y_grid: newYGrid }
              : t,
          );
        });
        message.success(`Table ${tableId} repositioned`);
        return;
      }
    }

    const guestId = parseGuestIdFromDragId(evt.active.id);
    if (!guestId) return;

    const overId = evt.over?.id;
    if (!overId) return;

    if (overId === "unassigned") {
      setAssignments((prev) => prev.filter((a) => a.guest_id !== guestId));
      message.success("Guest unassigned");
      return;
    }

    if (typeof overId === "string" && overId.startsWith("table:")) {
      const tableId = overId.slice("table:".length);
      const targetTable = tablesForActiveLayout.find(
        (t) => t.table_id === tableId,
      );
      if (!targetTable) return;

      setAssignments((prev) => {
        const withoutGuest = prev.filter((a) => a.guest_id !== guestId);
        const usedSeatNumbers = withoutGuest
          .filter((a) => a.table_id === tableId)
          .map((a) => a.seat_number);

        const seat = getNextAvailableSeatNumber(
          targetTable.total_number,
          usedSeatNumbers,
        );
        if (!seat) {
          message.warning("That table is full");
          return prev;
        }

        return [
          ...withoutGuest,
          { table_id: tableId, guest_id: guestId, seat_number: seat },
        ];
      });

      setSelectedTableId(tableId);
      setSideView("table");
      const g = guestsById.get(guestId);
      message.success(
        g ? `${fullName(g)} assigned to ${tableId}` : `Assigned to ${tableId}`,
      );
    }
  };

  const onDragCancel = () => {
    setActiveDragId(null);
  };

  if (!activeLayout) {
    return (
      <div className={styles.page}>
        <Card>
          <Empty description="No table layouts available yet. Create a layout first." />
        </Card>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <Typography.Title level={2} className={styles.title}>
              Table Assignment
            </Typography.Title>
            <Typography.Text type="secondary">
              {activeLayout.name} • {tablesForActiveLayout.length} tables •{" "}
              {guests.length} guests
            </Typography.Text>
          </div>
        </div>

        <div
          className={styles.contentGrid}
          style={{ height: "calc(100vh - 120px)", minHeight: 560 }}
        >
          <Card
            className={styles.canvasCard}
            title={
              <Space size={8}>
                <TeamOutlined />
                <span>Seating chart</span>
              </Space>
            }
            extra={
              <Typography.Text type="secondary">
                Grid {activeLayout.x_grid_size}×{activeLayout.y_grid_size}
              </Typography.Text>
            }
            style={{ flex: "1 1 0%" }}
            bodyStyle={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TablesCanvas
              tableOrder={tableOrder}
              tablesForActiveLayoutById={tablesForActiveLayoutById}
              assignmentsByTable={assignmentsByTable}
              selectedTableId={selectedTableId}
              onSelectTable={onSelectTable}
              gridWidth={activeLayout.x_grid_size}
              gridHeight={activeLayout.y_grid_size}
              onTableMove={onTableMove}
              guestsById={guestsById}
            />
          </Card>

          <Button
            type="default"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 10,
              borderRadius: 0,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }}
            onClick={() => setSidePanelOpen((open) => !open)}
          >
            {sidePanelOpen ? "Hide Guests" : "Show Guests"}
          </Button>

          <Card
            size="small"
            title={
              <Segmented
                block
                value={sideView}
                onChange={(v) => setSideView(v as typeof sideView)}
                options={segmentedOptions}
              />
            }
            className={styles.sideCard}
            style={{
              position: "relative",
              width: 340,
              zIndex: 20,
              display: sidePanelOpen ? "flex" : "none",
              overflow: "hidden",
              borderRadius: 8,
              flexDirection: "column",
            }}
            bodyStyle={{
              padding: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {sideView === "guests" ? (
              <div className={styles.sideBody} style={{ height: "100%" }}>
                <UnassignedDropZone />
                <Space direction="vertical" size={10} style={{ margin: 12 }}>
                  <Input.Search
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    placeholder="Search guests by name or email"
                    allowClear
                  />
                  <Select
                    value={relationFilter}
                    onChange={(v) => setRelationFilter(v)}
                    placeholder="Filter by relation"
                    allowClear
                    options={relationOptions}
                  />
                </Space>
                <div
                  className={styles.sideList}
                  style={{ height: "calc(100% - 180px)" }}
                >
                  <List
                    size="small"
                    dataSource={filteredGuests}
                    renderItem={(g) => {
                      const relation = relationsById.get(g.relation_id);
                      const isAssigned = assignedGuestIds.has(g.guest_id);
                      return (
                        <List.Item className={styles.guestRow}>
                          <DraggableGuestRow
                            guest={g}
                            relationName={relation?.name}
                            isAssigned={isAssigned}
                          />
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.sideBody} style={{ height: "100%" }}>
                {!selectedTable ? (
                  <Empty description="Select a table to view details." />
                ) : (
                  <>
                    <div className={styles.tableDetailsHeader}>
                      <Space size={10} align="center">
                        <span className={styles.shapeIconLarge}>
                          {getShapeIcon(selectedTable.shape)}
                        </span>
                        <div>
                          <Typography.Title
                            level={4}
                            className={styles.tableTitle}
                          >
                            {selectedTable.table_id}
                          </Typography.Title>
                          <Typography.Text type="secondary">
                            Capacity {selectedTable.total_number} •{" "}
                            {selectedTablePeopleCount} seated
                          </Typography.Text>
                        </div>
                      </Space>
                    </div>
                    <div
                      className={styles.sideList}
                      style={{ height: "calc(100% - 80px)" }}
                    >
                      <List
                        size="small"
                        locale={{ emptyText: "No guests assigned yet." }}
                        dataSource={selectedTableAssignments}
                        renderItem={(a) => {
                          const g = guestsById.get(a.guest_id);
                          if (!g) return null;
                          const relation = relationsById.get(g.relation_id);
                          const isAssigned = assignedGuestIds.has(g.guest_id);
                          return (
                            <List.Item>
                              <Space
                                direction="vertical"
                                size={6}
                                style={{ width: "100%" }}
                              >
                                <Tag color="geekblue">Seat {a.seat_number}</Tag>
                                <DraggableGuestRow
                                  guest={g}
                                  relationName={relation?.name}
                                  isAssigned={isAssigned}
                                />
                              </Space>
                            </List.Item>
                          );
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* AI Seating Assistant Floating Button and Chat */}
          <FloatButton
            icon={<MessageOutlined />}
            type="primary"
            style={{ right: 32, bottom: 32, zIndex: 1000 }}
            onClick={() => setAIChatOpen((open) => !open)}
            tooltip={aiChatOpen ? undefined : "AI Seating Assistant"}
          />
          {aiChatOpen && (
            <div
              style={{
                position: "fixed",
                right: 32,
                bottom: 96,
                zIndex: 1100,
                width: 400,
                maxWidth: "90vw",
                height: 520,
                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                borderRadius: 12,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  <MessageOutlined style={{ marginRight: 8 }} />
                  AI Seating Assistant
                </span>
                <FloatButton
                  icon={<CloseOutlined />}
                  type="default"
                  style={{ boxShadow: "none", background: "transparent" }}
                  onClick={() => setAIChatOpen(false)}
                  tooltip={"Close"}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <SeatingAIChat
                  guests={hfGuests}
                  tables={hfTables}
                  onApplySeating={handleApplyAISeating}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {dragOverlayContent != null ? (
          <div className={styles.dragOverlay}>
            <Typography.Text strong>{dragOverlayContent}</Typography.Text>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TableAssignmentPage;
