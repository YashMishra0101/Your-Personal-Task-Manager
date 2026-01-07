import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * OfflineIndicator component
 * Shows a simple text message in the header when the user is offline
 * Automatically hides when connection is restored
 */
export default function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  const [showReconnected, setShowReconnected] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show "reconnected" message briefly
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence mode="wait">
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          <WifiOff className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-medium text-amber-500">
            Offline
          </p>
        </motion.div>
      )}
      
      {showReconnected && isOnline && (
        <motion.div
          key="online"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          <Wifi className="w-4 h-4 text-green-500" />
          <p className="text-sm font-medium text-green-500">
            Online
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
