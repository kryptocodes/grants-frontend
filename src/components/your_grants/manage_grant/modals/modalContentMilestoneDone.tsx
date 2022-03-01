import {
  ModalBody, Flex, Text, Button, Box, Image, useToast, Center, CircularProgress, ToastId,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { getFormattedDateFromUnixTimestampWithYear, getMilestoneMetadata } from 'src/utils/formattingUtils';
import InfoToast from 'src/components/ui/infoToast';
import { ApplicationMilestone } from 'src/types';
import useApproveMilestone from 'src/hooks/useApproveMilestone';
import MultiLineInput from '../../../ui/forms/multiLineInput';

interface Props {
  milestone: ApplicationMilestone | undefined
  done: () => void
}

function ModalContent({ milestone, done }: Props) {
  const [details, setDetails] = useState('');
  const [detailsError, setDetailsError] = useState(false);

  const toastRef = React.useRef<ToastId>();
  const toast = useToast();

  const { milestoneIndex, applicationId } = getMilestoneMetadata(milestone)!;
  const [milestoneUpdate, setMilestoneUpdate] = useState<any>();
  const [txn, loading] = useApproveMilestone(milestoneUpdate, applicationId, milestoneIndex);

  useEffect(() => {
    if (txn) {
      setMilestoneUpdate(undefined);
      done();
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
  }, [done, toast, txn]);

  const markAsDone = async () => {
    setMilestoneUpdate({ text: details });
  };

  return (
    <ModalBody maxW="521px">
      <Flex direction="column" justify="start" align="center">
        <Image src="/ui_icons/milestone_complete.svg" mt={6} />
        <Text textAlign="center" variant="applicationText" mt={6}>
          Add a brief summary of what was achieved in the milestone,
          and add a proof of work.
        </Text>
        <Text mt={8} textAlign="center" variant="applicationText">
          The grantee can see your summary.
        </Text>
        {
          milestone?.state === 'requested' && (
            <>
              <Text
                mt={5}
                variant="applicationText"
                textAlign="center"
                fontWeight="700"
              >
                Grantee marked it as done on
                {' '}
                {getFormattedDateFromUnixTimestampWithYear(milestone!.updatedAtS || 0)}
              </Text>
              <Text
                mt={8}
                variant="applicationText"
                fontWeight="700"
              >
                Milestone Summary by Grantee
              </Text>
              <Text variant="applicationText" mt={4}>{milestone.text || 'N/A'}</Text>
            </>
          )
        }

        <Flex mt={6} w="100%">
          <MultiLineInput
            label="Feedback and Comments"
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
            <CircularProgress isIndeterminate color="brand.500" size="48px" mt={4} />
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