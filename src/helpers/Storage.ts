export function getFromChromeStorage(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (result[key]) {
        resolve(result[key]);
      } else {
        resolve(null);
      }
    });
  });
}
