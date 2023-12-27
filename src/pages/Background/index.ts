import { CampaignRelatedToDomainDataType } from '../../types/Galxe';

let $campaigns: CampaignRelatedToDomainDataType | null = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled');

  scheduleRequest();
  scheduleWatchdog();
  fetchCampaignsData();
});

// fetch and save data when chrome restarted, alarm will continue running when chrome is restarted
chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup');
  fetchCampaignsData();
});

// alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  // if watchdog is triggered, check whether refresh alarm is there
  if (alarm && alarm.name === 'watchdog') {
    chrome.alarms.get('refresh', (alarm) => {
      if (!alarm) {
        // if it is not there, start a new request and reschedule refresh alarm
        console.log("Refresh alarm doesn't exist, starting a new one");
        fetchCampaignsData();
        scheduleRequest();
      }
    });
  } else {
    // if refresh alarm triggered, start a new request
    fetchCampaignsData();
  }
});

// schedule a new fetch every 30 minutes
function scheduleRequest() {
  console.log('schedule refresh alarm to 30 minutes...');
  chrome.alarms.create('refresh', { periodInMinutes: 30 });
}

// schedule a watchdog check every 5 minutes
function scheduleWatchdog() {
  console.log('schedule watchdog alarm to 5 minutes...');
  chrome.alarms.create('watchdog', { periodInMinutes: 5 });
}

// fetch data and save to local storage
async function fetchCampaignsData(): Promise<void> {
  console.log('start HTTP Request...');
  const response = await fetch(
    'https://galxe-data.stevenlei.com/campaigns.json'
  );
  const data = await response.json();

  // save to chrome storage
  chrome.storage.local.set({ campaigns: JSON.stringify(data) }, () => {
    console.log('Campaigns data saved.');
  });

  $campaigns = data;
}

chrome.tabs.onCreated.addListener(function (tab) {
  chrome.action.setBadgeText({
    text: '',
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log(`onUpdated`);

  if ($campaigns === null) return undefined;
  if (tab.url?.startsWith('chrome://')) return undefined;

  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];

      // get the domain of current tab
      const url = new URL(activeTab.url!);
      const domain = url.hostname.replace('www.', '');

      // Get the count of the current domain if any
      const count = $campaigns!.domains[domain];

      if (count) {
        chrome.action.setBadgeText({
          text: `${count}`,
        });
      } else {
        chrome.action.setBadgeText({
          text: '',
        });
      }
    });
  }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log(`onActivated`);
  if ($campaigns === null) return undefined;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];

    // get the domain of current tab
    const url = new URL(activeTab.url!);
    const domain = url.hostname.replace('www.', '');

    // Get the count of the current domain if any
    const count = $campaigns!.domains[domain];

    if (count) {
      chrome.action.setBadgeText({
        text: `${count}`,
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
      });
    }
  });
});
