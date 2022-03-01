import {
  Heading, Flex, Text, Image, Box, Button,
} from '@chakra-ui/react';
import { ApiClientsContext } from 'pages/_app';
import React, { useContext } from 'react';
import { getSupportedChainIdFromWorkspace } from 'src/utils/validationUtils';
import { formatAmount, getFormattedFullDateFromUnixTimestamp, truncateStringFromMiddle } from '../../../utils/formattingUtils';
import { getAssetInfo } from '../../../utils/tokenUtils';
import FloatingSidebar from '../../ui/sidebar/floatingSidebar';

function Sidebar({
  onAcceptApplicationClick,
  onRejectApplicationClick,
  onResubmitApplicationClick,
  applicationData,
}: {
  onAcceptApplicationClick: () => void;
  onRejectApplicationClick: () => void;
  onResubmitApplicationClick: () => void;
  applicationData: any;
}) {
  const { workspace } = useContext(ApiClientsContext)!;
  const chainId = getSupportedChainIdFromWorkspace(workspace);
  return (
    <FloatingSidebar>
      <Heading
        fontSize="16px"
        fontWeight="400"
        color="#414E50"
        lineHeight="26px"
        fontStyle="normal"
      >
        Application Details
      </Heading>
      <Flex direction="row" justify="start" w="full" mt={6} align="center">
        <Image h="45px" w="45px" src={getAssetInfo(applicationData?.grant?.reward?.asset, chainId)?.icon} />
        <Box mx={3} />
        <Heading variant="applicationHeading" color="brand.500">
          {truncateStringFromMiddle(applicationData?.applicantId)}
        </Heading>
      </Flex>
      <Box my={4} />
      <Flex direction="row" justify="space-between" w="full" align="center">
        <Text variant="applicationText" lineHeight="32px">
          Name
        </Text>
        <Heading variant="applicationHeading" lineHeight="32px">
          {applicationData?.fields?.find((fld:any) => fld?.id?.split('.')[1] === 'applicantName')?.value[0]}
        </Heading>
      </Flex>
      <Flex direction="row" justify="space-between" w="full" align="center">
        <Text variant="applicationText" lineHeight="32px">
          Email
        </Text>
        <Heading variant="applicationHeading" lineHeight="32px">
          {applicationData?.fields?.find((fld:any) => fld?.id?.split('.')[1] === 'applicantEmail')?.value[0]}
        </Heading>
      </Flex>
      <Flex direction="row" justify="space-between" w="full" align="center">
        <Text variant="applicationText" lineHeight="32px">
          Sent On
        </Text>
        <Heading variant="applicationHeading" lineHeight="32px">
          {getFormattedFullDateFromUnixTimestamp(applicationData?.createdAtS)}
        </Heading>
      </Flex>
      <Flex direction="column" w="full" align="start" mt={4}>
        <Box
            // variant="dashed"
          border="1px dashed #A0A7A7"
          h={0}
          w="100%"
          m={0}
        />
        <Text fontSize="10px" mt={6} lineHeight="12px">
          FUNDING REQUESTED
        </Text>
        <Text
          fontSize="20px"
          lineHeight="40px"
          fontWeight="500"
          fontStyle="normal"
          color="#122224"
        >
          {formatAmount(applicationData?.fields?.find((fld:any) => fld?.id?.split('.')[1] === 'fundingAsk')?.value[0] ?? '0')}
          {' '}
          { getAssetInfo(applicationData?.grant?.reward?.asset, chainId)?.label }
        </Text>
        <Box
            // variant="dashed"
          border="1px dashed #A0A7A7"
          h={0}
          w="100%"
          mt="17px"
          mb={0}
        />
      </Flex>
      <Button
        onClick={() => onAcceptApplicationClick()}
        variant="primary"
        mt={7}
        display={applicationData?.state === 'submitted' ? '' : 'none'}
      >
        Approve Application
      </Button>
      <Button
        onClick={() => onAcceptApplicationClick()}
        variant="primary"
        mt={7}
        disabled={applicationData?.state === 'resubmit'}
        display={applicationData?.state === 'resubmit' ? '' : 'none'}
      >
        Accept Application
      </Button>
      <Text
        mt={7}
        fontSize="sm"
        lineHeight="4"
        align="center"
        color="#717A7C"
        display={applicationData?.state === 'resubmit' ? '' : 'none'}
      >
        This application has been asked for resubmission.
        The applicant has been notified to resubmit.

      </Text>
      <Button
        onClick={() => onResubmitApplicationClick()}
        variant="resubmit"
        mt={4}
        display={applicationData?.state === 'submitted' ? '' : 'none'}
      >
        Ask to Resubmit
      </Button>
      <Button
        onClick={() => onRejectApplicationClick()}
        variant="reject"
        mt={4}
        display={applicationData?.state === 'submitted' ? '' : 'none'}
      >
        Reject Application
      </Button>
    </FloatingSidebar>
  );
}

export default Sidebar;