import {
  Button,
  Flex, Image, Link, ModalBody, Text,
} from '@chakra-ui/react';
import React from 'react';
import Modal from './modal';

interface Props {
  hiddenModalOpen: boolean;
  setHiddenModalOpen: (hiddenModalOpen: boolean) => void;
}

function AllowAccessToPublicKeyModal({
  hiddenModalOpen,
  setHiddenModalOpen,
}: Props) {
  return (
    <Modal
      isOpen={hiddenModalOpen}
      onClose={() => setHiddenModalOpen(false)}
      title=""
      modalWidth={719}
    >
      <ModalBody px={10}>
        <Flex direction="column" align="center">
          <Text
            variant="heading"
            fontFamily="Spartan"
            letterSpacing={-1}
            textAlign="center"
          >
            gm! 👋 Welcome to Questbook
          </Text>

          <Text mt={4} variant="applicationText">
            You’ve been invited to be a reviewer for Polygon DAO
          </Text>

          <Text mt={9} variant="applicationText" fontWeight="700">
            Here’s what you can do next
          </Text>

          <Flex direction="column" align="flex-start" mt={5}>
            {[
              'Review grant applicants assigned to you.',
              'Receive payouts for reviews.',
            ].map((item, index) => (
              <Flex justify="start" direction="row" mt={index === 0 ? 0 : 6}>
                <Image
                  h="28px"
                  w="28px"
                  src={`/ui_icons/reviewers_modal_icon_${index + 1}.svg`}
                />
                <Text ml={4} variant="applicationText">
                  {item}
                </Text>
              </Flex>
            ))}
          </Flex>

          <Text mt={9} variant="applicantText" textAlign="center">
            To get started, you can share your public key which allows you to
            view the personal information such as email, and about team shared
            by applicants. This data is encrypted, and is only visible to you if
            you share your public key.
            {' '}
            <Link
              mx={1}
              href="/"
              isExternal
              color="brand.500"
              fontWeight="400"
              fontSize="14px"
            >
              Learn more
              <Image
                ml={1}
                display="inline-block"
                h="10px"
                w="10px"
                src="/ui_icons/link.svg"
              />
            </Link>
          </Text>

          <Button my={10} variant="primary">Allow access to public key</Button>
        </Flex>
      </ModalBody>
    </Modal>
  );
}

export default AllowAccessToPublicKeyModal;
