import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Network from 'expo-network';
import { Platform, AppState } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isChecking: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isChecking: true,
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? false);
    } catch {
      setIsConnected(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkConnection();
      }
    });

    let interval: ReturnType<typeof setInterval> | null = null;
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        subscription.remove();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    interval = setInterval(checkConnection, 15000);

    return () => {
      subscription.remove();
      if (interval) clearInterval(interval);
    };
  }, [checkConnection]);

  return (
    <NetworkContext.Provider value={{ isConnected, isChecking }}>
      {children}
    </NetworkContext.Provider>
  );
}
