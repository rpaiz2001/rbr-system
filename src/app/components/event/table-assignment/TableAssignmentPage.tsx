"use client";
import styles from "./table-assignment-page.module.css";
import data from "@/data/tables-data.json";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
} from "antd";
import {
  ArrowsAltOutlined,
  BorderOutlined,
  ColumnWidthOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

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
  usedSeatNumbers: number[]
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
    [transform]
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
            <Tag color="geekblue">Assigned</Tag>
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
  full,
}: {
  table: Table;
  occupancy: number;
  full: boolean;
}) {
  return (
    <>
      <div className={styles.tableTileHeader}>
        <Space size={8}>
          <span className={styles.shapeIcon}>{getShapeIcon(table.shape)}</span>
          <Typography.Text strong>{table.table_id}</Typography.Text>
        </Space>
        <Badge
          count={`${occupancy}/${table.total_number}`}
          color={full ? "volcano" : "geekblue"}
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
      <TableTileContent table={table} occupancy={occupancy} full={full} />
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
}: {
  tableOrder: string[];
  tablesForActiveLayoutById: Map<string, Table>;
  assignmentsByTable: Map<string, TableAssignment[]>;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  gridWidth: number;
  gridHeight: number;
  onTableMove: (tableId: string, newX: number, newY: number) => void;
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
          const occupancy = assignmentsByTable.get(t.table_id)?.length ?? 0;
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
    data.table_assignments as TableAssignment[]
  );

  const activeLayout =
    layouts.find((l) => l.is_active) ?? (layouts.length ? layouts[0] : null);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState<string | undefined>(
    undefined
  );
  const [sideView, setSideView] = useState<"guests" | "table">("guests");
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
    [tablesForActiveLayout]
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
    []
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
    [relations]
  );

  const onTableMove = useCallback(
    (tableId: string, newX: number, newY: number) => {
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.table_id === tableId ? { ...t, x_grid: newX, y_grid: newY } : t
        )
      );
    },
    []
  );

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
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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
          const cellWidth = canvasWidth / activeLayout.x_grid_size;
          const cellHeight = canvasHeight / activeLayout.y_grid_size;

          // Calculate new grid position based on pixel movement
          const deltaGridX = delta.x / cellWidth;
          const deltaGridY = delta.y / cellHeight;

          const newXGrid = Math.max(
            0,
            Math.min(
              activeLayout.x_grid_size - 1,
              Math.round(table.x_grid + deltaGridX)
            )
          );
          const newYGrid = Math.max(
            0,
            Math.min(
              activeLayout.y_grid_size - 1,
              Math.round(table.y_grid + deltaGridY)
            )
          );

          return prevTables.map((t) =>
            t.table_id === tableId
              ? { ...t, x_grid: newXGrid, y_grid: newYGrid }
              : t
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
        (t) => t.table_id === tableId
      );
      if (!targetTable) return;

      setAssignments((prev) => {
        const withoutGuest = prev.filter((a) => a.guest_id !== guestId);
        const usedSeatNumbers = withoutGuest
          .filter((a) => a.table_id === tableId)
          .map((a) => a.seat_number);

        const seat = getNextAvailableSeatNumber(
          targetTable.total_number,
          usedSeatNumbers
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
        g ? `${fullName(g)} assigned to ${tableId}` : `Assigned to ${tableId}`
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

        <div className={styles.contentGrid}>
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
            />
          </Card>

          <Card className={styles.sideCard}>
            <div className={styles.sideTop}>
              <Segmented
                block
                value={sideView}
                onChange={(v) => setSideView(v as typeof sideView)}
                options={segmentedOptions}
              />
            </div>

            {sideView === "guests" ? (
              <div className={styles.sideBody}>
                <UnassignedDropZone />

                <Space direction="vertical" size={10} style={{ width: "100%" }}>
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

                <div className={styles.sideList}>
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
              <div className={styles.sideBody}>
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
                            {selectedTableGuests.length} seated
                          </Typography.Text>
                        </div>
                      </Space>
                    </div>

                    <div className={styles.sideList}>
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
