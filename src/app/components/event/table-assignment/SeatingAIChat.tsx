"use client";
import React, { useEffect, useRef, useState } from "react";
import { Card, Input, Button, List, Avatar, message, Spin, Tag } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import styles from "./seating-ai-chat.module.css";
import {
  getSeatingRecommendation,
  HFGuest,
  HFTable,
  SeatingResponse,
  testHuggingFaceConnection,
} from "./huggingface.service";

interface MessageItem {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: SeatingResponse;
}

interface SeatingAIChatProps {
  guests: HFGuest[];
  tables: HFTable[];
  onApplySeating: (assignments: SeatingResponse["assignments"]) => void;
}

const SeatingAIChat: React.FC<SeatingAIChatProps> = ({
  guests,
  tables,
  onApplySeating,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "0",
      type: "assistant",
      content:
        "Hello! I'm your AI seating assistant. I can help you arrange guests at tables based on their relationships and your preferences. Try asking me to:\n\n• Group families together\n• Separate certain guests\n• Fill tables evenly\n• Arrange by age groups\n\nWhat would you like me to do?",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // optional warm up
    testHuggingFaceConnection().then((ok) => {
      if (!ok) {
        // don't spam the user, but log
        console.info("Hugging Face warmup may have failed or is slow");
      }
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: MessageItem = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await getSeatingRecommendation({
        guests,
        tables,
        userMessage: input,
      });

      const assistantMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.explanation ?? "AI seating suggestion",
        timestamp: new Date(),
        data: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.conflicts && response.conflicts.length > 0) {
        message.warning(
          `Potential issues: ${response.conflicts.join(", ")}`,
          5,
        );
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to get AI response",
      );

      const errorMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I'm sorry, I encountered an error. Please try again or rephrase your request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const [appliedMessageId, setAppliedMessageId] = useState<string | null>(null);
  const handleApply = (data: SeatingResponse, msgId: string) => {
    onApplySeating(data.assignments);
    setAppliedMessageId(msgId);
    message.success({
      content:
        "Seating arrangement approved and applied! Your event layout has been updated.",
      duration: 3,
    });
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                msg.type === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }
            >
              <div className={styles.messageAvatar}>
                <Avatar
                  icon={
                    msg.type === "user" ? <UserOutlined /> : <RobotOutlined />
                  }
                  style={{
                    backgroundColor:
                      msg.type === "user" ? "#1890ff" : "#52c41a",
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
                    {appliedMessageId !== msg.id && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleApply(msg.data!, msg.id)}
                      >
                        Apply This Arrangement
                      </Button>
                    )}
                    {appliedMessageId === msg.id && (
                      <Tag color="success">Arrangement applied!</Tag>
                    )}
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
          placeholder="Ask me to arrange the seating... (e.g., 'Put all bride\'s family at tables 1-3')"
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

export default SeatingAIChat;
