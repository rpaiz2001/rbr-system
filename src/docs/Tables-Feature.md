# Detailed Plan: AI-Powered Wedding Table Layout System

## Phase 1: Layout Creation Interface

### 1.1 Canvas Setup Component

**Component: `TableLayoutCanvas`**

**Features:**

- **Grid-based canvas** using `react-konva`
- **Configurable dimensions** (x_grid_size, y_grid_size)
- **Zoom and pan controls** for large venues
- **Grid toggle** (show/hide grid lines)
- **Measurement units** (feet/meters selector)

**Ant Design Components:**

- `InputNumber` for grid size configuration
- `Slider` for zoom level
- `Switch` for grid visibility
- `Radio.Group` for unit selection

**State Management:**

```javascript
{
  layout_id: UUID,
  name: string,
  description: string,
  x_grid_size: number,
  y_grid_size: number,
  zoom: number,
  tables: Table[],
  is_active: boolean
}
```

### 1.2 Table Creation Tools

**Component: `TableToolbar`**

**Features:**

- **Table shapes library**:
  - Round (various sizes: 4, 6, 8, 10, 12 seats)
  - Rectangular (various sizes)
  - Square
  - Custom shapes
- **Drag-and-drop** from toolbar to canvas
- **Quick add** with click placement
- **Table properties panel**:
  - Name/number
  - Capacity (total_number)
  - Shape
  - Color coding (optional)

**Ant Design Components:**

- `Drawer` or `Sider` for table library
- `Card` for each table template
- `Form` for table properties
- `ColorPicker` for visual coding
- `InputNumber` for capacity

**Interaction Flow:**

1. User selects table shape from toolbar
2. Clicks canvas or drags to place
3. Table appears at position with default properties
4. User can edit properties in side panel

### 1.3 Table Manipulation

**Component: `DraggableTable`**

**Features:**

- **Drag to reposition** (updates x_grid, y_grid)
- **Resize handles** (updates capacity if applicable)
- **Rotate** (for rectangular tables)
- **Delete** (with confirmation)
- **Duplicate**
- **Snap to grid** option
- **Collision detection** (prevent overlap)

**Visual Indicators:**

- Selection highlight
- Capacity display (e.g., "0/8" seats filled)
- Color coding by fill status

### 1.4 Layout Management

**Component: `LayoutControls`**

**Ant Design Components:**

- `Button.Group` for save/load/clear
- `Modal` for layout naming
- `Popconfirm` for destructive actions
- `Message` for success/error feedback

**Actions:**

- Save layout to database
- Load existing layout
- Clear all tables
- Export as image/PDF
- Undo/Redo functionality

---

## Phase 2: Excel Guest List Upload & Processing

### 2.1 File Upload Interface

**Component: `GuestListUploader`**

**Ant Design Components:**

- `Upload.Dragger` for file selection
- `Button` for manual upload trigger
- `Progress` for upload status
- `Alert` for file requirements

**Expected Excel Format:**

```
| first_name | last_name | email | phone | relation | dietary_restrictions | accessibility_needs | plus_one | notes |
```

**File Processing:**

- Use `xlsx` or `sheetjs` library to parse
- Validate required fields
- Show preview table before import
- Map columns if headers don't match exactly

### 2.2 Guest Data Preview & Validation

**Component: `GuestDataPreview`**

**Ant Design Components:**

- `Table` with editable cells
- `Tag` for relation types
- `Checkbox` for plus_one
- `Select` for rsvp_status
- `Tooltip` for accessibility/dietary info

**Features:**

- **Column mapping** if headers differ
- **Inline editing** for corrections
- **Duplicate detection** (by email/name)
- **Missing data highlights**
- **Bulk actions** (delete, edit relation)

**Validation Rules:**

- Required: first_name, last_name
- Email format validation
- Phone number format
- Relation must exist in RELATION table

### 2.3 Guest List Management

**Component: `GuestListManager`**

**Features:**

- View all guests for event
- Filter by relation, RSVP status, dietary needs
- Search by name/email
- Bulk import from Excel
- Manual add/edit/delete
- Export current list

**Ant Design Components:**

- `Table` with filters and sorting
- `Input.Search` for quick find
- `Dropdown` filters
- `Modal` for add/edit forms
- `Badge` for status indicators

---

## Phase 3: AI Auto-Assignment

### 3.1 AI Assignment Configuration

**Component: `AutoAssignmentWizard`**

**Step 1: Assignment Preferences**
**Ant Design Component:** `Steps` + `Form`

**Configuration Options:**

