import {
  Container, Text, ToastId, useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { ReactElement, useEffect } from 'react';
import useCreateWorkspace from 'src/hooks/useCreateWorkspace';
import useCreateGrant from 'src/hooks/useCreateGrant';
import InfoToast from '../src/components/ui/infoToast';
import Form from '../src/components/signup/create_dao/form';
import Loading from '../src/components/signup/create_dao/loading';
import CreateGrant from '../src/components/signup/create_grant';
import DaoCreated from '../src/components/signup/daoCreated';
import NavbarLayout from '../src/layout/navbarLayout';

function SignupDao() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [daoCreated, setDaoCreated] = React.useState(false);
  const [creatingGrant, setCreatingGrant] = React.useState(false);

  const [daoData, setDaoData] = React.useState<{
    name: string;
    description: string;
    image: string;
    network: string;
    id: string;
  } | null>(null);

  const toastRef = React.useRef<ToastId>();
  const toast = useToast();

  const [workspaceData, setWorkspaceData] = React.useState<any>();
  const [workspaceTransactionData, imageHash, workspaceLoading] = useCreateWorkspace(workspaceData);

  useEffect(() => {
    if (
      workspaceData
      && workspaceTransactionData
      && workspaceTransactionData.events.length > 0
      && workspaceTransactionData.events[0].event === 'WorkspaceCreated'
      && imageHash
    ) {
      const newId = workspaceTransactionData.events[0].args.id;
      setDaoData({
        ...workspaceData,
        image: imageHash,
        id: Number(newId).toString(),
      });
      setLoading(false);
      setDaoCreated(true);
    }
  }, [workspaceTransactionData, imageHash, workspaceData, router]);

  const [grantData, setGrantData] = React.useState<any>();
  const [grantTransactionData, createGrantLoading] = useCreateGrant(
    grantData,
    grantData?.network,
  );

  useEffect(() => {
    // console.log(grantTransactionData);
    if (grantTransactionData) {
      router.replace({ pathname: '/your_grants', query: { done: 'yes' } });

      const link = `https://etherscan.io/tx/${grantTransactionData.transactionHash}`;
      toastRef.current = toast({
        position: 'top',
        render: () => (
          <InfoToast
            link={link}
            close={() => {
              if (toastRef.current) {
                toast.close(toastRef.current);
              }
            }}
          />
        ),
      });
    }
  }, [toast, grantTransactionData, router]);

  if (creatingGrant) {
    return (
      <CreateGrant
        hasClicked={createGrantLoading}
        onSubmit={(data) => setGrantData(data)}
      />
    );
  }

  if (daoCreated && daoData) {
    return (
      <DaoCreated
        daoName={daoData.name}
        network={daoData.network}
        onCreateGrantClick={() => setCreatingGrant(true)}
        onVisitGrantsClick={() => router.push('/your_grants')}
      />
    );
  }

  if (workspaceLoading) {
    return <Loading />;
  }
  return (
    <Container
      maxW="100%"
      display="flex"
      px="70px"
      flexDirection="column"
      alignItems="center"
    >
      <Text mt="46px" variant="heading">
        What should we call your Grants DAO?
      </Text>
      <Text mt={7} maxW="676px" textAlign="center">
        A Grants DAO is a neatly arranged space where you can manage grants,
        review grant applications and fund grants.
      </Text>
      <Form
        hasClicked={workspaceLoading}
        onSubmit={(data) => {
          setLoading(true);
          setWorkspaceData(data);
        }}
      />
    </Container>
  );
}

SignupDao.getLayout = function getLayout(page: ReactElement) {
  return <NavbarLayout renderTabs={false}>{page}</NavbarLayout>;
};

export default SignupDao;
