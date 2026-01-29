import { useState, useEffect } from "react";
import esES from "antd/locale/es_ES";
import enUS from "antd/locale/en_US";

export const useLocale = () => {
  const [userLocale, setUserLocale] = useState(enUS);

  useEffect(() => {
    const browserLocale =
      navigator.language || navigator.languages?.[0] || "en-US";
    setUserLocale(browserLocale.startsWith("es") ? esES : enUS);
  }, []);

  return userLocale;
};

