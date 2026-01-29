import { EventActions } from "@/app/contexts/EventActions";
import { useEvent } from "@/app/contexts/EventContext";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  InputNumberProps,
  Modal,
  Select,
} from "antd";
import { useState } from "react";
import TextArea from "antd/es/input/TextArea";
import { WEDDING_THEMES } from "@/app/constants/wedding-themes";
import { useLocale } from "@/app/hooks/useLocale";
import FormSection from "./FormSection";
import ClientInfoForm from "./ClientInfoForm";
import {
  DollarOutlined,
  EditOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import styles from "./create-event-modal.module.css";

type RequiredMark = boolean | "optional";

const CreateEventModal = () => {
  const [form] = Form.useForm();
  const [requiredMark, setRequiredMarkType] =
    useState<RequiredMark>("optional");
  const userLocale = useLocale();

  const formatter: InputNumberProps<number>["formatter"] = (value) => {
    if (!value) return "";
    const [start, end] = `${value}`.split(".") || [];
    const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$ ${end ? `${v}.${end}` : `${v}`}`;
  };

  const onRequiredTypeChange = ({
    requiredMarkValue,
  }: {
    requiredMarkValue: RequiredMark;
  }) => {
    setRequiredMarkType(requiredMarkValue);
  };

  const {
    state: {
      events: { openCreateOpenModal },
    },
    dispatch,
  } = useEvent();

  const closeModal = () => {
    dispatch({
      type: EventActions.SET_OPEN_CREATE_EVENT_MODAL,
      payload: false,
    });
  };

  return (
    <>
      <Modal
        width={800}
        title={<span className={styles.modalTitle}>Create Event</span>}
        closable={{ "aria-label": "Close button" }}
        cancelText="Cancel"
        okButtonProps={{
          className: styles.okButton,
        }}
        okText="Save"
        open={openCreateOpenModal}
        onOk={closeModal}
        onCancel={closeModal}
      >
        <div className={styles.createEventModal}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ requiredMarkValue: requiredMark }}
            onValuesChange={onRequiredTypeChange}
            requiredMark={requiredMark}
          >
            <FormSection title="Event Info">
              <Form.Item label="Event Name" name="eventName" required>
                <Input
                  placeholder="Sarah's & Mike's Wedding"
                  addonBefore={
                    <EditOutlined className={styles.iconSecondary} />
                  }
                />
              </Form.Item>
              <div className={styles.eventInfoContainer}>
                <Form.Item
                  className={styles.eventInfoItem}
                  label="Date and Time"
                  required
                >
                  <DatePicker
                    showTime
                    className={styles.datePicker}
                    showHour
                    showMinute
                    placeholder="Select date and time"
                    locale={userLocale.DatePicker}
                  />
                </Form.Item>
                <Form.Item
                  className={styles.eventInfoItem}
                  label="Location"
                  required
                >
                  <Input
                    placeholder="Location"
                    addonBefore={
                      <PushpinOutlined className={styles.iconSecondary} />
                    }
                  />
                </Form.Item>
              </div>
            </FormSection>

            <FormSection title="Details">
              <Form.Item label="Description" required>
                <TextArea
                  placeholder="Give a brief description"
                  maxLength={250}
                  showCount
                  className={styles.descriptionTextarea}
                />
              </Form.Item>
              <div className={styles.detailsContainer}>
                <Form.Item
                  className={styles.detailsItem}
                  label="Theme"
                  required
                >
                  <Select
                    placeholder="Select a wedding theme"
                    options={WEDDING_THEMES}
                    className={styles.themeSelect}
                  />
                </Form.Item>
                <Form.Item
                  className={styles.detailsItem}
                  label="Budget"
                  required
                >
                  <InputNumber
                    formatter={formatter}
                    addonBefore={
                      <DollarOutlined className={styles.iconSecondary} />
                    }
                    parser={(value) =>
                      value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                    }
                    className={styles.budgetInput}
                  />
                </Form.Item>
              </div>
              <Form.Item label="Comments" required>
                <TextArea
                  placeholder="Comments about the event"
                  maxLength={250}
                  showCount
                  className={styles.commentsTextarea}
                />
              </Form.Item>
            </FormSection>

            <FormSection title="Clients">
              <ClientInfoForm
                title="Bride"
                emailPlaceholder="Bride email"
                phonePlaceholder="Bride phone number"
              />
              <ClientInfoForm
                title="Groom"
                emailPlaceholder="Groom email"
                phonePlaceholder="Groom phone number"
              />
            </FormSection>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default CreateEventModal;
