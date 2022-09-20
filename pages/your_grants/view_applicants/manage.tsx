import React, {
	useContext, useEffect, useMemo, useState,
} from 'react'
import {
	Box,
	Button,
	Container,
	Flex,
	Image,
	Link,
	Text,
	Tooltip,
} from '@chakra-ui/react'
import { BigNumber } from 'ethers'
import { useRouter } from 'next/router'
import { ApiClientsContext } from 'pages/_app'
import Breadcrumbs from 'src/components/ui/breadcrumbs'
import CopyIcon from 'src/components/ui/copy_icon'
import Heading from 'src/components/ui/heading'
import Modal from 'src/components/ui/modal'
import ModalContent from 'src/components/your_grants/manage_grant/modals/modalContentGrantComplete'
import Funding from 'src/components/your_grants/manage_grant/tables/funding'
import Milestones from 'src/components/your_grants/manage_grant/tables/milestones'
import { defaultChainId } from 'src/constants/chains'
import {
	GetApplicationDetailsQuery,
	useGetApplicationDetailsQuery,
	useGetFundSentForApplicationQuery,
	useGetSafeForAWorkspaceQuery,
} from 'src/generated/graphql'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import useCompleteApplication from 'src/hooks/useCompleteApplication'
import useCustomToast from 'src/hooks/utils/useCustomToast'
import NavbarLayout from 'src/layout/navbarLayout'
import { ApplicationMilestone } from 'src/types'
import {
	formatAmount,
	getFieldString,
	getFormattedDateFromUnixTimestampWithYear,
} from 'src/utils/formattingUtils'
import { isPlausibleSolanaAddress } from 'src/utils/generics'
import useApplicationMilestones from 'src/utils/queryUtil'
import { getAssetInfo } from 'src/utils/tokenUtils'
import { getSupportedChainIdFromWorkspace } from 'src/utils/validationUtils'
import dollarIcon from 'src/v2/assets/currency_icon/dollar_icon.svg'
import { GnosisSafe } from 'src/v2/constants/safe/gnosis_safe'
import { RealmsSolana } from 'src/v2/constants/safe/realms_solana'
import safeServicesInfo from 'src/v2/constants/safeServicesInfo'
import SendFunds from 'src/v2/payouts/SendFunds'
import SendFundsModal from 'src/v2/payouts/SendFundsModal/SendFundsModal'

function getTotalFundingRecv(milestones: ApplicationMilestone[]) {
	let val = BigNumber.from(0)
	milestones.forEach((milestone) => {
		val = val.add(milestone.amountPaid)
	})
	return val
}

function getTotalFundingAsked(milestones: ApplicationMilestone[]) {
	let val = BigNumber.from(0)
	milestones.forEach((milestone) => {
		val = val.add(milestone.amount)
	})
	return val
}