```javascript
{
  strategy: 'balanced' | 'relationship-based' | 'custom',
  priorities: {
    keepFamiliesTogether: boolean,
    separateExes: boolean, // if tracked
    balanceTableSizes: boolean,
    respectAccessibilityNeeds: boolean,
    prioritizePlusOnes: boolean
  },
  constraints: {
    headTableGuests: UUID[], // VIPs
    mustSitTogether: UUID[][], // groups
    mustSeparate: UUID[][], // conflicts
  },
  preferences: {
    preferFullTables: boolean,
    allowPartialTables: boolean,
    reservedTables: UUID[] // tables to skip
  }
}
```

**Ant Design Components:**

- `Radio.Group` for strategy
- `Checkbox.Group` for priorities
- `Transfer` for head table selection
- `Select` (mode="tags") for grouping
- `InputNumber` for min/max table fill percentage

**Step 2: Review Constraints**

- Show total guests vs total capacity
- Highlight potential issues (not enough seats, too many tables, etc.)
- Suggest adding/removing tables

**Step 3: AI Prompt Interface**
**Component:** `AIAssignmentPrompt`

**Features:**

- **Natural language input**: "Seat families together, put the bride's college friends at tables near the dance floor"
- **Pre-built templates**: Common scenarios
- **Constraint visualization**: Show what AI will consider

**Ant Design Components:**

- `Input.TextArea` for custom prompt
- `Select` for template selection
- `Collapse` for advanced options
- `Spin` for loading state

### 3.2 AI Integration

**API Endpoint:** `/api/assignments/auto-assign`

**Implementation Options:**

