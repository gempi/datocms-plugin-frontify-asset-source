import {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

interface AssetBrowserContextInterface {
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  hasMore: boolean;
}

const defaultValues: AssetBrowserContextInterface = {
  setLoading: () => {},
  loading: true,
  setHasMore: () => {},
  hasMore: false,
};

export const AssetBrowserContext =
  createContext<AssetBrowserContextInterface>(defaultValues);

const AssetBrowserProvider = ({ children }: { children: ReactNode }) => {
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  return (
    <AssetBrowserContext.Provider
      value={{ hasMore, setHasMore, loading, setLoading }}
    >
      {children}
    </AssetBrowserContext.Provider>
  );
};

export default AssetBrowserProvider;