function ManageGrant() {
	const path = ['My Grants', 'View Application', 'Manage']

	const [selected, setSelected] = React.useState(0)
	const [isGrantCompleteModelOpen, setIsGrantCompleteModalOpen] = React.useState(false)
	const [isAdmin, setIsAdmin] = React.useState<boolean>(false)
	const [rewardDisbursed, setRewardDisbursed] = useState<any>()

	const [applicationID, setApplicationID] = useState<any>()
	const [workspaceSafe, setWorkspaceSafe] = useState('')
	const [workspaceSafeChainId, setWorkspaceSafeChainId] = useState(0)
	const [currentSafe, setCurrentSafe] = useState<any>()
	const [transactionStatus, setTransactionStatus] = useState<any>()
	const [sendFundsTo, setSendFundsTo] = useState<any[]>([])

	const router = useRouter()
	const { subgraphClients, workspace } = useContext(ApiClientsContext)!
	const { data: accountData } = useQuestbookAccount()
	const workspacechainId = getSupportedChainIdFromWorkspace(workspace) || defaultChainId

	const { client } = subgraphClients[workspacechainId]

	const { data: safeAddressData } = useGetSafeForAWorkspaceQuery({
		client,
		variables: {
			workspaceID: workspace?.id.toString()!,
		},
	})


	useEffect(() => {
		if(safeAddressData) {
			const { workspaceSafes } = safeAddressData
			const safeAddress = workspaceSafes[0]?.address
			setWorkspaceSafe(safeAddress)
			setWorkspaceSafeChainId(parseInt(workspaceSafes[0]?.chainId))
		}
	}, [safeAddressData])

	const isEvmChain = workspaceSafeChainId !== 900001

	 useEffect(() => {
		if(isEvmChain) {
			const txnServiceURL = safeServicesInfo[workspaceSafeChainId]
			setCurrentSafe(new GnosisSafe(workspaceSafeChainId, txnServiceURL, workspaceSafe))
		} else {
			if(isPlausibleSolanaAddress(workspaceSafe)) {
				setCurrentSafe(new RealmsSolana(workspaceSafe))
			}
		}
	}, [workspaceSafe])

	const {
		data: {
			milestones, rewardAsset, rewardToken, fundingAsk, decimals,
		},
		refetch: refetchMilestones,
	} = useApplicationMilestones(applicationID)

	const {
		data: appDetailsResult,
		refetch: refetchApplicationDetails,
	} = useGetApplicationDetailsQuery({
		client:
        subgraphClients[
        	getSupportedChainIdFromWorkspace(workspace)
            || defaultChainId
        ].client,
		variables: {
			applicationID,
		},
	})

	const { data: fundsDisbursed } = useGetFundSentForApplicationQuery({
		client:
      subgraphClients[
      	getSupportedChainIdFromWorkspace(workspace)
          || defaultChainId
      ].client,
		variables: {
			applicationId: applicationID,
		},
	})

	const checkTransactionStatus = async() => {
		var milestoneTrxnStatus: any[] = []
		if(!isEvmChain) {
			await currentSafe.initialiseAllProposals()
		}

		Promise.all(
		 fundsDisbursed!.fundsTransfers.map(async(transfer: any) => {
		 	const status: any = await currentSafe.getTransactionHashStatus(transfer.transactionHash)
		 	if(!isEvmChain) {
		 		if(status && status[transfer.transactionHash]?.closedAtDate !== '') {
		 			const usdAmount = transfer.amount

		 			milestoneTrxnStatus.push({
		 				amount: (usdAmount || 0),
		 				txnHash: transfer?.transactionHash,
		 				milestoneId: transfer?.milestone?.id,
		 				safeAddress: workspaceSafe,
		 				...status[transfer.transactionHash]
		 			})

		 		}
		 	} else if(isEvmChain) {
		 		if(status) {
		 			const usdAmount = transfer.amount

		 			milestoneTrxnStatus.push({
		 				amount: (usdAmount || 0),
		 				txnHash: transfer?.transactionHash,
		 				milestoneId: transfer?.milestone?.id,
		 				safeAddress: workspaceSafe,
		 				...status[transfer.transactionHash]
		 			})
		 		}
		 	}

		 })
		).then((res) => {

			setTransactionStatus(milestoneTrxnStatus)
			var total = 0
			for(var i in milestoneTrxnStatus) {
				total += parseFloat(milestoneTrxnStatus[i].amount || '0.0')
			}

			setRewardDisbursed(Math.floor(total))
		})
	}

	useEffect(() => {
		if(fundsDisbursed?.fundsTransfers && currentSafe?.id) {
			checkTransactionStatus()
		}
	}, [fundsDisbursed, currentSafe?.id])


	const [applicationData, setApplicationData] = useState<GetApplicationDetailsQuery['grantApplication']>(null)
	const applicantEmail = useMemo(
		() => getFieldString(applicationData, 'applicantEmail'),
		[applicationData],
	)

	const applicantAddress = useMemo(
		() => getFieldString(applicationData, 'applicantAddress'),
		[applicationData],
	)

	useEffect(() => {
		if(appDetailsResult?.grantApplication) {
			setApplicationData(appDetailsResult.grantApplication)
		}
	}, [appDetailsResult])

	let assetInfo

	if(rewardToken) {
		assetInfo = rewardToken
	} else {
		assetInfo = getAssetInfo(rewardAsset, getSupportedChainIdFromWorkspace(workspace))
	}

	const fundingIcon = assetInfo.icon

	useEffect(() => {
		const { applicationId } = router?.query
		if(typeof applicationId === 'string') {
			setApplicationID(applicationId || '')
			refetchApplicationDetails()
		}
	}, [router, accountData, refetchApplicationDetails])


	const tabs = [
		{
			title: milestones.length.toString(),
			subtitle: milestones.length === 1 ? 'Milestone' : 'Milestones',
			content: (
				<Milestones
					transactionStatus={transactionStatus}
					isEvmChain={isEvmChain}
					refetch={refetchMilestones}
					milestones={milestones}
					rewardAssetId={rewardAsset}
					decimals={decimals}
					chainId={getSupportedChainIdFromWorkspace(workspace)}
					rewardToken={rewardToken}
				/>
			),
		},
		{
			icon: fundingIcon,
			title: rewardDisbursed,
			subtitle: 'Funding Sent',
			content: (
				<Funding
					fundTransfers={fundsDisbursed?.fundsTransfers || []}
					transactionStatus={transactionStatus}
					isEvmChain={isEvmChain}
					assetId={rewardAsset}
					columns={['milestoneTitle', 'date', 'from', 'action']}
					assetDecimals={decimals!}
					grantId={applicationData?.grant?.id || ''}
					type='funding_sent'
					chainId={workspaceSafeChainId}
					rewardToken={rewardToken}
				/>
			),
		},
		{
			icon: fundingIcon,
			title:
        (fundingAsk ? formatAmount(fundingAsk.toString(), decimals) : null)
        || formatAmount(getTotalFundingAsked(
          milestones as unknown as ApplicationMilestone[],
        ).toString(), decimals),
			subtitle: 'Funding Requested',
			content: undefined, // <Funding fundTransfers={fundsDisbursed} assetId={rewardAsset} />,
		},
	]

	const [update, setUpdate] = useState<{text: string}>()
	const [txn, txnLink, isBiconomyInitialised, loading] = useCompleteApplication(update, applicationData?.id)

	const { setRefresh } = useCustomToast(txnLink, 6000)
	useEffect(() => {
		if(txn) {
			setUpdate(undefined)
			setIsGrantCompleteModalOpen(false)
			setRefresh(true)
		}

	}, [txn])

	const markApplicationComplete = async(comment: string) => {
		setUpdate({
			text: comment,
		})
	}

	useEffect(() => {
		if(workspace?.members
      && workspace?.members.length > 0 && accountData?.address) {
			const tempMember = workspace.members.find(
				(m) => m.actorId.toLowerCase() === accountData?.address?.toLowerCase(),
			)
			setIsAdmin(tempMember?.accessLevel === 'admin' || tempMember?.accessLevel === 'owner')
		}
	}, [accountData, workspace])

	return (
		<Container
			maxW='100%'
			display='flex'
			px='70px'>
			<Container
				flex={1}
				display='flex'
				flexDirection='column'
				maxW='834px'
				alignItems='stretch'
				pb={8}
				px={10}
			>
				<Heading
					mt='12px'
					title={applicationData?.grant?.title || ''}
					dontRenderDivider
				/>
				<Flex
					mt='3px'
					direction='row'
					justify='start'
					align='baseline'>
					{
						applicantAddress && (
							<Text
								key='address'
								variant='applicationText'>
								By
								{' '}
								<Tooltip label={applicantAddress}>
									<Box
										as='span'
										fontWeight='700'
										display='inline-block'>
										{`${applicantAddress?.substring(0, 6)}...`}
									</Box>
								</Tooltip>
								<Flex
									display='inline-block'
									ml={2}>
									<CopyIcon text={applicantAddress} />
								</Flex>
							</Text>
						)
					}
					{applicantAddress && <Box mr={6} />}
					<Text
						key='mail_text'
						fontWeight='400'>
						<Image
							display='inline-block'
							alt='mail_icon'
							src='/ui_icons/mail_icon.svg'
							mr={2}
						/>
						{applicantEmail}
					</Text>
					<Box mr={6} />
					<Text
						key='date_text'
						fontWeight='400'>
						<Image
							alt='date_icon'
							display='inline-block'
							src='/ui_icons/date_icon.svg'
							mr={2}
						/>
						{
							getFormattedDateFromUnixTimestampWithYear(
								applicationData?.createdAtS,
							)
						}
					</Text>
					<Box mr={6} />
					<Link
						key='link'
						variant='link'
						fontSize='14px'
						lineHeight='24px'
						fontWeight='500'
						fontStyle='normal'
						color='#414E50'
						href={`/your_grants/view_applicants/applicant_form/?applicationId=${applicationData?.id}`}
						isExternal
					>
						View Application
						{' '}
						<Image
							display='inline-block'
							h={3}
							w={3}
							src='/ui_icons/link.svg'
						/>
					</Link>
				</Flex>

				{
					applicationData?.state === 'completed' && (
						<Text
							variant='applicationText'
							color='#717A7C'
							mt={6}>
							Grant marked as complete on
							{' '}
							<Text
								variant='applicationText'
								display='inline-block'>
								{
									getFormattedDateFromUnixTimestampWithYear(
										applicationData?.updatedAtS,
									)
								}
							</Text>
						</Text>
					)
				}

				<Flex
					mt='29px'
					direction='row'
					w='full'
					align='center'>
					{
						tabs.map((tab, index) => (
							<Button
							// eslint-disable-next-line react/no-array-index-key
								key={`tab-${tab.title}-${index}`}
								variant='ghost'
								h='110px'
								w='full'
								_hover={
									{
										background: '#F5F5F5',
									}
								}
								background={
									index !== selected
										? 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F4 100%)'
										: 'white'
								}
								_focus={{}}
								borderRadius={index !== selected ? 0 : '8px 8px 0px 0px'}
								borderRightWidth={
									(index !== tabs.length - 1 && index + 1 !== selected)
                || index === selected
										? '2px'
										: '0px'
								}
								borderLeftWidth={index !== selected ? 0 : '2px'}
								borderTopWidth={index !== selected ? 0 : '2px'}
								borderBottomWidth={index !== selected ? '2px' : 0}
								borderBottomRightRadius='-2px'
								onClick={
									() => {
										if(tabs[index].content) {
											setSelected(index)
										}
									}
								}
							>
								<Flex
									direction='column'
									justify='center'
									align='center'
									w='100%'>
									<Flex
										direction='row'
										justify='center'
										align='center'>
										{
											tab.icon && (
												<Image
													h='26px'
													w='26px'
													src='/dollar_icon.svg'
													fallbackSrc='/images/dummy/Ethereum Icon.svg'
													alt={tab.icon} />
											)
										}
										<Box mx={1} />
										<Text
											fontWeight='700'
											fontSize='26px'
											lineHeight='40px'>
											{tab.title}
										</Text>
									</Flex>
									<Text
										variant='applicationText'
										color='#717A7C'>
										{tab.subtitle}
									</Text>
								</Flex>
							</Button>
						))
					}
				</Flex>

				{tabs[selected].content}

				<Flex
					direction='row'
					justify='center'
					mt={8}>
					{
						applicationData?.state !== 'completed' && selected === 0 && (
							<Button
								disabled={!isBiconomyInitialised}
								variant='primary'
								onClick={() => setIsGrantCompleteModalOpen(true)}
							>
								Mark Application as closed
							</Button>
						)
					}
				</Flex>
			</Container>
			{
				applicationData?.state !== 'completed' && isAdmin && (
					<Button
						mt='22px'
						variant='outline'
						color='brand.500'
						borderColor='brand.500'
						h='48px'
						w='340px'
						onClick={
							() => {
								setSendFundsTo([applicationData])
							}
						}
					>
						Send Funds
					</Button>
					// <Sidebar
					// 	milestones={milestones}
					// 	assetInfo={assetInfo}
					// 	grant={applicationData?.grant}
					// 	applicationId={applicationID}
					// 	applicantId={applicationData?.applicantId!}
					// 	decimals={decimals}
					// />
				)
			}

			<Modal
				isOpen={isGrantCompleteModelOpen}
				onClose={() => setIsGrantCompleteModalOpen(false)}
				title='Mark Application as closed'
				modalWidth={512}
			>
				<ModalContent
					hasClicked={loading}
					onClose={(details: any) => markApplicationComplete(details)}
				/>
			</Modal>

			{/* {
				applicationData && applicationData.grant && (

					<SendFundsModal />

				)
			} */}

			<SendFunds
				workspace={workspace}
				workspaceSafe={workspaceSafe}
				workspaceSafeChainId={workspaceSafeChainId}
				sendFundsTo={sendFundsTo}
				rewardAssetAddress={applicationData?.grant?.reward?.asset}
				rewardAssetDecimals={applicationData?.grant?.reward?.token?.decimal}
				grantData={applicationData?.grant} />
		</Container>
	)
}

ManageGrant.getLayout = function(page: React.ReactElement) {
	return (
		<NavbarLayout>
			{page}
		</NavbarLayout>
	)
}

export default ManageGrant
