import {
  ModalBody,
  Flex,
  Text,
  Button,
  Box,
  Image,
  useToast,
  ToastId,
  Center,
  CircularProgress,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import InfoToast from 'src/components/ui/infoToast';
import { ApplicationMilestone } from 'src/types';
import useRequestMilestoneApproval from 'src/hooks/useRequestMilestoneApproval';
import { SupportedChainId } from 'src/constants/chains';
import { getMilestoneMetadata } from '../../../../utils/formattingUtils';
import MultiLineInput from '../../../ui/forms/multiLineInput';

interface Props {
  chainId: SupportedChainId | undefined;
  milestone: ApplicationMilestone | undefined;
  onClose: () => void;
}

function ModalContent({ milestone, onClose, chainId }: Props) {
  const [details, setDetails] = useState('');
  const [detailsError, setDetailsError] = useState(false);

  const toastRef = React.useRef<ToastId>();
  const toast = useToast();

  const { milestoneIndex, applicationId } = getMilestoneMetadata(milestone)!;
  const [milestoneUpdate, setMilestoneUpdate] = useState<any>();
  const [txn, loading] = useRequestMilestoneApproval(
    milestoneUpdate,
    chainId,
    applicationId,
    milestoneIndex,
  );

  useEffect(() => {
    if (txn) {
      setMilestoneUpdate(undefined);
      onClose();
      toastRef.current = toast({
        position: 'top',
        render: () => (
          <InfoToast
            link={`https://etherscan.io/tx/${txn.transactionHash}`}
            close={() => {
              if (toastRef.current) {
                toast.close(toastRef.current);
              }
            }}
          />
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, txn]);

  const markAsDone = async () => {
    if (!details) {
      setDetailsError(true);
      return;
    }
    setMilestoneUpdate({ text: details });
  };

  return (
    <ModalBody maxW="521px">
      <Flex direction="column" justify="start" align="center">
        <Image src="/ui_icons/milestone_complete.svg" mt={6} />
        <Text textAlign="center" variant="applicationText" mt={6}>
          Add a brief summary of what was achieved in the milestone, timelines
          and links to show your proof of work.
        </Text>
        <Text mt={8} textAlign="center" variant="applicationText">
          The grantor can see your summary.
        </Text>
        <Flex mt={6} w="100%">
          <MultiLineInput
            label="Milestone Summary"
            placeholder="Write the milestone summary as detailed as possible."
            value={details}
            isError={detailsError}
            onChange={(e) => {
              if (detailsError) {
                setDetailsError(false);
              }
              setDetails(e.target.value);
            }}
            errorText="Required"
            maxLength={300}
          />
        </Flex>
        <Flex direction="row" w="100%" align="start" mt={2}>
          <Image mt={1} src="/ui_icons/info.svg" />
          <Box mr={2} />
          <Text variant="footer">
            By pressing Mark as done you’ll have to approve this transaction in
            your wallet.
            {' '}
            <Button
              variant="link"
              color="brand.500"
              rightIcon={
                <Image ml={1} src="/ui_icons/link.svg" display="inline-block" />
              }
            >
              <Text variant="footer" color="brand.500">
                Learn More
              </Text>
            </Button>
          </Text>
        </Flex>
        {loading ? (
          <Center>
            <CircularProgress
              isIndeterminate
              color="brand.500"
              size="48px"
              mt={10}
            />
          </Center>
        ) : (
          <Button w="100%" variant="primary" mt={8} onClick={markAsDone}>
            Mark as Done
          </Button>
        )}
        <Box mb={4} />
      </Flex>
    </ModalBody>
  );
}

export default ModalContent;