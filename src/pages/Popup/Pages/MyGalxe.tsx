import React from 'react';
import { useState, useEffect, useRef } from 'react';

// Helper functions
import clsx from 'clsx';
import { getFromChromeStorage } from '../../../helpers/Storage';
import { getUserInfo, fetchClaimableCampaigns } from '../../../helpers/Galxe';

import { AddressInfoDataType, CampaignDataType } from '../../../types/Galxe';

// Icons
import CloseButton from '../../../assets/svg/CloseButton.svg';
import RefreshIcon from '../../../assets/svg/RefreshIcon.svg';
import ConnectToGalxe from '../../../assets/img/ConnectToGalxe.png';

const ConnectNotice = ({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (address: string) => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showConnectText, setShowConnectText] = useState(true);
  const [isOnGalxeWebsite, setIsOnGalxeWebsite] = useState(false);
  const isOnGalxeRef = useRef<boolean>(false);
  const [isGalxeWalletAddressAvailable, setIsGalxeWalletAddressAvailable] =
    useState(false);
  const tabIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    initConnection();
  }, []);

  const initConnection = async () => {
    try {
      // Determine if current website is galxe.com
      const isOnGalxeQuery = await isOnGalxe();
      isOnGalxeRef.current = isOnGalxeQuery.isOnGalxe;
      setIsOnGalxeWebsite(isOnGalxeQuery.isOnGalxe);
      tabIdRef.current = isOnGalxeQuery.tabId;

      if (isOnGalxeRef.current) {
        setShowConnectText(false);
      } else {
        return;
      }

      // Check if the wallet address is available on Galxe website
      const walletAddressAvailable = await fetchWalletAddressFromGalxe();
      if (walletAddressAvailable) {
        setIsGalxeWalletAddressAvailable(true);
      }

      // See if there is a saved address in chrome.storage
      const shouldAutoConnect = await getFromChromeStorage('shouldAutoConnect');
      const savedAddress = await getFromChromeStorage('address');

      if (savedAddress) {
        onConnect(savedAddress);
      } else {
        if (shouldAutoConnect) {
          const connectedWalletAddress = await fetchWalletAddressFromGalxe();

          if (connectedWalletAddress) {
            console.log(`connected wallet address: ${connectedWalletAddress}`);

            // Store to chrome.storage
            chrome.storage.local.set({
              address: connectedWalletAddress,
              shouldAutoConnect: true,
            });

            onConnect(connectedWalletAddress);
          }
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoaded(true);
    }
  };

  const visitWebsite = async (url: string) => {
    if (isOnGalxeRef.current) {
      await chrome.storage.local.set({ shouldAutoConnect: true });
      initConnection();
    } else {
      chrome.tabs.create({
        url,
      });
    }
  };

  const isOnGalxe = async (): Promise<{
    isOnGalxe: boolean;
    tabId: number | undefined;
  }> => {
    return new Promise((resolve, reject) => {
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(async ([tab]) => {
          if (tab.url !== 'https://galxe.com/') {
            resolve({
              isOnGalxe: false,
              tabId: tab.id,
            });
          } else {
            resolve({
              isOnGalxe: true,
              tabId: tab.id,
            });
          }
        })
        .catch((err) => {
          console.error(err);
          reject({
            isOnGalxe: false,
            tabId: undefined,
          });
        });
    });
  };

  const fetchWalletAddressFromGalxe = async () => {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabIdRef.current! },
      func: () => {
        return document
          .querySelector('#ga-galxe-userinfo')
          ?.getAttribute('ga-data-galxe-userinfo');
      },
    });

    if (!result[0].result) {
      return null;
    }

    const data = JSON.parse(result[0].result);

    return data?.address || null;
  };

  return (
    <>
      {isLoaded && (
        <div className="flex flex-col justify-center items-center px-12 flex-1 text-white">
          <img src={ConnectToGalxe} className="w-full" onClick={onClose} />

          <button
            onClick={() => visitWebsite('https://galxe.com')}
            className={`w-full py-2.5 mt-8 flex flex-col items-center justify-center rounded-xl bg-[#0057FF] hover:bg-[#3679ff] transition ${
              !isGalxeWalletAddressAvailable && isOnGalxeWebsite
                ? 'disabled:opacity-50 cursor-not-allowed hover:bg-[#0057FF]'
                : ''
            }`}
            disabled={!isGalxeWalletAddressAvailable && isOnGalxeWebsite}
          >
            {showConnectText ? (
              <>
                <span className="font-bold text-xl">Visit Galxe</span>
                <span className="text-xs">And open this extension again</span>
              </>
            ) : (
              <>
                {isGalxeWalletAddressAvailable ? (
                  <>
                    <span className="font-bold text-xl">Load Profile</span>
                    <span className="text-xs">Fetch your Galxe Profile</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-xl">Login Galxe</span>
                    <span className="text-xs">With your wallet first</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

const MyGalxe = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfoDataType | null>(
    null
  );

  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSucceed, setClaimSucceed] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [claimableList, setClaimableList] = useState<CampaignDataType[] | null>(
    null
  );

  useEffect(() => {
    refresh();
  }, [connectedAddress, isConnected]);

  const handleGalxeConnect = (address: string) => {
    setConnectedAddress(address);
    setIsConnected(true);
  };

  const refresh = async () => {
    if (!connectedAddress) {
      return;
    }

    //
    setRefreshing(true);

    const userInfo = await getUserInfo(connectedAddress);
    setAddressInfo(userInfo);

    if (!userInfo) {
      return;
    }

    const claimables = await fetchClaimableCampaigns(userInfo.id);

    if (!claimables) {
      return;
    }

    setClaimableList(claimables);
    console.log(claimables);

    setRefreshing(false);
  };

  const autoClaim = async () => {
    if (claiming) {
      return;
    }
    setClaiming(true);

    const gaslessCampaigns = claimableList?.filter(
      (item) => item.gasType === 'Gasless'
    );

    // send message to active tab's content script to start the claiming process
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(tab.id!, {
      type: 'claim',
      campaigns: gaslessCampaigns,
    });
  };

  const close = () => {
    setModalOpened(false);
    setClaimSucceed(false);
  };

  const shortenAddress = (address: string): string => {
    if (!address) {
      return '';
    }

    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const visitWebsite = (url: string) => {
    chrome.tabs.create({
      url,
    });
  };

  const disconnect = () => {
    chrome.storage.local.set({ address: '', shouldAutoConnect: false });
    setIsConnected(false);
  };

  return (
    <>
      {isConnected ? (
        <div className="flex-1">
          <div className="mb-6 px-5 py-4 rounded-3xl text-base bg-[#15171C] border border-black space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#9097A6]">Connected on Galxe</span>
              <span
                onClick={disconnect}
                className="text-xs text-gray-600 hover:text-gray-400 transition cursor-pointer"
              >
                Disconnect
              </span>
            </div>
            <div className="flex items-center space-x-4 font-bold h-6">
              <span>
                {connectedAddress && shortenAddress(connectedAddress)}
              </span>
              {addressInfo?.username && (
                <span className="inline-block px-4 py-1 rounded-tl-xl rounded-br-xl rounded-tr rounded-bl text-white bg-[#00B88D] truncate">
                  {addressInfo.username}
                </span>
              )}
            </div>
          </div>
          <ul
            className={clsx(
              'mb-10 p-4 flex rounded-3xl text-sm bg-[#15171C] border border-black divide-x divide-[#262B33]'
            )}
          >
            <li className="w-1/2 flex flex-col items-center space-y-1">
              <span className="font-bold text-xl h-6">
                {typeof addressInfo?.oat?.totalCount !== 'undefined'
                  ? addressInfo.oat.totalCount
                  : '...'}
              </span>
              <span className="text-xs text-[#9097A6]">OATs</span>
            </li>
            <li className="w-1/2 flex flex-col items-center space-y-1">
              <span className="font-bold text-xl h-6">
                {typeof addressInfo?.nft?.totalCount !== 'undefined'
                  ? addressInfo.nft.totalCount
                  : '...'}
              </span>
              <span className="text-xs text-[#9097A6]">NFTs</span>
            </li>
          </ul>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold text-base">
                Claimable {claimableList ? `(${claimableList.length})` : ''}
              </span>
              <button
                className={`${refreshing && 'animate-spin'}`}
                onClick={refresh}
              >
                <img src={RefreshIcon} className="w-4 h-4" alt="RefreshIcon" />
              </button>
            </div>
            {claimableList && claimableList.length > 0 && (
              <>
                <ul className="mb-6 px-5 py-4 flex flex-col rounded-3xl text-sm bg-[#15171C] border border-[#20242B] space-y-4 divide-y divide-[#262B33]">
                  {claimableList.map((item, index) => (
                    <li
                      key={item.id}
                      className={clsx([index !== 0 && 'pt-4'], 'space-y-2')}
                    >
                      <span
                        className="font-bold text-base cursor-pointer truncate block"
                        onClick={() =>
                          visitWebsite(
                            `https://galxe.com/${item.space.alias}/campaign/${item.id}`
                          )
                        }
                      >
                        {item.name}
                      </span>
                      <div className="flex justify-between text-sm text-[#CED3DB]">
                        <span
                          className="cursor-pointer"
                          onClick={() =>
                            visitWebsite(
                              `https://galxe.com/${item.space.alias}`
                            )
                          }
                        >
                          By {item.space.name}
                        </span>
                        <span>
                          {item.type}, {item.gasType}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  className="w-full py-2.5 flex flex-col items-center justify-center rounded-xl bg-[#0057FF] hover:bg-[#3679ff] transition"
                  onClick={() => setModalOpened(!modalOpened)}
                >
                  <span className="font-bold text-xl">Auto Claim</span>
                  <span className="text-xs">For Gasless OATs</span>
                </button>
              </>
            )}
          </div>

          {modalOpened && (
            <div className="fixed inset-0 p-4 flex items-center justify-center bg-black bg-opacity-80 z-20">
              <div className="relative px-5 py-4 rounded-3xl bg-[#1B1E24] space-y-4">
                <span className="font-bold text-2xl">Auto Claim</span>
                <p className="text-sm">
                  Galxe Chrome Extension allows you to auto claim the Gasless
                  OATs by browser automation, please wait for the whole process
                  to complete before switching to other tab/page.
                </p>
                <ul className="max-h-[50vh] py-2 overflow-y-scroll scrollbar-hide flex flex-col text-sm space-y-4">
                  {claimableList &&
                    claimableList
                      .filter((item) => item.gasType === 'Gasless')
                      .map((item, index) => (
                        <li
                          key={item.id}
                          className={clsx(
                            [index !== 0 && ''],
                            'flex items-center px-5 py-3 space-x-4 rounded-3xl border border-[#20242B] bg-[#15171C]'
                          )}
                        >
                          <span className="">
                            {claimSucceed ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle cx="12" cy="12" r="11" fill="#00B58B" />
                                <path
                                  stroke="#000"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m8 12 3 3 5-5"
                                />
                              </svg>
                            ) : (
                              <svg
                                className={clsx(
                                  'inline-block w-6 h-6',
                                  claiming && 'animate-spin'
                                )}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                {claiming && (
                                  <path
                                    className="text-[#00B58B] opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                )}
                              </svg>
                            )}
                          </span>
                          <div className="space-y-1">
                            <span className="font-bold">{item.name}</span>
                            <div className="flex justify-between text-xs text-[#CED3DB]">
                              <span>By {item.space.name}</span>
                              <span>
                                {item.type}, {item.gasType}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                </ul>

                <>
                  {claimSucceed ? (
                    <button
                      className={clsx(
                        'w-full py-3 flex flex-col items-center justify-center rounded-xl space-y-1 text-[#00B58B] border-2 border-[#00B58B]'
                      )}
                      onClick={close}
                    >
                      <span className="font-bold text-xl">Completed</span>
                    </button>
                  ) : (
                    <button
                      className={clsx(
                        'w-full py-2 flex flex-col items-center justify-center rounded-xl',
                        claiming
                          ? 'cursor-not-allowed bg-[#494F59]'
                          : 'bg-[#0057FF] hover:bg-[#3679ff] transition'
                      )}
                      onClick={autoClaim}
                    >
                      <span className="font-bold text-xl">Start</span>
                      <span className="text-xs">
                        Auto-claim for Gasless OATs
                      </span>
                    </button>
                  )}
                </>

                <button
                  className="absolute top-0 right-0 transform -translate-x-4 translate-y-2"
                  onClick={close}
                >
                  <img src={CloseButton} className="w-4 h-4" alt="logo" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ConnectNotice
          onClose={() => {
            setIsConnected(true);
          }}
          onConnect={handleGalxeConnect}
        />
      )}
    </>
  );
};

export default MyGalxe;
