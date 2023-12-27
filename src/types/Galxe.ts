export type AddressInfoDataType = {
  id: string;
  username: string;
  participatedCampaignCount: number;
  nft: {
    totalCount: number;
  };
  oat: {
    totalCount: number;
  };
};

export type CampaignDataType = {
  id: string;
  name: string;
  thumbnail: string;
  space: {
    alias: string;
    name: string;
  };
  type: string;
  gasType: string;
  participants: {
    participantsCount: number;
  };
};

export type CampaignRelatedToDomainCampaignDataType = {
  id: string;
  name: string;
  thumbnail: string;
  space: {
    alias: string;
    name: string;
  };
  participants: number;
  domains: string[];
};

export type CampaignRelatedToDomainDomainDataType = {
  [domain: string]: number;
};

export type CampaignRelatedToDomainDataType = {
  campaigns: CampaignRelatedToDomainCampaignDataType[];
  domains: CampaignRelatedToDomainDomainDataType;
};
