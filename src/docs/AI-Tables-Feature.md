# AI-Powered Seating Arrangement with Hugging Face Inference API

## Complete Implementation Guide for Wedding Planning App

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Your Hugging Face API Token](#getting-your-hugging-face-api-token)
4. [Understanding the Architecture](#understanding-the-architecture)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Testing the Implementation](#testing-the-implementation)
7. [Troubleshooting](#troubleshooting)
8. [Cost & Rate Limits](#cost--rate-limits)

---

## Overview

This guide will help you integrate a free AI assistant into your wedding seating arrangement app using Hugging Face's Inference API. The AI will help users optimize table assignments based on guest relationships, preferences, and constraints.

**What you'll build:**

- AI chat interface for seating suggestions
- Natural language processing for seating requests
- Automatic table assignment generation
- Conflict detection and resolution

**Tech Stack:**

- Hugging Face Inference API (Free tier)
- React/TypeScript
- Your existing table assignment system

---

## Prerequisites

### Required

- Node.js 16+ installed
- Your existing wedding planning app codebase
- Basic understanding of React hooks
- A Hugging Face account (free)

### Recommended Models

We'll use **Mistral-7B-Instruct-v0.2** because it's:

- Free on Hugging Face
- Good at following instructions
- Fast enough for real-time chat
- Handles structured output well

**Alternative models:**

- `meta-llama/Llama-2-7b-chat-hf` (requires approval)
- `mistralai/Mixtral-8x7B-Instruct-v0.1` (slower but smarter)
- `HuggingFaceH4/zephyr-7b-beta` (good alternative)

---

## Getting Your Hugging Face API Token

### Step 1: Create Hugging Face Account

1. Go to [huggingface.co](https://huggingface.co)
2. Click "Sign Up" in the top right
3. Complete registration with email

### Step 2: Generate API Token

1. Log in to Hugging Face
2. Click your profile picture → **Settings**
3. Navigate to **Access Tokens** in the left sidebar
4. Click **New token**
5. Configure your token:
   - **Name:** `wedding-seating-ai`
   - **Role:** Select `read` (sufficient for inference)
6. Click **Generate token**
7. **IMPORTANT:** Copy the token immediately (you won't see it again)
8. Store it securely (we'll use environment variables)

### Step 3: Store API Token Securely

Create a `.env.local` file in your project root:

```bash
# .env.local
NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxx
```

**Security Notes:**

- Never commit `.env.local` to version control
- Add `.env.local` to your `.gitignore`
- For production, use proper environment variable management
- Consider using a backend proxy to hide the API key from clients

---

## Understanding the Architecture

### Data Flow

```
User Input (Chat)
    ↓
Parse Request (extract intent)
    ↓
Build Context (guest data, table info, constraints)
    ↓
Send to Hugging Face API
    ↓
Parse AI Response (JSON with table assignments)
    ↓
Update UI (apply seating arrangement)
```

### Key Components

1. **SeatingAIChat** - Chat interface component
2. **SeatingAIService** - API communication layer
3. **SeatingOptimizer** - Logic for applying AI suggestions
4. **PromptBuilder** - Constructs effective prompts

---

## Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
npm install @huggingface/inference
# or
yarn add @huggingface/inference
```

### Step 2: Create the Hugging Face Service

Create `src/services/huggingface.service.ts`:

```typescript
import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face client
const hf = new HfInference(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY);

// Model selection
const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

export interface Guest {
  id: string;
  name: string;
  tags?: string[];
  tableId?: string;
  partySize?: number;
}

export interface Table {
  id: string;
  name: string;
  shape: "round" | "square" | "rectangular";
  capacity: number;
  position: { x: number; y: number };
}

export interface SeatingRequest {
  guests: Guest[];
  tables: Table[];
  userMessage: string;
  constraints?: string[];
}

export interface SeatingResponse {
  assignments: Array<{
    guestId: string;
    tableId: string;
    reasoning?: string;
  }>;
  explanation: string;
  conflicts?: string[];
}

/**
 * Build an effective prompt for the AI
 */
function buildSeatingPrompt(request: SeatingRequest): string {
  const { guests, tables, userMessage, constraints } = request;

  const guestList = guests
    .map((g) => {
      const tags = g.tags?.join(", ") || "none";
      const current = g.tableId
        ? ` (currently at ${g.tableId})`
        : " (unassigned)";
      return `- ${g.name} [ID: ${g.id}] - Tags: ${tags}${current}`;
    })
    .join("\n");

  const tableList = tables
    .map((t) => {
      const assigned = guests.filter((g) => g.tableId === t.id).length;
      return `- ${t.name} [ID: ${t.id}] - Capacity: ${t.capacity}, Shape: ${t.shape}, Current: ${assigned}/${t.capacity}`;
    })
    .join("\n");

  const constraintText = constraints?.length
    ? `\n\nConstraints:\n${constraints.map((c) => `- ${c}`).join("\n")}`
    : "";

  return `You are a wedding seating arrangement assistant. Your job is to create optimal table assignments based on guest relationships and user preferences.

## Guests
${guestList}

## Available Tables
${tableList}
${constraintText}

## User Request
${userMessage}

## Instructions
1. Analyze the guest tags to understand relationships (e.g., "bride_family", "groom_family", "children", "elderly")
2. Consider table capacities and current assignments
3. Respond with a JSON object containing your seating recommendations

## Response Format (JSON only, no markdown)
{
  "assignments": [
    {"guestId": "guest_id", "tableId": "table_id", "reasoning": "brief explanation"}
  ],
  "explanation": "Overall explanation of your seating strategy",
  "conflicts": ["list any potential issues or conflicts"]
}

Respond only with valid JSON, no additional text.`;
}

/**
 * Call Hugging Face Inference API
 */
export async function getSeatingRecommendation(
  request: SeatingRequest,
): Promise<SeatingResponse> {
  try {
    const prompt = buildSeatingPrompt(request);

    // Call the model
    const response = await hf.textGeneration({
      model: MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false,
      },
    });

    // Parse the response
    const text = response.generated_text.trim();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result: SeatingResponse = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!result.assignments || !Array.isArray(result.assignments)) {
      throw new Error("Invalid response structure");
    }

    return result;
  } catch (error) {
    console.error("Hugging Face API Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get AI recommendation",
    );
  }
}

/**
 * Test the connection to Hugging Face
 */
export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const response = await hf.textGeneration({
      model: MODEL,
      inputs: "Hello, this is a test.",
      parameters: {
        max_new_tokens: 10,
      },
    });
    return !!response.generated_text;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
}
```

### Step 3: Create the AI Chat Component

Create `src/components/SeatingAIChat.tsx`:

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, message, Spin, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import {
  getSeatingRecommendation,
  Guest,
  Table,
  SeatingResponse,
} from '../services/huggingface.service';
import styles from './seating-ai-chat.module.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: SeatingResponse;
}

interface SeatingAIChatProps {
  guests: Guest[];
  tables: Table[];
  onApplySeating: (assignments: SeatingResponse['assignments']) => void;
}

export const SeatingAIChat: React.FC<SeatingAIChatProps> = ({
  guests,
  tables,
  onApplySeating,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'assistant',
      content:
        "Hello! I'm your AI seating assistant. I can help you arrange guests at tables based on their relationships and your preferences. Try asking me to:\n\n• Group families together\n• Separate certain guests\n• Fill tables evenly\n• Arrange by age groups\n\nWhat would you like me to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get AI recommendation
      const response = await getSeatingRecommendation({
        guests,
        tables,
        userMessage: input,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.explanation,
        timestamp: new Date(),
        data: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show conflicts if any
      if (response.conflicts && response.conflicts.length > 0) {
        message.warning({
          content: `Potential issues: ${response.conflicts.join(', ')}`,
          duration: 5,
        });
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Failed to get AI response'
      );

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or rephrase your request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (data: SeatingResponse) => {
    onApplySeating(data.assignments);
    message.success('Seating arrangement applied!');
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined />
          AI Seating Assistant
        </div>
      }
      className={styles.chatCard}
    >
      <div className={styles.messagesContainer}>
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <div
              className={
                msg.type === 'user' ? styles.userMessage : styles.assistantMessage
              }
            >
              <div className={styles.messageAvatar}>
                <Avatar
                  icon={msg.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: msg.type === 'user' ? '#1890ff' : '#52c41a',
                  }}
                />
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{msg.content}</div>
                {msg.data && (
                  <div className={styles.messageActions}>
                    <Tag color="blue">
                      {msg.data.assignments.length} assignments
                    </Tag>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleApply(msg.data!)}
                    >
                      Apply This Arrangement
                    </Button>
                  </div>
                )}
                <div className={styles.messageTime}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        />
        {loading && (
          <div className={styles.loadingMessage}>
            <Spin /> AI is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask me to arrange the seating... (e.g., 'Put all bride's family at tables 1-3')"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!input.trim()}
        >
          Send
        </Button>
      </div>
    </Card>
  );
};
```

### Step 4: Create Chat Styles

Create `src/components/seating-ai-chat.module.css`:

```css
.chatCard {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chatCard :global(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.messagesContainer {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
}

.userMessage,
.assistantMessage {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.userMessage {
  flex-direction: row-reverse;
}

.messageAvatar {
  flex-shrink: 0;
}

.messageContent {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.userMessage .messageContent {
  align-items: flex-end;
}

.messageText {
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
}

.userMessage .messageText {
  background: #1890ff;
  color: white;
}

.messageActions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.messageTime {
  font-size: 11px;
  color: #999;
}

.loadingMessage {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #666;
}

.inputContainer {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.inputContainer textarea {
  flex: 1;
}
```

### Step 5: Integrate into Your Table Assignment Page

Update `TableAssignmentPage.tsx`:

```typescript
import React, { useState } from 'react';
import { SeatingAIChat } from './SeatingAIChat';
import { Guest, Table } from '../services/huggingface.service';
// ... your existing imports

export const TableAssignmentPage: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([/* your guests */]);
  const [tables, setTables] = useState<Table[]>([/* your tables */]);

  const handleApplyAISeating = (
    assignments: Array<{ guestId: string; tableId: string }>
  ) => {
    // Update your state with the new assignments
    setGuests((prevGuests) =>
      prevGuests.map((guest) => {
        const assignment = assignments.find((a) => a.guestId === guest.id);
        if (assignment) {
          return { ...guest, tableId: assignment.tableId };
        }
        return guest;
      })
    );
  };

  return (
    <div className={styles.page}>
      {/* Your existing header */}

      <div className={styles.contentGrid}>
        {/* Your existing canvas */}
        <div className={styles.canvasCard}>
          {/* ... table canvas ... */}
        </div>

        {/* Add AI Chat */}
        <SeatingAIChat
          guests={guests}
          tables={tables}
          onApplySeating={handleApplyAISeating}
        />
      </div>
    </div>
  );
};
```

### Step 6: Update Your CSS Grid (Optional)

If you want AI chat in a third column:

```css
.contentGrid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr; /* Added third column */
  gap: 12px;
  min-height: 560px;
}

@media (max-width: 1400px) {
  .contentGrid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .contentGrid {
    grid-template-columns: 1fr;
  }
}
```

---

## Testing the Implementation

### Step 1: Manual Testing

1. **Test API Connection:**

```typescript
import { testHuggingFaceConnection } from "./services/huggingface.service";

// In a useEffect or button click
testHuggingFaceConnection().then((success) => {
  console.log("HuggingFace connected:", success);
});
```

2. **Test Simple Request:**
   Try asking: "Put all guests with 'bride_family' tag at table 1"

3. **Test Complex Request:**
   Try: "Arrange guests so families sit together, keep children away from the dance floor, and fill tables evenly"

### Step 2: Example Test Data

```typescript
const mockGuests: Guest[] = [
  { id: "g1", name: "Alice Smith", tags: ["bride_family", "adult"] },
  { id: "g2", name: "Bob Smith", tags: ["bride_family", "adult"] },
  { id: "g3", name: "Charlie Jones", tags: ["groom_family", "adult"] },
  { id: "g4", name: "Diana Jones", tags: ["groom_family", "children"] },
  { id: "g5", name: "Eve Wilson", tags: ["friend", "adult"] },
];

const mockTables: Table[] = [
  {
    id: "t1",
    name: "Table 1",
    shape: "round",
    capacity: 8,
    position: { x: 0, y: 0 },
  },
  {
    id: "t2",
    name: "Table 2",
    shape: "round",
    capacity: 8,
    position: { x: 150, y: 0 },
  },
];
```

### Step 3: Error Handling Test

Test these scenarios:

- Empty guest list
- Full tables
- Conflicting constraints
- Invalid API key
- Network timeout

---

## Troubleshooting

### Issue: "Invalid API Key"

**Solution:**

- Verify token is correctly copied
- Check `.env.local` has correct variable name
- Restart dev server after adding env variables
- Ensure no extra spaces in the token

### Issue: "Model Loading" or Slow Response

**Solution:**

- Free tier models may be "cold" and take 30-60 seconds on first request
- Subsequent requests are faster
- Consider showing a loading message: "Model is warming up..."
- Use `useEffect` to "warm up" model on page load:

```typescript
useEffect(() => {
  // Warm up the model
  testHuggingFaceConnection();
}, []);
```

### Issue: Invalid JSON Response

**Solution:**

- The model sometimes includes markdown or extra text
- The code already includes JSON extraction logic
- If problems persist, try a different model
- Add more explicit JSON formatting instructions to prompt

### Issue: Poor Quality Suggestions

**Solution:**

- Improve the prompt with more specific instructions
- Add more context about guest relationships
- Use a better model (Mixtral-8x7B)
- Provide examples in the prompt (few-shot learning)

### Issue: Rate Limit Errors

**Solution:**

- Free tier: ~1000 requests/day
- Add request queuing
- Cache common requests
- Consider upgrading to paid tier if needed

---

## Cost & Rate Limits

### Hugging Face Free Tier

- **Rate Limit:** ~1000 requests per day
- **Concurrent Requests:** Limited (queue system)
- **Model Loading:** May experience cold starts
- **Cost:** $0 (completely free)

### Upgrading to Paid Inference Endpoints

If you need more:

- **Dedicated Endpoint:** $0.06/hour (always warm, no cold starts)
- **No rate limits**
- **Faster response times**
- **More reliable**

Create dedicated endpoint:

```bash
# Via Hugging Face Hub
1. Go to model page
2. Click "Deploy" → "Inference Endpoints"
3. Select instance type
4. Update MODEL constant in service to your endpoint URL
```

---

## Advanced Features

### Feature 1: Conversation Memory

Add conversation history to improve context:

```typescript
const [conversationHistory, setConversationHistory] = useState<string[]>([]);

function buildPromptWithHistory(request: SeatingRequest): string {
  const history = conversationHistory
    .map((msg, i) => `[Turn ${i + 1}]: ${msg}`)
    .join("\n");

  return `Previous conversation:\n${history}\n\n${buildSeatingPrompt(request)}`;
}
```

### Feature 2: Constraint Validation

Add pre-validation before sending to AI:

```typescript
function validateConstraints(guests: Guest[], tables: Table[]): string[] {
  const issues: string[] = [];

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalGuests = guests.length;

  if (totalGuests > totalCapacity) {
    issues.push(
      `Not enough capacity: ${totalGuests} guests, ${totalCapacity} seats`,
    );
  }

  return issues;
}
```

### Feature 3: Undo/Redo

Track assignment history:

```typescript
const [assignmentHistory, setAssignmentHistory] = useState<Guest[][]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);

const handleUndo = () => {
  if (historyIndex > 0) {
    setGuests(assignmentHistory[historyIndex - 1]);
    setHistoryIndex(historyIndex - 1);
  }
};
```

### Feature 4: Export Recommendations

Save AI suggestions:

```typescript
const exportRecommendation = (response: SeatingResponse) => {
  const data = {
    timestamp: new Date().toISOString(),
    assignments: response.assignments,
    explanation: response.explanation,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `seating-plan-${Date.now()}.json`;
  a.click();
};
```

---

## Next Steps

1. **Implement the code** following steps 1-6
2. **Test thoroughly** with your actual guest data
3. **Gather user feedback** on AI suggestions
4. **Fine-tune prompts** based on common requests
5. **Consider upgrading** to dedicated endpoint if needed
6. **Add analytics** to track AI usage and quality

---

## Additional Resources

- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference/index)
- [Model Selection Guide](https://huggingface.co/models?pipeline_tag=text-generation)
- [Prompt Engineering Tips](https://huggingface.co/docs/transformers/main/en/tasks/prompting)
- [Rate Limits & Pricing](https://huggingface.co/pricing)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Hugging Face API status
3. Test with simpler prompts
4. Check browser console for errors
5. Verify environment variables are loaded

Good luck with your implementation! 🎉
