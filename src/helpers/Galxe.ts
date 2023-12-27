import { AddressInfoDataType, CampaignDataType } from '../types/Galxe';

export async function getUserInfo(
  address: string
): Promise<AddressInfoDataType | null> {
  try {
    const response = await fetch('https://graphigo.prd.galaxy.eco/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query {
        addressInfo(address:"${address}") {
          id
          username
          participatedCampaignCount(input:{
            onlyVerified:false
          })
          nft:nfts (option: {
            types:[MysteryBox,Drop,Forge,MysteryBoxWR,Airdrop,ExternalLink,OptIn,OptInEmail,PowahDrop,Parent]
            orderBy: CreateTime,
            order: DESC
          }) {
            totalCount
          }
          oat:nfts (option: {
            types:[Oat]
            orderBy: CreateTime,
            order: DESC
          }) {
            totalCount
          }
        }
      }`,
      }),
    });

    const { data } = await response.json();

    return data.addressInfo;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function fetchClaimableCampaigns(
  galxeId: string
): Promise<CampaignDataType[] | null> {
  try {
    const response = await fetch('https://graphigo.prd.galaxy.eco/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query {
        campaigns (input: {
          first:1000,
          claimableByUser: "${galxeId}"
        }) {
          list {
            id
            name
            thumbnail
            space {
              alias
              name
            }
            type
            gasType
          }
        }
      }`,
      }),
    });

    const { data } = await response.json();

    return data.campaigns.list;
  } catch (err) {
    console.error(err);

    return null;
  }
}
