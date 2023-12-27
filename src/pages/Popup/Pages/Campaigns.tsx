import React from 'react';
import { useState, useEffect } from 'react';

import { getFromChromeStorage } from '../../../helpers/Storage';

import {
  CampaignRelatedToDomainDataType,
  CampaignRelatedToDomainCampaignDataType,
} from '../../../types/Galxe';

import './Campaigns.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<
    CampaignRelatedToDomainCampaignDataType[] | null
  >(null);
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    //
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    //
    const dataFromStorage = await getFromChromeStorage('campaigns');

    if (!dataFromStorage) {
      return;
    }

    const data: CampaignRelatedToDomainDataType = JSON.parse(dataFromStorage);

    // get current tab url
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // get the domain
    const url = new URL(tab.url!);
    const domain = url.hostname.replace('www.', '');

    // filter campaigns by domain
    const filteredCampaigns = data.campaigns.filter((campaign) =>
      campaign.domains.includes(domain)
    );

    console.log(filteredCampaigns);

    setDomain(domain);
    setCampaigns(filteredCampaigns);
  };

  const visitWebsite = (url: string) => {
    chrome.tabs.create({
      url,
    });
  };

  return (
    <div className="flex-1">
      {campaigns && (
        <>
          <div className="mb-12 px-7 py-4 rounded-3xl text-base bg-[#15171C] border border-black space-x-1">
            <span className="text-[#9097A6]">
              Displaying on-going campaigns related to
            </span>
            <span className="font-bold text-[#0057FF]">{domain}</span>
          </div>

          {campaigns.length > 0 &&
            campaigns.map((campaign, index) => (
              <div
                className="mb-12 text-center space-y-3"
                key={`${campaign.id}-${index}`}
              >
                <span className="font-bold text-xl">{campaign.space.name}</span>
                <div className="flex p-3 rounded-3xl text-base bg-[#15171C] border border-black space-x-4">
                  <div className="w-24 flex-shrink-0 rounded-2xl">
                    {campaign.thumbnail.endsWith('.mp4') && (
                      <video
                        src={campaign.thumbnail}
                        className="rounded-xl"
                        autoPlay
                        loop
                        muted
                      />
                    )}

                    {!campaign.thumbnail.endsWith('.mp4') && (
                      <img
                        src={campaign.thumbnail}
                        className="rounded-xl"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-between items-start text-left flex-1">
                    <div className="flex flex-col">
                      <span className="mb-1 font-bold">{campaign.name}</span>
                      <span>{campaign.participants} participants</span>
                    </div>
                    <button
                      className="text-[#0057FF]"
                      onClick={() =>
                        visitWebsite(
                          `https://galxe.com/${campaign.space.alias}/campaign/${campaign.id}`
                        )
                      }
                    >
                      View More
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
};

export default Campaigns;