**Option A: Use Anthropic API (as shown in system prompt)**

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `
        Assign ${guests.length} guests to ${tables.length} tables.
        
        Guest data: ${JSON.stringify(guests)}
        Table data: ${JSON.stringify(tables)}
        Preferences: ${JSON.stringify(preferences)}
        
        Custom instructions: ${userPrompt}
        
        Return ONLY valid JSON with this structure:
        {
          "assignments": [
            {"guest_id": "uuid", "table_id": "uuid", "seat_number": 1, "reasoning": "why"}
          ],
          "unassigned": ["uuid"],
          "warnings": ["string"]
        }
      `,
      },
    ],
  }),
});
```

**Option B: Custom Algorithm**

- Implement constraint satisfaction problem solver
- Use scoring system for optimal assignments
- Less flexible but more predictable

**Response Processing:**

- Parse JSON response
- Validate all assignments
- Check for conflicts
- Store in TABLE_ASSIGNMENTS

### 3.3 Assignment Review Interface

**Component: `AssignmentReview`**

**Features:**

- **Table-by-table view** with guest cards
- **Visual capacity indicators** (7/8 filled)
- **Color coding** by relation type
- **Warning indicators**:
  - Accessibility needs not met
  - Dietary restrictions at table
  - Potential conflicts
  - Unassigned guests

**Ant Design Components:**

- `Tabs` for different views (by table, by relation, by status)
- `Card.Grid` for table layouts
- `Avatar` with initials for guests
- `Tag` for relation types
- `Tooltip` for guest details
- `Alert` for warnings
- `Statistic` for metrics

**AI Reasoning Display:**

- Show why each guest was placed
- Highlight constraint satisfaction
- Display optimization metrics

**Actions:**

- Accept all assignments
- Reject and retry with new prompt
- Accept with manual adjustments (→ Phase 4)

---

## Phase 4: Manual Drag-and-Drop Adjustments

### 4.1 Integrated Canvas + Guest View

**Component: `InteractiveSeatingChart`**

**Layout:**

```
┌─────────────────────────────────────────┐
│  [Canvas with tables]                   │
│                                         │
│  ┌─────┐      ┌─────┐                  │
│  │  T1 │      │  T2 │                  │
│  │ 6/8 │      │ 8/8 │                  │
│  └─────┘      └─────┘                  │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Guest List Panel                       │
│  ┌──────────────────────────────────┐  │
│  │ [Search] [Filters]               │  │
│  ├──────────────────────────────────┤  │
│  │ Draggable guest cards            │  │
│  │ • John Doe (Bride's Family)      │  │
│  │ • Jane Smith (Groom's Friend)    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 4.2 Table Detail View

**Component: `TableDetailModal`**

**Trigger:** Click on any table

**Content:**

- Table name/number
- Current occupancy (6/8)
- **Seat layout visualization** (circular arrangement for round tables)
- Guest cards in seat positions
- Empty seat indicators

**Ant Design Components:**

- `Modal` (fullscreen option)
- `Avatar.Group` for guests
- `Empty` for vacant seats
- `Descriptions` for table metadata

### 4.3 Drag-and-Drop Implementation

**Library:** `react-dnd` or `@dnd-kit/core`

**Draggable Items:**

- Guest cards from unassigned list
- Guest cards from their current table
- Entire tables (position only)

**Drop Zones:**

- Any table on canvas
- Specific seats within table detail view
- "Unassigned" zone (to remove from table)

**Interaction Patterns:**

**Pattern 1: Canvas-Level Drag**

```javascript
// Drag guest from side panel to table on canvas
onDrop(guestId, targetTableId) {
  // Find next available seat
  const seatNumber = getNextAvailableSeat(targetTableId);

  // Update assignment
  createOrUpdateAssignment({
    guest_id: guestId,
    table_id: targetTableId,
    seat_number: seatNumber
  });

  // Show success message
  message.success(`${guestName} assigned to Table ${tableNumber}`);
}
```

**Pattern 2: Seat-Level Drag (in Modal)**

```javascript
// Drag guest to specific seat
onDropToSeat(guestId, tableId, targetSeatNumber) {
  // Check if seat is occupied
  const currentOccupant = getSeatOccupant(tableId, targetSeatNumber);

  if (currentOccupant) {
    // Show swap confirmation
    Modal.confirm({
      title: 'Swap seats?',
      content: `Swap ${guestName} with ${currentOccupant.name}?`,
      onOk: () => swapSeats(guestId, currentOccupant.guest_id)
    });
  } else {
    updateSeatAssignment(guestId, tableId, targetSeatNumber);
  }
}
```

**Pattern 3: Guest-to-Guest Swap**

```javascript
// Drag one guest onto another to swap tables
onDropOnGuest(draggedGuestId, targetGuestId) {
  const guest1Assignment = getAssignment(draggedGuestId);
  const guest2Assignment = getAssignment(targetGuestId);

  // Swap their table assignments
  await Promise.all([
    updateAssignment(draggedGuestId, {
      table_id: guest2Assignment.table_id,
      seat_number: guest2Assignment.seat_number
    }),
    updateAssignment(targetGuestId, {
      table_id: guest1Assignment.table_id,
      seat_number: guest1Assignment.seat_number
    })
  ]);

  message.success('Guests swapped!');
}
```

### 4.4 Visual Feedback

**During Drag:**

- Ghost image of guest card
- Drop zone highlighting (valid/invalid)
- Capacity indicator updates in real-time
- Cursor changes (grab, grabbing, not-allowed)

**After Drop:**

- Smooth animation to new position
- Table capacity updates
- Guest list re-renders
- Undo option appears

**Ant Design Components:**

- `Badge` for capacity on tables
- `Tooltip` showing drop action
- `Message` for confirmations
- `notification` for important changes

### 4.5 Constraint Validation

**Real-time Checks:**

- Table capacity not exceeded
- Accessibility needs met (if table has location flags)
- Dietary restrictions noted
- Plus-ones seated together

**Warning System:**

```javascript
const warnings = validateAssignment(guestId, tableId);

if (warnings.length > 0) {
  Modal.warning({
    title: "Assignment Warnings",
    content: (
      <List
        dataSource={warnings}
        renderItem={(item) => (
          <List.Item>
            <Alert type="warning" message={item} />
          </List.Item>
        )}
      />
    ),
    okText: "Assign Anyway",
    cancelText: "Cancel",
  });
}
```

### 4.6 Bulk Operations

**Component: `BulkEditActions`**

**Features:**

- Multi-select guests (Checkbox mode)
- Assign multiple to same table
- Move entire relation group
- Clear table assignments
- Swap entire tables

**Ant Design Components:**

- `Checkbox` in guest cards
- `Button.Group` for actions
- `Select` for target table
- `Popconfirm` for destructive actions

---

## Phase 5: Additional Features

### 5.1 Undo/Redo System

**Implementation:**

```javascript
const [history, setHistory] = useState({
  past: [],
  present: currentState,
  future: [],
});

const undo = () => {
  // Move present to future
  // Move last past to present
};

const redo = () => {
  // Move present to past
  // Move first future to present
};
```

**Ant Design Components:**

- `Button` with icons for undo/redo
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- History panel showing recent changes

### 5.2 Search & Filter

**Component: `GuestSearchFilter`**

**Search Capabilities:**

- By name (fuzzy matching)
- By email
- By table assignment
- By relation type
- By RSVP status
- By dietary needs
- By assignment status (assigned/unassigned)

**Ant Design Components:**

- `Input.Search`
- `Select` with multiple filters
- `Checkbox.Group` for multi-criteria
- `Badge` showing filter count

### 5.3 Print/Export Options

**Component: `ExportTools`**

**Export Formats:**

- PDF seating chart (visual layout)
- Excel guest list with assignments
- CSV for name cards/place settings
- PNG/SVG of layout
- Table tent cards (printable)

**Ant Design Components:**

- `Dropdown.Button` for export options
- `Modal` for print preview
- `Segmented` for format selection

### 5.4 Collaboration Features (Future)

- Real-time updates (Socket.io)
- Multiple users editing simultaneously
- Comments on tables/assignments
- Change notifications
- Version history

---

## Technical Stack Recommendations

### Core Libraries

```json
{
  "react": "^18.x",
  "antd": "^5.x",
  "react-konva": "^18.x", // Canvas rendering
  "@dnd-kit/core": "^6.x", // Drag and drop
  "@dnd-kit/sortable": "^8.x",
  "xlsx": "^0.18.x", // Excel parsing
  "konva": "^9.x", // Canvas manipulation
  "zustand": "^4.x", // State management
  "react-query": "^5.x", // Server state
  "axios": "^1.x" // API calls
}
```

### Component Structure

```
src/
├── pages/
│   └── TableLayoutPage.jsx
├── components/
│   ├── layout/
│   │   ├── TableLayoutCanvas.jsx
│   │   ├── TableToolbar.jsx
│   │   ├── DraggableTable.jsx
│   │   └── LayoutControls.jsx
│   ├── guests/
│   │   ├── GuestListUploader.jsx
│   │   ├── GuestDataPreview.jsx
│   │   ├── GuestListManager.jsx
│   │   └── GuestCard.jsx
│   ├── assignment/
│   │   ├── AutoAssignmentWizard.jsx
│   │   ├── AIAssignmentPrompt.jsx
│   │   ├── AssignmentReview.jsx
│   │   └── InteractiveSeatingChart.jsx
│   ├── table/
│   │   ├── TableDetailModal.jsx
│   │   └── TableVisualization.jsx
│   └── shared/
│       ├── GuestSearchFilter.jsx
│       ├── BulkEditActions.jsx
│       └── ExportTools.jsx
├── hooks/
│   ├── useTableLayout.js
│   ├── useGuestAssignments.js
│   ├── useAutoAssign.js
│   └── useDragAndDrop.js
├── services/
│   ├── layoutService.js
│   ├── guestService.js
│   ├── assignmentService.js
│   └── aiService.js
└── utils/
    ├── validation.js
    ├── constraints.js
    └── exportHelpers.js
```

---

## Database Operations

### Key API Endpoints

```javascript
// Layouts
POST   /api/layouts                    // Create layout
GET    /api/layouts/:eventId           // Get layouts for event
PUT    /api/layouts/:layoutId          // Update layout
DELETE /api/layouts/:layoutId          // Delete layout

// Tables
POST   /api/tables                     // Create table
PUT    /api/tables/:tableId            // Update table
DELETE /api/tables/:tableId            // Delete table
GET    /api/tables/:layoutId           // Get all tables in layout

// Guests
POST   /api/guests/bulk-import         // Import from Excel
GET    /api/guests/:eventId            // Get all guests
PUT    /api/guests/:guestId            // Update guest
DELETE /api/guests/:guestId            // Delete guest

// Assignments
POST   /api/assignments/auto-assign    // AI assignment
POST   /api/assignments                // Manual assign
PUT    /api/assignments/:assignmentId  // Update assignment
DELETE /api/assignments/:assignmentId  // Remove assignment
POST   /api/assignments/swap           // Swap two guests
GET    /api/assignments/:layoutId      // Get all assignments
```

### Optimistic Updates

Use React Query's optimistic updates for smooth UX:

```javascript
const { mutate } = useMutation({
  mutationFn: updateAssignment,
  onMutate: async (newAssignment) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["assignments"]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(["assignments"]);

    // Optimistically update
    queryClient.setQueryData(["assignments"], (old) =>
      updateAssignmentInCache(old, newAssignment)
    );

    return { previous };
  },
  onError: (err, newAssignment, context) => {
    // Rollback on error
    queryClient.setQueryData(["assignments"], context.previous);
  },
});
```

---

## User Flow Summary

1. **Create Layout** → User draws floor plan with tables
2. **Upload Guests** → Import Excel, validate, confirm
3. **AI Auto-Assign** → Configure preferences, enter custom prompt, review results
4. **Manual Adjustments** → Drag-drop guests between tables, swap seats
5. **Final Review** → Check warnings, validate constraints
6. **Export/Print** → Generate seating chart, name cards, guest list

This creates an intuitive, powerful system that balances AI automation with manual control!
