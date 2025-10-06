// src/context/loadingContext.ts
import React, { createContext, useContext, useState, useEffect } from "react";
import { loadingManager } from "./loadingManager";

interface LoadingContextType {
  loading: boolean;
  setLoading: (val: boolean) => void;
}

export const LoadingContext = createContext<LoadingContextType>({
  loading: false,
  setLoading: () => {},
});

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadingManager.register(setLoading);
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
