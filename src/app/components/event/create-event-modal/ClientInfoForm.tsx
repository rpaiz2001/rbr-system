import { MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input } from "antd";
import { useState } from "react";
import styles from "./create-event-modal.module.css";

interface ClientInfoFormProps {
  title: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
}

const ClientInfoForm = ({
  title,
  emailPlaceholder,
  phonePlaceholder,
}: ClientInfoFormProps) => {
  const [phoneValue, setPhoneValue] = useState("");

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "");

    if (phoneNumber.length === 0) return "";
    if (phoneNumber.length <= 2) {
      return `(${phoneNumber}`;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    } else {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(
        2,
        6
      )}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
  };

  return (
    <>
      <h4 className={styles.clientInfoTitle}>{title}</h4>
      <div className={styles.clientInfoContainer}>
        <Form.Item
          className={styles.clientInfoItem}
          label="Email"
          required
          rules={[
            { required: true, message: "Please enter email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input
            prefix={<MailOutlined className={styles.iconSecondary} />}
            placeholder={emailPlaceholder}
          />
        </Form.Item>
        <Form.Item
          className={styles.clientInfoItem}
          label="Phone Number"
          required
          rules={[
            { required: true, message: "Please enter phone number!" },
            {
              pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
              message: "Please enter a valid phone number!",
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className={styles.iconSecondary} />}
            placeholder={phonePlaceholder}
            value={phoneValue}
            onChange={handlePhoneChange}
            maxLength={14}
          />
        </Form.Item>
      </div>
    </>
  );
};

export default ClientInfoForm;
