import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

import Logo from '../../../assets/svg/Logo.svg';
import CloseButton from '../../../assets/svg/CloseButton.svg';
import User from '../../../assets/svg/User.svg';
import UserActive from '../../../assets/svg/UserActive.svg';
import Diamond from '../../../assets/svg/Diamond.svg';
import DiamondActive from '../../../assets/svg/DiamondActive.svg';

import { getFromChromeStorage } from '../../../helpers/Storage';

import { CampaignRelatedToDomainDataType } from '../../../types/Galxe';

const Root = () => {
  const [campaignsCount, setCampaignsCount] = useState<number>(0);

  const closePopup = () => {
    window.close();
  };

  useEffect(() => {
    fetchRelatedCampaignsCount();
  }, []);

  const fetchRelatedCampaignsCount = async () => {
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

    const campaignsCount = data.domains[domain] || 0;

    setCampaignsCount(campaignsCount);
  };

  return (
    <div className="flex flex-col relative w-[380px] h-[600px] text-white bg-[#090A0D]">
      <header className="p-4 flex justify-between">
        <div className="flex items-center space-x-2">
          <img src={Logo} className="w-30" alt="Galxe" />
        </div>
        <button onClick={closePopup}>
          <img src={CloseButton} className="w-4 h-4" alt="Close" />
        </button>
      </header>
      <main className="flex flex-col p-4 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <footer className="py-3 bg-[#090A0D]">
        <ul className="flex items-center">
          <li className="w-1/2">
            <NavLink
              to="/galxe"
              className={({ isActive }) =>
                `w-full flex flex-col items-center justify-center space-y-1 group ${
                  isActive ? '' : 'opacity-70'
                }`
              }
            >
              {(isActive) => (
                <>
                  <img
                    src={isActive ? UserActive : User}
                    className="w-7 h-7"
                    alt="My Galxe"
                  />
                  <span>My Galxe</span>
                </>
              )}
            </NavLink>
          </li>
          <li className="w-1/2">
            <NavLink
              to="/campaigns"
              className={({ isActive }) =>
                `w-full flex flex-col items-center justify-center space-y-1 group relative ${
                  isActive ? '' : 'opacity-70'
                }`
              }
            >
              {(isActive) => (
                <>
                  {campaignsCount > 0 && (
                    <span className="bg-red-500 text-xs text-white rounded-full px-1 min-w-4 h-4 flex justify-center items-center font-bold absolute top-0 ml-12">
                      {campaignsCount}
                    </span>
                  )}
                  <img
                    src={isActive ? DiamondActive : Diamond}
                    className="w-7 h-7"
                    alt="Campaigns"
                  />
                  <span>Campaigns</span>
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </footer>
    </div>
  );
};

export default Root;
