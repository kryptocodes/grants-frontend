import { ChevronRightIcon } from '@chakra-ui/icons';
import {
  Flex, Grid, GridItem, Box, Text, Switch, Image, Link,
} from '@chakra-ui/react';
import React from 'react';
import Loader from 'src/components/ui/loader';
import useEncryption from 'src/hooks/utils/useEncryption';
import applicantDetailsList from '../../../../constants/applicantDetailsList';
import Badge from '../../../ui/badge';

function ApplicantDetails({
  detailsRequired,
  toggleDetailsRequired,

  // extraField,
  // setExtraField,

  // extraFieldDetails,
  // setExtraFieldDetails,

  // extraFieldError,
  // setExtraFieldError,

  multipleMilestones,
  setMultipleMilestones,

  shouldEncrypt,
  setShouldEncrypt,
  loading,
  setPublicKey,
  hasOwnerPublicKey,
  keySubmitted,
}: {
  detailsRequired: any[];
  toggleDetailsRequired: (index: number) => void;

  // extraField: boolean;
  // setExtraField: (extraField: boolean) => void;

  // extraFieldDetails: string;
  // setExtraFieldDetails: (extraFieldDetails: string) => void;

  // extraFieldError: boolean;
  // setExtraFieldError: (extraFieldError: boolean) => void;

  multipleMilestones: boolean;
  setMultipleMilestones: (multipleMilestones: boolean) => void;

  shouldEncrypt: boolean;
  setShouldEncrypt: (shouldEncrypt: boolean) => void;
  loading: boolean;
  setPublicKey: (publicKey: any) => void;
  hasOwnerPublicKey: boolean;
  keySubmitted: boolean;
}) {
  const [milestoneSelectOptionIsVisible, setMilestoneSelectOptionIsVisible] = React.useState(false);
  const { getPublicEncryptionKey } = useEncryption();

  return (
    <Flex py={0} direction="column">
      <Grid
        templateColumns="repeat(2, 1fr)"
        gap="18px"
        fontWeight="bold"
      >
        {detailsRequired.map((detail, index) => {
          const {
            title, required, tooltip, id,
          } = detail as any;
          if (id === 'isMultipleMilestones') {
            return (
              <GridItem key={id} colSpan={1}>
                <Badge
                  isActive={milestoneSelectOptionIsVisible}
                  onClick={() => {
                    setMilestoneSelectOptionIsVisible(
                      !milestoneSelectOptionIsVisible,
                    );
                    setMultipleMilestones(false);
                  }}
                  label="Milestones"
                  tooltip="Add milestones for the applicant to complete"
                />
              </GridItem>
            );
          }
          return (
            <GridItem key={id} colSpan={1}>
              <Badge
                isActive={applicantDetailsList[index].isRequired || required}
                onClick={() => {
                  if (!applicantDetailsList[index].isRequired) {
                    toggleDetailsRequired(index);
                  }
                }}
                label={title}
                tooltip={tooltip}
              />
            </GridItem>
          );
        })}
      </Grid>

      <Box mt={6} />

      {/* {extraField ? (
        <>
          <SingleLineInput
            label="Field Name"
            placeholder="Sample Field"
            isError={extraFieldError}
            errorText="Required"
            value={extraFieldDetails}
            onChange={(e) => {
              setExtraFieldError(false);
              setExtraFieldDetails(e.target.value);
            }}
            subtext="Letters and spaces are allowed."
          />
          <Box mt={8} />
        </>
      ) : null} */}

      {milestoneSelectOptionIsVisible && (
        <>
          <Flex flex={1} direction="column">
            <Text lineHeight="20px" fontWeight="bold">
              Milestones
            </Text>
          </Flex>
          <Flex mt={1} maxW="420px">
            <Badge
              isActive={!multipleMilestones}
              onClick={() => setMultipleMilestones(false)}
              label="Single Milestone"
              inActiveVariant="solid"
              variant="buttonGroupStart"
            />
            <Badge
              isActive={multipleMilestones}
              onClick={() => setMultipleMilestones(true)}
              label="Multiple Milestones"
              inActiveVariant="solid"
              variant="buttonGroupEnd"
            />
          </Flex>
        </>
      )}
      <Flex mt={8} gap="2" justifyContent="space-between">
        <Flex direction="column">
          <Text color="#122224" fontWeight="bold" fontSize="16px" lineHeight="20px">
            Hide applicant personal data (email, and about team)
          </Text>
          <Flex>
            <Text color="#717A7C" fontSize="14px" lineHeight="20px">
              {shouldEncrypt ? 'The applicant data will be visible only to DAO members.' : 'The applicant data will be visible to everyone with the link.'}
              {/* <Tooltip
                icon="/ui_icons/tooltip_questionmark.svg"
                label="Public key linked to your wallet will allow you to see the hidden data."
                placement="bottom-start"
              /> */}
            </Text>
          </Flex>
        </Flex>
        <Flex justifyContent="center" gap={2} alignItems="center">
          <Switch
            id="encrypt"
            onChange={
              (e) => {
                setShouldEncrypt(e.target.checked);
              }
             }
          />
          <Text
            fontSize="12px"
            fontWeight="bold"
            lineHeight="16px"
          >
            {`${shouldEncrypt ? 'YES' : 'NO'}`}

          </Text>
        </Flex>
      </Flex>
      {shouldEncrypt && !hasOwnerPublicKey && !keySubmitted && (
      <Flex mt={8} gap="2" direction="column">
        <Flex
          gap="2"
          cursor="pointer"
          onClick={async () => setPublicKey({ publicKey: (await getPublicEncryptionKey()) || '' })}
        >
          <Text
            color="brand.500"
            fontWeight="bold"
            fontSize="16px"
            lineHeight="24px"
          >
            Allow access to your public key and encrypt the applicant form to proceed
          </Text>
          <ChevronRightIcon color="brand.500" fontSize="2xl" />
          {loading
              && <Loader />}
        </Flex>
        <Flex alignItems="center" gap={2}>
          <Image mt={1} src="/ui_icons/info.svg" />
          <Text color="#122224" fontWeight="medium" fontSize="14px" lineHeight="20px">
            By doing the above you’ll have to approve this transaction in your wallet.
          </Text>
        </Flex>
        <Link href="https://www.notion.so/questbook/Why-is-public-key-required-e3fa53f34a5240d185d3d34744bb33f4" isExternal>
          <Text color="#122224" fontWeight="normal" fontSize="14px" lineHeight="20px" decoration="underline">

            Why is this required?
          </Text>
        </Link>
      </Flex>
      )}
    </Flex>

  );
}

export default ApplicantDetails;
