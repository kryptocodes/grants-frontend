import React, { useEffect, useRef, useState } from 'react'
import {
	Box,
	Button,
	Divider,
	Flex,
	Image,
	Text,
} from '@chakra-ui/react'
import Modal from 'src/components/ui/modal'
import Badge from 'src/components/your_grants/yourGrantCard/badge'
import ChangeAccessibilityModalContent from 'src/components/your_grants/yourGrantCard/changeAccessibilityModalContent'
import YourGrantMenu from 'src/components/your_grants/yourGrantCard/menu'
import { SupportedChainId } from 'src/constants/chains'
import { Rubric } from 'src/generated/graphql'
import useArchiveGrant from 'src/hooks/useArchiveGrant'
import useCustomToast from 'src/hooks/utils/useCustomToast'

interface YourGrantCardProps {
  grantID: string
  daoIcon: string
  grantTitle: string
  grantDesc: string
  numOfApplicants: number
  endTimestamp: number
  grantAmount: string
  grantCurrency: string
  grantCurrencyIcon: string
  state: 'processing' | 'done'
  onEditClick?: () => void
  onViewApplicantsClick?: () => void
  acceptingApplications: boolean
  chainId: SupportedChainId | undefined
  isAdmin: boolean
  initialRubrics: Rubric
  workspaceId: string
}

