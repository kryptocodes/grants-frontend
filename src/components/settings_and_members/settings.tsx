import {
  Flex, Text, Box, useToast, ToastId,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Workspace } from 'src/types';
import useUpdateWorkspace from 'src/hooks/useUpdateWorkspace';
import EditForm from './edit_form';
import { getUrlForIPFSHash, uploadToIPFS } from '../../utils/ipfsUtils';
import InfoToast from '../ui/infoToast';

interface Props {
  workspaceData: Workspace;
}

function Settings({
  workspaceData,
}: Props) {
  // const [, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<{
    name: string;
    about: string;
    supportedNetwork: string;
    image?: string;
    coverImage?: string;
    twitterHandle?: string;
    discordHandle?: string;
    telegramChannel?: string;
  } | null>();

  const toastRef = React.useRef<ToastId>();
  const toast = useToast();

  const [editData, setEditData] = useState<any>();
  const [txnData, loading] = useUpdateWorkspace(editData);

  useEffect(() => {
    if (txnData) {
      toastRef.current = toast({
        position: 'top',
        render: () => (
          <InfoToast
            link={`https://etherscan.io/tx/${txnData.transactionHash}`}
            close={() => {
              if (toastRef.current) {
                toast.close(toastRef.current);
              }
            }}
          />
        ),
      });
    }
  }, [toast, txnData]);

  const handleFormSubmit = async (data: any) => {
    let imageHash = workspaceData.logoIpfsHash;
    let coverImageHash = workspaceData.coverImageIpfsHash;
    const socials = [];

    if (data.image) {
      imageHash = (await uploadToIPFS(data.image)).hash;
    }
    if (data.coverImage) {
      coverImageHash = (await uploadToIPFS(data.coverImage)).hash;
    }

    if (data.twitterHandle) {
      socials.push({ name: 'twitter', value: data.twitterHandle });
    }
    if (data.discordHandle) {
      socials.push({ name: 'discord', value: data.discordHandle });
    }
    if (data.telegramChannel) {
      socials.push({ name: 'telegram', value: data.telegramChannel });
    }

    let d = {};
    if (coverImageHash) {
      d = {
        title: data.name,
        about: data.about,
        logoIpfsHash: imageHash,
        coverImageIpfsHash: coverImageHash,
        socials,
      };
    } else {
      d = {
        title: data.name,
        about: data.about,
        logoIpfsHash: imageHash,
        socials,
      };
    }

    setEditData(d);
  };

  useEffect(() => {
    if (!workspaceData) return;
    if (Object.keys(workspaceData).length === 0) return;
    const twitterSocial = workspaceData.socials.filter((socials: any) => socials.name === 'twitter');
    const twitterHandle = twitterSocial.length > 0 ? twitterSocial[0].value : undefined;
    const discordSocial = workspaceData.socials.filter((socials: any) => socials.name === 'discord');
    const discordHandle = discordSocial.length > 0 ? discordSocial[0].value : undefined;
    const telegramSocial = workspaceData.socials.filter((socials: any) => socials.name === 'telegram');
    const telegramChannel = telegramSocial.length > 0 ? telegramSocial[0].value : undefined;
    // console.log('loaded', workspaceData);
    // console.log(getUrlForIPFSHash(workspaceData?.logoIpfsHash));
    setFormData({
      name: workspaceData.title,
      about: workspaceData.about,
      image: getUrlForIPFSHash(workspaceData?.logoIpfsHash),
      supportedNetwork: workspaceData.supportedNetworks[0],
      coverImage: getUrlForIPFSHash(workspaceData.coverImageIpfsHash || ''),
      twitterHandle,
      discordHandle,
      telegramChannel,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceData]);

  return (
    <Flex direction="column" align="start" w="85%">
      <Flex direction="row" w="full" justify="space-between">
        <Text
          fontStyle="normal"
          fontWeight="bold"
          fontSize="18px"
          lineHeight="26px"
        >
          Workspace Settings
        </Text>
      </Flex>
      <EditForm hasClicked={loading} onSubmit={handleFormSubmit} formData={formData} />
      <Box my={10} />
    </Flex>
  );
}

export default Settings;