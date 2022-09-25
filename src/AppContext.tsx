import {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

interface AppContextInterface {
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  hasMore: boolean;
}

const defaultValues: AppContextInterface = {
  setLoading: () => {},
  loading: true,
  setHasMore: () => {},
  hasMore: false,
};

export const AppContext = createContext<AppContextInterface>(defaultValues);

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  return (
    <AppContext.Provider value={{ hasMore, setHasMore, loading, setLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
