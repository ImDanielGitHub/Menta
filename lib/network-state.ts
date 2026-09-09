export type ReachabilityState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

/**
 * NetInfo reports reachability as null while iOS is still checking the route.
 * A connected Wi-Fi/cellular route is stronger evidence than iOS's secondary
 * reachability probe, which can remain false after the route has recovered.
 * Actual requests still own server availability and queue-on-failure logic.
 */
export const isNetworkStateOnline = (state: ReachabilityState): boolean => {
  if (state.isConnected === false) return false;
  if (state.isConnected === true) return true;
  return state.isInternetReachable !== false;
};
