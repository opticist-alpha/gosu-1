let accessToken = null;
let refreshPromise = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function withRefreshLock(refreshFn) {
  if (!refreshPromise) {
    refreshPromise = Promise.resolve(refreshFn()).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
