import React from 'react';
import {
  Image, Text, Button, Flex, Box, Divider, Link,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { SupportedChainId } from 'src/constants/chains';
import { CHAIN_INFO } from 'src/constants/chainInfo';
import Badge from './badge';

interface BrowseGrantCardProps {
  daoID: string;
  daoIcon: string;
  daoName: string;
  isDaoVerified?: boolean;
  chainId: SupportedChainId | undefined;

  grantTitle: string;
  grantDesc: string;
  isGrantVerified?: boolean;

  numOfApplicants: number;
  endTimestamp: number;

  grantAmount: string;
  grantCurrency: string;
  grantCurrencyIcon: string;

  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

function BrowseGrantCard({
  daoID,
  daoIcon,
  daoName,
  isDaoVerified,
  chainId,

  grantTitle,
  grantDesc,
  isGrantVerified,

  numOfApplicants,
  endTimestamp,

  grantAmount,
  grantCurrency,
  grantCurrencyIcon,

  onClick,
}: BrowseGrantCardProps) {
  const router = useRouter();

  return (
    <>
      <Flex py={6} w="100%">
        <Image objectFit="cover" h="54px" w="54px" src={daoIcon} />
        <Flex flex={1} direction="column" ml={6}>
          <Flex direction="row" alignItems="center" flexWrap="wrap">
            <Text lineHeight="24px" fontSize="18px" fontWeight="700">
              {grantTitle}
              {isGrantVerified && (
                <Image
                  h={4}
                  w={4}
                  display="inline-block"
                  src="/ui_icons/verified.svg"
                  ml="2px"
                  mb="-2px"
                />
              )}
            </Text>
            <Box mr="auto" />
            <Badge
              numOfApplicants={numOfApplicants}
              endTimestamp={endTimestamp}
            />
          </Flex>

          <Flex direction="row">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <Link
              onClick={() => {
                router.push({
                  pathname: '/profile',
                  query: {
                    daoId: daoID,
                    chainId,
                  },
                });
              }}
              lineHeight="24px"
              fontWeight="700"
            >
              {daoName}
              {isDaoVerified && (
              <Image
                h={4}
                w={4}
                display="inline-block"
                src="/ui_icons/verified.svg"
                ml="2px"
                mb="-2px"
              />
              )}
            </Link>
            <Text fontSize="16px" display="inline" color="#717A7C" fontWeight="400" lineHeight="24px" ml={2}>

              {`• ${CHAIN_INFO[chainId!]?.name}`}
            </Text>
          </Flex>

          <Text mt={5} lineHeight="24px" color="#122224" fontWeight="400">
            {grantDesc}
          </Text>

          <Flex direction="row" mt={8} alignItems="center">
            <Image src={grantCurrencyIcon} />
            <Text ml={2} fontWeight="700" color="#3F06A0">
              {grantAmount}
              {' '}
              {grantCurrency}
            </Text>
            <Box mr="auto" />
            <Button onClick={onClick} variant="primaryCta">
              Apply Now
            </Button>
          </Flex>
        </Flex>
      </Flex>
      <Divider w="auto" />
    </>
  );
}

BrowseGrantCard.defaultProps = {
  isGrantVerified: false,
  isDaoVerified: false,
  onClick: () => {},
};
export default BrowseGrantCard;
