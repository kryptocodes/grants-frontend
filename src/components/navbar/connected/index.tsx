import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
} from '@chakra-ui/react';
import router from 'next/router';
import { getUrlForIPFSHash } from 'src/utils/ipfsUtils';
import useActiveTabIndex from 'src/hooks/utils/useActiveTabIndex';
import {
  useGetNumberOfApplicationsQuery,
  useGetNumberOfGrantsQuery,
  useGetWorkspaceMembersLazyQuery,
} from 'src/generated/graphql';
import { ApiClientsContext } from 'pages/_app';
import { useAccount } from 'wagmi';
import {
  SupportedChainId,
} from 'src/constants/chains';
import { MinimalWorkspace } from 'src/types';
import { getSupportedChainIdFromWorkspace } from 'src/utils/validationUtils';
import Tab from './tab';
import AccountDetails from './accountDetails';

function Navbar({ renderTabs }: { renderTabs: boolean }) {
  const toast = useToast();
  const [{ data: accountData }] = useAccount();
  const tabPaths = [
    'your_grants',
    'funds',
    'settings_and_members',
    'your_applications',
  ];
  const activeIndex = useActiveTabIndex(tabPaths);

  const [workspaces, setWorkspaces] = React.useState<MinimalWorkspace[]>([]);
  const [grantsCount, setGrantsCount] = React.useState(0);
  const [applicationCount, setApplicationCount] = React.useState(0);

  const apiClients = useContext(ApiClientsContext)!;
  const { workspace, setWorkspace, subgraphClients } = apiClients;

  const chainId = getSupportedChainIdFromWorkspace(workspace);
  const [numberApplicationsQueryParams, setNumberApplicationsQueryParams] = useState<any>({
    client: subgraphClients[chainId ?? SupportedChainId.RINKEBY].client,
  });
  const [numberGrantsQueryParams, setNumberGrantsQueryParams] = useState<any>({
    client: subgraphClients[chainId ?? SupportedChainId.RINKEBY].client,
  });

  useEffect(() => {
    if (!workspace) return;
    if (!accountData) return;

    setNumberApplicationsQueryParams({
      client:
        subgraphClients[getSupportedChainIdFromWorkspace(workspace)!].client,
      variables: { applicantId: accountData?.address },
    });
    setNumberGrantsQueryParams({
      client:
        subgraphClients[getSupportedChainIdFromWorkspace(workspace)!].client,
      variables: { creatorId: accountData?.address },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, accountData?.address]);

  // eslint-disable-next-line max-len
  const { data: applicationData, error: applicationError } = useGetNumberOfApplicationsQuery(numberApplicationsQueryParams);
  const { data: grantData, error: grantError } = useGetNumberOfGrantsQuery(numberGrantsQueryParams);

  useEffect(() => {
    // console.log(applicationData);
    // console.log(applicationError);
    if (applicationData) {
      setApplicationCount(applicationData?.grantApplications.length || 0);
    }
    if (grantData) {
      setGrantsCount(grantData?.grants.length || 0);
    }
  }, [applicationData, applicationError, grantData, grantError]);

  const getAllWorkspaces = Object.keys(subgraphClients)!.map(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (key) => useGetWorkspaceMembersLazyQuery({ client: subgraphClients[key].client }),
  );
  // useEffect(() => {}, [subgraphClients]);

  useEffect(() => {
    if (!accountData?.address) return;
    if (!getAllWorkspaces) return;
    // if (!set) return;

    const getWorkspaceData = async (userAddress: string) => {
      try {
        const promises = getAllWorkspaces.map(
          // eslint-disable-next-line no-async-promise-executor
          (allWorkspaces) => new Promise(async (resolve) => {
            // console.log('calling grants');
            const { data } = await allWorkspaces[0]({
              variables: { actorId: userAddress },
            });
            if (data && data.workspaceMembers.length > 0) {
              resolve(data.workspaceMembers.map((w) => w.workspace));
            } else {
              resolve([]);
            }
          }),
        );
        Promise.all(promises).then((values: any[]) => {
          const allWorkspacesData = [].concat(...values) as MinimalWorkspace[];
          // setGrants([...grants, ...allGrantsData]);
          // setCurrentPage(currentPage + 1);
          // console.log('all workspaces', allWorkspacesData);
          setWorkspaces([...workspaces, ...allWorkspacesData]);

          const i = allWorkspacesData.findIndex((w) => w.id === localStorage.getItem('currentWorkspaceId') ?? 'undefined');
          setWorkspace(allWorkspacesData[i === -1 ? 0 : i]);
        });
      } catch (e) {
        // console.log(e);
        toast({
          title: 'Error getting workspace data',
          status: 'error',
        });
      }
    };
    getWorkspaceData(accountData?.address);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container
      zIndex={1}
      variant="header-container"
      maxW="100vw"
      pr={8}
      pl={0}
      alignItems="center"
      minH="80px"
    >
      {workspace ? (
        <Menu>
          <MenuButton
            as={Button}
            m={0}
            h="100%"
            variant="ghost"
            display="flex"
            alignItems="center"
            borderRadius={0}
            background="linear-gradient(263.05deg, #EFF0F0 -7.32%, #FCFCFC 32.62%)"
            px="38px"
          >
            <Flex direction="row" align="center">
              <Image
                objectFit="cover"
                w="32px"
                h="32px"
                mr="10px"
                src={getUrlForIPFSHash(workspace.logoIpfsHash)}
                display="inline-block"
              />
              <Text
                color="#414E50"
                fontWeight="500"
                fontSize="16px"
                lineHeight="24px"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {workspace.title}
              </Text>
              <Image ml={2} src="/ui_icons/dropdown_arrow.svg" alt="options" />
            </Flex>
          </MenuButton>
          <MenuList maxH="80vh" overflow="scroll">
            {workspaces.map((userWorkspace) => (
              <MenuItem
                key={userWorkspace.id}
                icon={(
                  <Image
                    boxSize="20px"
                    src={getUrlForIPFSHash(userWorkspace.logoIpfsHash)}
                  />
                )}
                onClick={() => {
                  setWorkspace(userWorkspace);
                }}
              >
                {userWorkspace.title}
              </MenuItem>
            ))}
            <MenuItem
              icon={<Image src="/ui_icons/gray/see.svg" />}
              onClick={() => {
                router.push('/');
              }}
            >
              Discover Grants
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Image
          onClick={() => {
            router.push({
              pathname: '/',
            });
          }}
          h={9}
          w={8}
          src="/questbook_logo.svg"
          alt="Questbook"
          cursor="pointer"
          ml={8}
        />
      )}

      {renderTabs ? (
        <>
          {workspace?.id || grantsCount ? (
            <>
              <Box mr="12px" />
              <Flex h="100%" direction="column">
                <Tab
                  label="Grants"
                  icon={`/ui_icons/${
                    activeIndex === 0 ? 'brand' : 'gray'
                  }/tab_grants.svg`}
                  isActive={activeIndex === 0}
                  onClick={() => {
                    router.push({
                      pathname: `/${tabPaths[0]}`,
                    });
                  }}
                />
                {activeIndex === 0 ? (
                  <Box w="100%" h="2px" bgColor="#8850EA" />
                ) : null}
              </Flex>
              <Flex h="100%" direction="column">
                <Tab
                  label="Funds"
                  icon={`/ui_icons/${
                    activeIndex === 1 ? 'brand' : 'gray'
                  }/tab_funds.svg`}
                  isActive={activeIndex === 1}
                  onClick={() => {
                    router.push({
                      pathname: `/${tabPaths[1]}`,
                    });
                  }}
                />
                {activeIndex === 1 ? (
                  <Box w="100%" h="2px" bgColor="#8850EA" />
                ) : null}
              </Flex>
              <Flex h="100%" direction="column">
                <Tab
                  label="Settings And Members"
                  icon={`/ui_icons/${
                    activeIndex === 2 ? 'brand' : 'gray'
                  }/tab_settings.svg`}
                  isActive={activeIndex === 2}
                  onClick={() => {
                    router.push({
                      pathname: `/${tabPaths[2]}`,
                    });
                  }}
                />
                {activeIndex === 2 ? (
                  <Box w="100%" h="2px" bgColor="#8850EA" />
                ) : null}
              </Flex>
            </>
          ) : null}

          <Box mr="auto" />

          {(!workspace?.id || applicationCount > 0) && (
            <Flex h="100%" direction="column">
              <Tab
                label="My Applications"
                icon={`/ui_icons/${
                  activeIndex === 3 ? 'brand' : 'gray'
                }/tab_grants.svg`}
                isActive={activeIndex === 3}
                onClick={() => {
                  router.push({
                    pathname: `/${tabPaths[3]}`,
                  });
                }}
              />
              {activeIndex === 3 ? (
                <Box w="100%" h="2px" bgColor="#8850EA" />
              ) : null}
            </Flex>
          )}

          <Box mr="8px" />

          <Button
            onClick={() => {
              if (workspace?.id == null) {
                router.push({
                  pathname: '/signup',
                });
              } else {
                router.push({
                  pathname: '/your_grants/create_grant/',
                });
              }
            }}
            maxW="163px"
            variant="primary"
            mr="12px"
          >
            Create a Grant
          </Button>
        </>
      ) : (
        <Box mr="auto" />
      )}

      <AccountDetails />
    </Container>
  );
}

// Navbar.defaultProps = defaultProps;
export default Navbar;