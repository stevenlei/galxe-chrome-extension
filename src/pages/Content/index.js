function showClaimingBanner(status = '') {
  let banner = document.querySelector('#galxe-extension-header');

  if (!banner) {
    const banner = document.createElement('div');
    banner.setAttribute('id', 'galxe-extension-header');
    banner.classList.add('galxe-extension-header');
    banner.innerHTML =
      'Galxe Extension: Auto Claim in Progress... <span></span>';
    document.querySelector('body').prepend(banner);
  }

  if (status) {
    document.querySelector('#galxe-extension-header span').innerHTML = status;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('request', request);
  console.log('sender', sender);
  console.log('sendResponse', sendResponse);

  if (request.type === 'claim') {
    // Save the payload to chrome storage
    chrome.storage.local.set({ autoClaimCampaigns: request.campaigns }, () => {
      console.log('Campaigns saved to chrome storage');
      // reload the page
      window.location.reload();
    });
  }
});

window.addEventListener('load', async () => {
  console.log('window onload');

  // check if autoClaimCampaigns from chrome storage is set
  chrome.storage.local.get(['autoClaimCampaigns'], async (result) => {
    console.log(result.autoClaimCampaigns);
    if (
      !result.autoClaimCampaigns ||
      (result.autoClaimCampaigns && result.autoClaimCampaigns.length === 0)
    ) {
      return;
    }

    showClaimingBanner(`${result.autoClaimCampaigns.length} campaign(s) left`);

    // Start claiming
    console.log('Start claiming');

    // get the first item from the array
    const campaign = result.autoClaimCampaigns[0];
    const campaignUrl = `https://galxe.com/${campaign.space.alias}/campaign/${campaign.id}`;

    if (window.location.href !== campaignUrl) {
      window.location = campaignUrl;
      return;
    }

    // click the claim button
    const maxTries = 10;
    let tries = 0;

    let claimButton;

    while (true) {
      claimButton = document.querySelector('.claim-button button');

      if (!claimButton) {
        console.log('Claim button not found');
        await wait(2000);
        tries++;

        if (tries > maxTries) {
          console.log('Claim button not found after all attempts');
          break;
        }

        continue;
      }

      break;
    }

    if (!claimButton) {
      return;
    }

    tries = 0;

    while (true) {
      if (claimButton.hasAttribute('disabled')) {
        console.log('Claim button is disabled');

        await wait(2000);

        tries++;

        if (tries > maxTries) {
          console.log('Claim button is not active after all attempts');
          break;
        }

        continue;
      }

      break;
    }

    if (!claimButton.hasAttribute('disabled')) {
      claimButton.click();

      tries = 0;

      while (true) {
        // check if the claiming is successful
        if (document.querySelector('.transaction-result-popup')) {
          // assumed to be success
          break;
        }

        if (tries > maxTries) {
          break;
        }

        await wait(3000);
        tries++;
      }
    }

    // remove the first item from the array
    result.autoClaimCampaigns.shift();

    // save the new array to chrome storage
    chrome.storage.local.set(
      { autoClaimCampaigns: result.autoClaimCampaigns },
      () => {
        console.log('Campaigns saved to chrome storage');
      }
    );

    console.log('result.autoClaimCampaigns', result.autoClaimCampaigns);

    if (result.autoClaimCampaigns.length > 0) {
      // get next campaign
      const nextCampaign = result.autoClaimCampaigns[0];
      const nextCampaignUrl = `https://galxe.com/${nextCampaign.space.alias}/campaign/${nextCampaign.id}`;

      // redirect to the next campaign
      window.location = nextCampaignUrl;
    } else {
      window.location.reload();
    }
  });
});

async function wait(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
