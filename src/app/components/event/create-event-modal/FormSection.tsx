import { Divider } from "antd";
import styles from "./create-event-modal.module.css";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection = ({ title, children }: FormSectionProps) => (
  <>
    <h3 className={styles.formSectionTitle}>{title}</h3>
    <Divider className={styles.formSectionDivider} />
    {children}
  </>
);

export default FormSection;
