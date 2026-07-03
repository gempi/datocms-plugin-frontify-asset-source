import {
  useState,
  createContext,
  useContext,
  useMemo,
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

export const AssetBrowserContext = createContext<
  AssetBrowserContextInterface | undefined
>(undefined);

export const useAssetBrowser = (): AssetBrowserContextInterface => {
  const context = useContext(AssetBrowserContext);
  if (context === undefined) {
    throw new Error(
      "useAssetBrowser must be used within an AssetBrowserProvider",
    );
  }
  return context;
};

const AssetBrowserProvider = ({ children }: { children: ReactNode }) => {
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const value = useMemo(
    () => ({ hasMore, setHasMore, loading, setLoading }),
    [hasMore, setHasMore, loading, setLoading],
  );

  return (
    <AssetBrowserContext.Provider value={value}>
      {children}
    </AssetBrowserContext.Provider>
  );
};

export default AssetBrowserProvider;
