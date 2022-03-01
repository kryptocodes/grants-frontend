import { ApiClientsContext } from 'pages/_app';
import { useContext } from 'react';
import { SupportedChainId } from 'src/constants/chains';
import { useGetApplicationMilestonesQuery } from 'src/generated/graphql';
import { getSupportedChainIdFromWorkspace } from './validationUtils';

const useApplicationMilestones = (grantId: string, chainId?: SupportedChainId) => {
  const { subgraphClients, workspace } = useContext(ApiClientsContext)!;
  const fullData = useGetApplicationMilestonesQuery({
    client:
      subgraphClients[
        (chainId ?? getSupportedChainIdFromWorkspace(workspace)) ?? SupportedChainId.RINKEBY
      ].client,
    variables: {
      grantId,
    },
  });

  const grantApp = fullData?.data?.grantApplications[0];

  const fundingAsk = grantApp?.fields?.find((item: any) => item.id.endsWith('.fundingAsk.field'))?.value?.[0];
  const rewardAsset = grantApp?.grant?.reward?.asset ?? '';
  const milestones = grantApp?.milestones || [];

  return {
    ...fullData,
    data: { rewardAsset, milestones, fundingAsk },
  };
};

export default useApplicationMilestones;