function YourGrantCard({
	grantID,
	daoIcon,
	grantTitle,
	grantDesc,
	numOfApplicants,
	endTimestamp,
	grantAmount,
	grantCurrency,
	grantCurrencyIcon,
	state,
	onEditClick,
	onViewApplicantsClick,
	chainId,
	acceptingApplications,
	isAdmin,
}: YourGrantCardProps) {
	const [isAcceptingApplications, setIsAcceptingApplications] = useState<
  [boolean, number]
  >([acceptingApplications, 0])

	const [transactionData, txnLink, loading, isBiconomyInitialised, error] = useArchiveGrant(
		isAcceptingApplications[0],
		isAcceptingApplications[1],
		grantID,
	)

	const { setRefresh } = useCustomToast(txnLink)
	const buttonRef = useRef<HTMLButtonElement>(null)

	const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
	const [isPublishGrantModalOpen, setIsPublishGrantModalOpen] = useState(false)

	useEffect(() => {
		// // console.log(transactionData);
		if(transactionData) {
			setIsArchiveModalOpen(false)
			setIsPublishGrantModalOpen(false)
			setRefresh(true)
		}

	}, [transactionData])

	useEffect(() => {
		setIsAcceptingApplications([acceptingApplications, 0])
	}, [error])

	return (
		<>
			{
				isAdmin ? (
					<Flex
						py={6}
						w='100%'>
						<Image
							objectFit='cover'
							h='54px'
							w='54px'
							src={daoIcon} />
						<Flex
							flex={1}
							direction='column'
							ml={6}>
							<Flex direction='row'>
								<Flex direction='column'>
									<Text
										lineHeight='24px'
										fontSize='18px'
										fontWeight='700'>
										{grantTitle}
									</Text>
									<Text
										lineHeight='24px'
										color='#122224'
										fontWeight='400'>
										{grantDesc}
									</Text>
								</Flex>
								<Box mr='auto' />
							</Flex>

							<Box mt={6} />

							<Badge
								numOfApplicants={numOfApplicants}
								endTimestamp={endTimestamp}
							/>

							<Flex
								direction={{ base: 'column', md: 'row' }}
								mt={8}
								alignItems='center'
							>
								<Flex
									direction='row'
									align='center'
									w='full'>
									<Image
										src={grantCurrencyIcon}
										alt='token icon'
										fallbackSrc='/images/dummy/Ethereum Icon.svg'
										boxSize='36px' />
									<Text
										ml={2}
										fontWeight='700'
										color='#3F06A0'>
										{grantAmount}
										{' '}
										{grantCurrency}
									</Text>

									<Box mr='auto' />

									<YourGrantMenu
										chainId={chainId}
										grantID={grantID}
										onArchiveGrantClick={
											() => {
												setIsArchiveModalOpen(true)
											}
										}
										isArchived={!acceptingApplications}
										numOfApplicants={numOfApplicants}
										onViewApplicantsClick={onViewApplicantsClick}
										onEditClick={onEditClick}
										isAdmin={isAdmin}
									/>

									<Box mr='1' />

									{
										acceptingApplications && (
											<Button
												ml={2}
												isDisabled={state === 'processing'}
												variant='primaryCta'
												onClick={
													() => {
														if(numOfApplicants <= 0 && onEditClick) {
															onEditClick()
														} else if(onViewApplicantsClick) {
															onViewApplicantsClick()
														}
													}
												}
												display={isAdmin || numOfApplicants > 0 ? undefined : 'none'}
											>
												{numOfApplicants > 0 ? 'View Proposals' : 'Edit grant'}
											</Button>
										)
									}
									{
										!acceptingApplications && isAdmin && (
											<Button
												ml={5}
												isDisabled={state === 'processing'}
												variant='primaryCta'
												onClick={
													() => {
														setIsPublishGrantModalOpen(true)
													}
												}
												ref={buttonRef}
												w={loading ? buttonRef.current?.offsetWidth : 'auto'}
											>
												Publish grant
											</Button>
										)
									}
								</Flex>
							</Flex>
						</Flex>
					</Flex>
				) : (

					<Flex
						py={6}
						w='100%'>
						<Image
							objectFit='cover'
							h='54px'
							w='54px'
							src={daoIcon} />
						<Flex
							flex={1}
							direction='column'
							ml={6}>
							<Flex direction='row'>
								<Flex direction='column'>
									<Text
										lineHeight='24px'
										fontSize='18px'
										fontWeight='700'>
										{grantTitle}
									</Text>
									<Text
										lineHeight='24px'
										color='#122224'
										fontWeight='400'>
										{grantDesc}
									</Text>
								</Flex>
								<Box mr='auto' />
							</Flex>

							<Box mt={6} />

							<Badge
								numOfApplicants={numOfApplicants}
								endTimestamp={endTimestamp}
							/>

							<Flex
								direction={{ base: 'column', md: 'row' }}
								mt={8}
								alignItems='center'
							>
								<Flex
									direction='row'
									align='center'
									w='full'>
									<Image
										src={grantCurrencyIcon}
										boxSize='36px' />
									<Text
										ml={2}
										fontWeight='700'
										color='#3F06A0'>
										{grantAmount}
										{' '}
										{grantCurrency}
									</Text>

									<Box mr='auto' />

									<YourGrantMenu
										chainId={chainId}
										grantID={grantID}
										onArchiveGrantClick={
											() => {
												setIsArchiveModalOpen(true)
											}
										}
										isArchived={!acceptingApplications}
										numOfApplicants={numOfApplicants}
										onViewApplicantsClick={onViewApplicantsClick}
										onEditClick={onEditClick}
										isAdmin={isAdmin}
									/>
									{
										acceptingApplications && (
											<Button
												ml={2}
												isDisabled={state === 'processing'}
												variant='primaryCta'
												onClick={
													() => {
														if(numOfApplicants <= 0 && onEditClick) {
															onEditClick()
														} else if(onViewApplicantsClick) {
															onViewApplicantsClick()
														}
													}
												}
												display={isAdmin || numOfApplicants > 0 ? undefined : 'none'}
											>
												{numOfApplicants > 0 ? 'View proposals' : 'Edit grant'}
											</Button>
										)
									}

								</Flex>
							</Flex>
						</Flex>
					</Flex>
				)
			}
			<Divider w='auto' />
			<Modal
				isOpen={acceptingApplications ? isArchiveModalOpen : isPublishGrantModalOpen}
				onClose={
					() => (acceptingApplications
						? setIsArchiveModalOpen(false)
						: setIsPublishGrantModalOpen(false))
				}
				title=''
			>
				<ChangeAccessibilityModalContent
					onClose={
						() => (acceptingApplications
							? setIsArchiveModalOpen(false)
							: setIsPublishGrantModalOpen(false))
					}
					imagePath={`/illustrations/${acceptingApplications ? 'archive' : 'publish'}_grant.svg`}
					title={acceptingApplications ? 'Are you sure you want to archive this grant?' : 'Are you sure you want to publish this grant?'}
					subtitle={acceptingApplications ? 'The grant will no longer be visible to anyone. You will not receive any new applications for it.' : 'The grant will be live, and applicants can apply for this grant.'}
					actionButtonText={acceptingApplications ? 'Archive Grant' : 'Publish Grant'}
					actionButtonOnClick={
						() => {
							setIsAcceptingApplications([
								!isAcceptingApplications[0],
								isAcceptingApplications[1] + 1,
							])
						}
					}
					loading={loading}
					isBiconomyInitialised={isBiconomyInitialised}
				/>
			</Modal>
		</>
	)
}

YourGrantCard.defaultProps = {
	onEditClick: () => {},
	onViewApplicantsClick: () => {},
}
export default YourGrantCard
