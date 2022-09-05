import React, {
	ReactElement, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
	Box,
	Button,
	Container, Flex, forwardRef, IconButton, IconButtonProps, Link, Menu, MenuButton, MenuItem, MenuList, TabList, TabPanel, TabPanels, Tabs, Text
} from '@chakra-ui/react'
import { BigNumber, ethers } from 'ethers'
import moment from 'moment'
import { useRouter } from 'next/router'
import { ApiClientsContext, WebwalletContext } from 'pages/_app'
import Modal from 'src/components/ui/modal'
import { TableFilters } from 'src/components/your_grants/view_applicants/table/TableFilters'
import ChangeAccessibilityModalContent from 'src/components/your_grants/yourGrantCard/changeAccessibilityModalContent'
import { CHAIN_INFO, defaultChainId } from 'src/constants/chains'
import {
	useGetApplicantsForAGrantQuery,
	useGetGrantDetailsQuery,
	useGetRealmsFundTransferDataQuery,
	useGetReviewersForAWorkspaceQuery,
	useGetSafeForAWorkspaceQuery,
} from 'src/generated/graphql'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { useBiconomy } from 'src/hooks/gasless/useBiconomy'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import useArchiveGrant from 'src/hooks/useArchiveGrant'
import useCustomToast from 'src/hooks/utils/useCustomToast'
import NavbarLayout from 'src/layout/navbarLayout'
import { ApplicationMilestone } from 'src/types'
import { formatAddress, formatAmount, getFieldString } from 'src/utils/formattingUtils'
import { bicoDapps, chargeGas, getTransactionDetails, sendGaslessTransaction } from 'src/utils/gaslessUtils'
import { isPlausibleSolanaAddress } from 'src/utils/generics'
import { getUrlForIPFSHash } from 'src/utils/ipfsUtils'
import { getAssetInfo } from 'src/utils/tokenUtils'
import { getSupportedChainIdFromSupportedNetwork, getSupportedChainIdFromWorkspace } from 'src/utils/validationUtils'
import { ArchiveGrant } from 'src/v2/assets/custom chakra icons/ArchiveGrant'
import { CancelCircleFilled } from 'src/v2/assets/custom chakra icons/CancelCircleFilled'
import { EditPencil } from 'src/v2/assets/custom chakra icons/EditPencil'
import { ErrorAlert } from 'src/v2/assets/custom chakra icons/ErrorAlertV2'
import { ThreeDotsHorizontal } from 'src/v2/assets/custom chakra icons/ThreeDotsHorizontal'
import { ViewEye } from 'src/v2/assets/custom chakra icons/ViewEye'
import Breadcrumbs from 'src/v2/components/Breadcrumbs'
import NetworkTransactionModal from 'src/v2/components/NetworkTransactionModal'
import StyledTab from 'src/v2/components/StyledTab'
import NoReviewerBanner from 'src/v2/components/ViewApplicants/NoReviewerBanner'
import RubricNotSetBanner from 'src/v2/components/ViewApplicants/RubricNotSetBanner'
import { Gnosis_Safe } from 'src/v2/constants/safe/gnosis_safe'
import { Realms_Solana, solanaToUsd, usdToSolana } from 'src/v2/constants/safe/realms_solana'
import safeServicesInfo from 'src/v2/constants/safeServicesInfo'
import usePhantomWallet from 'src/v2/hooks/usePhantomWallet'
import AcceptedProposalsPanel from 'src/v2/payouts/AcceptedProposals/AcceptedProposalPanel'
import InReviewPanel from 'src/v2/payouts/InReviewProposals/InReviewPanel'
import RejectedPanel from 'src/v2/payouts/RejectedProposals/RejectedPanel'
import ResubmitPanel from 'src/v2/payouts/ResubmitProposals/ResubmitPanel'
import SendFundsDrawer from 'src/v2/payouts/SendFundsDrawer/SendFundsDrawer'
import SendFundsModal from 'src/v2/payouts/SendFundsModal/SendFundsModal'
import SetupEvaluationDrawer from 'src/v2/payouts/SetupEvaluationDrawer/SetupEvaluationDrawer'
import StatsBanner from 'src/v2/payouts/StatsBanner'
import TransactionInitiatedModal from 'src/v2/payouts/TransactionInitiatedModal'
import ViewEvaluationDrawer from 'src/v2/payouts/ViewEvaluationDrawer/ViewEvaluationDrawer'
import getGnosisTansactionLink from 'src/v2/utils/gnosisUtils'
import getProposalUrl from 'src/v2/utils/phantomUtils'
import { erc20ABI, useConnect, useDisconnect } from 'wagmi'


const PAGE_SIZE = 500
const ERC20Interface = new ethers.utils.Interface(erc20ABI)
// const safeChainIds = Object.keys(safeServicesInfo)

function getTotalFundingRecv(milestones: ApplicationMilestone[]) {
	let val = BigNumber.from(0)
	milestones.forEach((milestone) => {
		val = val.add(milestone.amountPaid)
	})
	return val
}

enum ModalState {
	RECEIPT_DETAILS,
	CONNECT_WALLET,
	VERIFIED_OWNER,
	TRANSATION_INITIATED
}

function ViewApplicants() {
	const [applicantsData, setApplicantsData] = useState<any>([])
	// const [reviewerData, setReviewerData] = useState<any>([])
	// const [daoId, setDaoId] = useState('')
	const [grantID, setGrantID] = useState<any>(null)
	const [acceptingApplications, setAcceptingApplications] = useState(true)
	// const [shouldShowButton, setShouldShowButton] = useState(false)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isAdmin, setIsAdmin] = React.useState<boolean>(false)
	const [isReviewer, setIsReviewer] = React.useState<boolean>(false)
	const [isUser, setIsUser] = React.useState<any>('')
	// const [isActorId, setIsActorId] = React.useState<any>('')

	const [workspaceSafe, setWorkspaceSafe] = useState('')
	const [workspaceSafeChainId, setWorkspaceSafeChainId] = useState(0)

	const [setupRubricBannerCancelled, setSetupRubricBannerCancelled] = useState(false)
	const [addReviewerBannerCancelled, setAddReviewerBannerCancelled] = useState(false)

	const [listOfApplicationToTxnsHash, setListOfApplicationToTxnsHash] = useState({})
	const [applicationStatuses, setApplicationStatuses] = useState({})

	const { data: accountData, nonce } = useQuestbookAccount()
	const router = useRouter()
	const { subgraphClients, workspace } = useContext(ApiClientsContext)!

	const workspacechainId = getSupportedChainIdFromWorkspace(workspace) || defaultChainId
	const { client } = subgraphClients[workspacechainId]

	const { data: safeAddressData } = useGetSafeForAWorkspaceQuery({
		client,
		variables: {
			workspaceID: workspace?.id.toString()!,
		},
	})

	const [realmsQueryParams, setRealmsQueryParams] = useState<any>({ client })

	useEffect(() => {
		if(!grantID || !workspace) {
			return
		}

		setRealmsQueryParams({
			client,
			variables: { grantID: grantID },
		})

	}, [grantID, workspace])

	const { data: realmsFundTransferData } = useGetRealmsFundTransferDataQuery(realmsQueryParams)

	useEffect(() => {
		// console.log('realms fund transfer data', realmsFundTransferData)

		const applicationToTxnHashMap: {[applicationId: string]: {transactionHash: string, amount: number}} = {}

		if(!realmsFundTransferData) {
			return
		}

		realmsFundTransferData?.grants[0]?.fundTransfers?.forEach((fundTransfer,) => {
			// console.log('TX HASH - ', i, fundTransfer.transactionHash)
			// if(!applicationToTxnHashMap[fundTransfer?.application?.id!]) {
			// 	applicationToTxnHashMap[fundTransfer?.application?.id!] = {
			// 		transactionHash: fundTransfer?.transactionHash!,
			// 		amount: parseFloat(fundTransfer?.amount)
			// 	}
			// } else {
			// 	applicationToTxnHashMap[fundTransfer?.application?.id!] = {
			// 		transactionHash: fundTransfer?.transactionHash!,
			// 		amount: parseFloat(fundTransfer?.amount)
			// 	}
			// }
			applicationToTxnHashMap[fundTransfer?.application?.id!] = {
				transactionHash: fundTransfer?.transactionHash!,
				amount: parseFloat(fundTransfer?.amount)
			}
		})
		setListOfApplicationToTxnsHash(applicationToTxnHashMap)

	}, [realmsFundTransferData])

	const { biconomyDaoObj: biconomy, biconomyWalletClient, scwAddress, loading: biconomyLoading } = useBiconomy({
		chainId: workspacechainId ? workspacechainId.toString() : defaultChainId.toString(),
	})
	const [isBiconomyInitialisedDisburse, setIsBiconomyInitialisedDisburse] = useState(false)

	useEffect(() => {
		// const isBiconomyLoading = localStorage.getItem('isBiconomyLoading') === 'true'
		// console.log('rree', isBiconomyLoading, biconomyLoading)
		// console.log('networks 2:', biconomy?.networkId?.toString(), workspacechainId, defaultChainId)

		if(biconomy && biconomyWalletClient && scwAddress && !biconomyLoading && workspacechainId &&
			biconomy.networkId && biconomy.networkId?.toString() === workspacechainId.toString()) {
			setIsBiconomyInitialisedDisburse(true)
		}
	}, [biconomy, biconomyWalletClient, scwAddress, biconomyLoading, isBiconomyInitialisedDisburse, workspacechainId])


	useEffect(() => {
		if(safeAddressData) {
			const { workspaceSafes } = safeAddressData
			const safeAddress = workspaceSafes[0]?.address
			// console.log('safeAddress', safeAddress)
			// console.log('workspace safe details', workspaceSafes)
			// const _isEvmChain = workspaceSafeChainId !== 900001
			// setIsEvmChain(_isEvmChain)
			setWorkspaceSafe(safeAddress)
			setWorkspaceSafeChainId(parseInt(workspaceSafes[0]?.chainId))
		}
	}, [safeAddressData])


	const [rubricDrawerOpen, setRubricDrawerOpen] = useState(false)
	const [viewRubricDrawerOpen, setViewRubricDrawerOpen] = useState(false)

	const [rewardAssetAddress, setRewardAssetAddress] = useState('')
	const [rewardAssetDecimals, setRewardAssetDecimals] = useState<number>()

	const [sendFundsTo, setSendFundsTo] = useState<any[]>()

	useEffect(() => {
		if(router && router.query) {
			const { grantId: gId } = router.query
			// console.log('fetch 100: ', gId)
			setGrantID(gId)
		}
	}, [router])

	const [queryParams, setQueryParams] = useState<any>({
		client:
			subgraphClients[
				getSupportedChainIdFromWorkspace(workspace) || defaultChainId
			].client,
	})

	const [, setQueryReviewerParams] = useState<any>({
		client:
			subgraphClients[
				getSupportedChainIdFromWorkspace(workspace) || defaultChainId
			].client,
	})

	const [sendFundsModalIsOpen, setSendFundsModalIsOpen] = useState(false)
	const [sendFundsDrawerIsOpen, setSendFundsDrawerIsOpen] = useState(false)
	const [txnInitModalIsOpen, setTxnInitModalIsOpen] = useState(false)

	useEffect(() => {
		if(
			workspace
			&& workspace.members
			&& workspace.members.length > 0
			&& accountData
			&& accountData.address
		) {
			const tempMember = workspace.members.find(
				(m) => m.actorId.toLowerCase() === accountData?.address?.toLowerCase(),
			)
			// console.log('fetch 500: ', tempMember)
			setIsAdmin(
				tempMember?.accessLevel === 'admin'
				|| tempMember?.accessLevel === 'owner',
			)

			setIsReviewer(tempMember?.accessLevel === 'reviewer')
			setIsUser(tempMember?.id)
			// setIsActorId(tempMember?.id)
		}
	}, [accountData, workspace])

	useEffect(() => {
		if(!workspace) {
			return
		}

		if(!grantID) {
			return
		}

		// console.log('Grant ID: ', grantID)
		// console.log('isUser: ', isUser)
		// console.log('fetch: ', isAdmin, isReviewer)
		if(isAdmin) {
			// console.log('Setting query params')
			setQueryParams({
				client:
					subgraphClients[getSupportedChainIdFromWorkspace(workspace)!].client,
				variables: {
					grantID,
					first: PAGE_SIZE,
					skip: 0,
				},
			})
		}

		if(isReviewer || isAdmin) {
			// console.log('reviewer', isUser)
			setQueryReviewerParams({
				client:
					subgraphClients[getSupportedChainIdFromWorkspace(workspace)!].client,
				variables: {
					grantID,
					reviewerIDs: [isUser],
					first: PAGE_SIZE,
					skip: 0,
				},
			})
		}

	}, [workspace, grantID, isUser])

	const { data, error, loading } = useGetApplicantsForAGrantQuery(queryParams)
	const { data: grantData } = useGetGrantDetailsQuery(queryParams)
	useEffect(() => {
		if(data && data.grantApplications.length) {
			setRewardAssetAddress(data.grantApplications[0].grant.reward.asset)
			if(data.grantApplications[0].grant.reward.token) {
				setRewardAssetDecimals(data.grantApplications[0].grant.reward.token.decimal)
			} else {
				setRewardAssetDecimals(CHAIN_INFO[
					getSupportedChainIdFromSupportedNetwork(
						data.grantApplications[0].grant.workspace.supportedNetworks[0],
					)
				]?.supportedCurrencies[data.grantApplications[0].grant.reward.asset.toLowerCase()]
					?.decimals)
			}

			const fetchedApplicantsData = data.grantApplications.map((applicant) => {
				let decimal
				let label
				let icon
				if(!(grantData?.grants[0].rubric?.items.length ?? true)) {
					setSetupRubricBannerCancelled(false)
				}

				if(grantData?.grants[0].reward.token) {
					decimal = grantData?.grants[0].reward.token.decimal
					label = grantData?.grants[0].reward.token.label
					icon = getUrlForIPFSHash(grantData?.grants[0].reward.token.iconHash)
				} else {
					decimal = CHAIN_INFO[
						getSupportedChainIdFromSupportedNetwork(
							applicant.grant.workspace.supportedNetworks[0],
						)
					]?.supportedCurrencies[applicant.grant.reward.asset.toLowerCase()]
						?.decimals
					label = getAssetInfo(
						applicant?.grant?.reward?.asset?.toLowerCase(),
						getSupportedChainIdFromWorkspace(workspace),
					).label
					icon = getAssetInfo(
						applicant?.grant?.reward?.asset?.toLowerCase(),
						getSupportedChainIdFromWorkspace(workspace),
					).icon
				}

				return {
					grantTitle: applicant?.grant?.title,
					applicationId: applicant.id,
					applicantName: getFieldString(applicant, 'applicantName'),
					applicantEmail: getFieldString(applicant, 'applicantEmail'),
					applicant_address: getFieldString(applicant, 'applicantAddress'),
					sent_on: moment.unix(applicant.createdAtS).format('DD MMM YYYY'),
					updated_on: moment.unix(applicant.updatedAtS).format('DD MMM YYYY'),
					// applicant_name: getFieldString('applicantName'),
					project_name: getFieldString(applicant, 'projectName'),
					funding_asked: {
						// amount: formatAmount(
						//   getFieldString('fundingAsk') || '0',
						// ),
						amount:
							applicant && getFieldString(applicant, 'fundingAsk') ? formatAmount(
								getFieldString(applicant, 'fundingAsk')!,
								decimal || 18,
							) : '1',
						symbol: label,
						icon,
					},
					// status: applicationStatuses.indexOf(applicant?.state),
					status: TableFilters[applicant?.state],
					milestones: applicant.milestones,
					reviewers: applicant.applicationReviewers,
					amount_paid: formatAmount(
						getTotalFundingRecv(
							applicant.milestones as unknown as ApplicationMilestone[],
						).toString(),
						decimal || 18,
					),
					reviews: applicant.reviews
				}
			})
			setApplicantsData(fetchedApplicantsData)
			// setDaoId(data.grantApplications[0].grant.workspace.id)
			setAcceptingApplications(data.grantApplications[0].grant.acceptingApplications)
		}

	}, [data, error, loading, grantData])

	// const reviewData = useGetApplicantsForAGrantReviewerQuery(queryReviewerParams)

	// const Reviewerstatus = (item: any) => {
	// 	const user = []
	// 	// eslint-disable-next-line no-restricted-syntax
	// 	for(const n in item) {
	// 		if(item[n].reviewer.id === isActorId) {
	// 			user.push(isActorId)
	// 		}
	// 	}

	// 	if(user.length === 1) {
	// 		return 9
	// 	}

	// 	return 0
	// }

	// useEffect(() => {
	// 	if(reviewData.data && reviewData.data.grantApplications.length) {
	// 		// console.log('Reviewer Applications: ', reviewData.data)
	// 		const fetchedApplicantsData = reviewData.data.grantApplications.map((applicant) => {
	// 			return {
	// 				grantTitle: applicant?.grant?.title,
	// 				applicationId: applicant.id,
	// 				applicant_address: getFieldString(applicant, 'applicantAddress'),
	// 				sent_on: moment.unix(applicant.createdAtS).format('DD MMM YYYY'),
	// 				project_name: getFieldString(applicant, 'projectName'),
	// 				funding_asked: {
	// 					amount:
	// 						applicant && getFieldString(applicant, 'fundingAsk') ? formatAmount(
	// 							getFieldString(applicant, 'fundingAsk')!,
	// 							CHAIN_INFO[
	// 								getSupportedChainIdFromSupportedNetwork(
	// 									applicant.grant.workspace.supportedNetworks[0],
	// 								)
	// 							]?.supportedCurrencies[applicant.grant.reward.asset.toLowerCase()]
	// 								?.decimals || 18,
	// 						) : '1',
	// 					symbol: getAssetInfo(
	// 						applicant?.grant?.reward?.asset?.toLowerCase(),
	// 						getSupportedChainIdFromWorkspace(workspace),
	// 					).label,
	// 					icon: getAssetInfo(
	// 						applicant?.grant?.reward?.asset?.toLowerCase(),
	// 						getSupportedChainIdFromWorkspace(workspace),
	// 					).icon,
	// 				},
	// 				status: Reviewerstatus(applicant.reviews),
	// 				reviewers: applicant.applicationReviewers,
	// 			}
	// 		})

	// 		// console.log('fetch', fetchedApplicantsData)

	// 		// setReviewerData(fetchedApplicantsData)
	// 		// setDaoId(reviewData.data.grantApplications[0].grant.workspace.id)
	// 		setAcceptingApplications(reviewData.data.grantApplications[0].grant.acceptingApplications)
	// 	}

	// }, [reviewData])

	const [isAcceptingApplications, setIsAcceptingApplications] = React.useState<
		[boolean, number]
	>([acceptingApplications, 0])

	useEffect(() => {
		setIsAcceptingApplications([acceptingApplications, 0])
	}, [acceptingApplications])

	const [transactionData, txnLink, archiveGrantLoading, isBiconomyInitialised, archiveGrantError] = useArchiveGrant(
		isAcceptingApplications[0],
		isAcceptingApplications[1],
		grantID,
	)

	const { setRefresh } = useCustomToast(txnLink)
	useEffect(() => {
		if(transactionData) {
			setIsModalOpen(false)
			setRefresh(true)
		}

	}, [transactionData])

	React.useEffect(() => {
		setIsAcceptingApplications([acceptingApplications, 0])

	}, [archiveGrantError])

	const [networkTransactionModalStep, setNetworkTransactionModalStep] = React.useState<number>()


	//Implementing the safe send

	const {
		phantomWallet,
		phantomWalletConnected,
		setPhantomWalletConnected } = usePhantomWallet()

	const { isConnected } = useConnect()
	const { disconnect } = useDisconnect()

	const [signerVerified, setSignerVerififed] = useState(false)
	const [proposalAddr, setProposalAddr] = useState('')

	const [initiateTransactionData, setInitiateTransactionData] = useState<any>([])
	const [gnosisBatchData, setGnosisBatchData] = useState<any>([])
	const [, setGnosisReadyToExecuteTxns] = useState<any>([])
	const [totalFundDisbursed, setTotalFundDisbursed] = useState (0)
	const [step, setStep] = useState(ModalState.RECEIPT_DETAILS)

	const isEvmChain = workspaceSafeChainId !== 900001

	const workspaceRegistryContract = useQBContract('workspace', workspacechainId)
	const { webwallet } = useContext(WebwalletContext)!

	const current_safe = useMemo(() => {
		if(isEvmChain) {
			const txnServiceURL = safeServicesInfo[workspaceSafeChainId]
			return new Gnosis_Safe(workspaceSafeChainId, txnServiceURL, workspaceSafe)
		} else {
			if(isPlausibleSolanaAddress(workspaceSafe)) {
				return new Realms_Solana(workspaceSafe)
			}
		}
	}, [workspaceSafe])

	// useEffect(() => {
	// 	const checkValidSafeAddress = async() => {
	// 		const isValidSafeAddress = await current_safe?.isValidSafeAddress(workspaceSafe)
	// 		// console.log('isValidSafeAddress', isValidSafeAddress)
	// 	}

	// 	checkValidSafeAddress()
	// }, [])


	useEffect(() => {
		const formattedTrxnData = sendFundsTo?.map((recepient,) => (
			{
				from: current_safe?.id?.toString(),
				to: recepient.applicant_address,
				applicationId: recepient.applicationId,
				selectedMilestone: recepient.milestones[0].id,
				amount: 0
			})
		)
		setInitiateTransactionData(formattedTrxnData)
		setGnosisBatchData(formattedTrxnData)
	}, [sendFundsTo])

	useEffect(() => {
		if(phantomWalletConnected) {
			getRealmsVerification()
		} else if(isConnected) {
			verifyGnosisOwner()
		} else {
			setSignerVerififed(false)
		}
	}, [phantomWalletConnected, isConnected])

	useEffect(() => {
		if(signerVerified) {
			setStep(ModalState.VERIFIED_OWNER)
		}
	}, [signerVerified])


	async function getStatus(applicationToTxnHashMap: {[applicationId: string]: {transactionHash: string, amount: number}}) {
		const statuses: {[applicationId: string]: {transactionHash: string, status: number, amount: number}} = {}

		Promise.all((Object.keys(applicationToTxnHashMap || {}) || []).map(async(applicationId) => {
			const transaction = applicationToTxnHashMap[applicationId]
			const status = await current_safe?.getTransactionHashStatus(transaction?.transactionHash)
			if(transaction && status) {
				statuses[applicationId] = {
					transactionHash: transaction.transactionHash,
					status: status[transaction.transactionHash],
					amount: transaction.amount
				}
				return status
			}
		})).then(async() => {
			if(statuses && !isEvmChain) {
				let totalFundDisbursed = 0
				for(const applicantId of Object.keys(statuses)) {
					if(statuses[applicantId]?.status === 1) {
						totalFundDisbursed += await solanaToUsd(statuses[applicantId].amount / 10 ** 9)
					}
				}

				setTotalFundDisbursed(totalFundDisbursed)
			}

			setApplicationStatuses(statuses)
		})
	}

	useEffect(() => {
		if((Object.keys(listOfApplicationToTxnsHash) || []).length > 0) {
			// console.log('fetch status')
			getStatus((listOfApplicationToTxnsHash) || [])
		}

	}, [listOfApplicationToTxnsHash])

	function createEVMMetaTransactions() {
		const readyTxs = gnosisBatchData.map((data: any) => {
			const txData = encodeTransactionData(data.to, (data.amount.toString()))
			const tx = {
				to: ethers.utils.getAddress(rewardAssetAddress),
				data: txData,
				value: '0'
			}
			return tx
		})
		setGnosisReadyToExecuteTxns(readyTxs)
		return readyTxs
	}

	function encodeTransactionData(recipientAddress: string, fundAmount: string) {
		const txData = ERC20Interface.encodeFunctionData('transfer', [
			recipientAddress,
			ethers.utils.parseUnits(fundAmount, rewardAssetDecimals)
		])

		return txData
	}

	const getRealmsVerification = async() => {
		if(phantomWallet?.publicKey?.toString()) {
			const isVerified = await current_safe?.isOwner(phantomWallet.publicKey?.toString())
			if(isVerified) {
				setSignerVerififed(true)
			}
		}
	}

	const verifyGnosisOwner = async() => {
		if(isConnected) {
			const isVerified = await current_safe?.isOwner(workspaceSafe)
			if(isVerified) {
				setSignerVerififed(true)
			} else {
				// console.log('not a owner')
				setSignerVerififed(false)
			}
		}
	}


	const initiateTransaction = async() => {
		// console.log('initiate transaction called')
		let proposaladdress: string | undefined
		if(isEvmChain) {
			const readyToExecuteTxs = createEVMMetaTransactions()
			const safeTxHash = await current_safe?.createMultiTransaction(readyToExecuteTxs, workspaceSafe)
			if(safeTxHash) {
				proposaladdress = safeTxHash
				setProposalAddr(safeTxHash)
			} else {
				throw new Error('Proposal address not found')
			}
		} else {
			proposaladdress = await current_safe?.proposeTransactions(grantData?.grants[0].title!, initiateTransactionData, phantomWallet)
			if(!proposaladdress) {
				throw new Error('No proposal address found!')
			}

			setProposalAddr(proposaladdress?.toString())
		}

		disburseRewardFromSafe(proposaladdress?.toString()!)
			.then(() => {
				// console.log('Sent transaction to contract - realms')
			})
			.catch(() => {
				// console.log('realms sending transction error:', err)
			})

	}

	const disburseRewardFromSafe = useCallback(async(proposaladdress: string) => {
		// console.log(workspacechainId)
		if(!workspacechainId) {
			return
		}

		try {
			if(!workspacechainId) {
				throw new Error('No network specified')
			}

			if(!proposaladdress) {
				throw new Error('No proposal Address specified')
			}

			if(!initiateTransactionData) {
				throw new Error('No data provided!')
			}

			if(!workspace) {
				throw new Error('No workspace found!')
			}

			if(typeof biconomyWalletClient === 'string' || !biconomyWalletClient || !scwAddress) {
				return
			}

			const methodArgs = [
				initiateTransactionData.map((element: any) => (parseInt(element.applicationId, 16))),
				initiateTransactionData.map((element: any) => (parseInt(element.selectedMilestone, 16))),
				rewardAssetAddress,
				'nonEvmAssetAddress-toBeChanged',
				initiateTransactionData.map((element: any) => isEvmChain ? (ethers.utils.parseEther(element.amount.toString())) : Math.floor(element.amount.toFixed(9) * 1000000000)),
				workspace.id,
				proposaladdress
			]

			// console.log('methodArgs', methodArgs)

			const transactionHash = await sendGaslessTransaction(
				biconomy,
				workspaceRegistryContract,
				'disburseRewardFromSafe',
				methodArgs,
				workspaceRegistryContract.address,
				biconomyWalletClient,
				scwAddress,
				webwallet,
				`${workspacechainId}`,
				bicoDapps[workspacechainId.toString()].webHookId,
				nonce
			)

			if(!transactionHash) {
				throw new Error('No transaction hash found!')
			}

			const { txFee } = await getTransactionDetails(transactionHash, workspacechainId.toString())

			// console.log('txFee', txFee)
			// console.log('receipt: ', receipt)
			await chargeGas(Number(workspace.id), Number(txFee))

		} catch(e: any) {
			// console.log('disburse error', e)
		}
	}, [workspace, biconomyWalletClient, workspacechainId, biconomy, workspaceRegistryContract, scwAddress, webwallet, nonce, initiateTransactionData, proposalAddr])

	const onChangeRecepientDetails = async(applicationId: any, fieldName: string, fieldValue: any) => {
		// console.log('onChangeRecepientDetails', applicationId, fieldName, fieldValue)
		// console.log('Gnosis Batch data', gnosisBatchData)

		if(!isEvmChain && fieldName === 'amount') {
			fieldValue = await usdToSolana(fieldValue)
		}

		const tempData = initiateTransactionData.map((transactionData: any) => {
			if(transactionData.applicationId === applicationId) {
				return { ...transactionData, [fieldName]: fieldValue }
			}

			return transactionData
		})

		// console.log('initiateTransactionData', tempData)
		setInitiateTransactionData(tempData)
		setGnosisBatchData(tempData)
	}

	const onSendFundsButtonClicked = async(state: boolean, selectedApplicants: any[]) => {
		// console.log('state', state)
		// console.log('selectedApplicants', selectedApplicants)
		if(selectedApplicants.length === 1) {
			setSendFundsModalIsOpen(state)
		} else {
			setSendFundsDrawerIsOpen(state)
		}

		setSendFundsTo(selectedApplicants)
	}

	const onModalStepChange = async(currentState: number) => {
		switch (currentState) {
		case ModalState.RECEIPT_DETAILS:
			setStep(ModalState.CONNECT_WALLET)
			break
		case ModalState.CONNECT_WALLET:
			if(signerVerified) {
				setStep(ModalState.VERIFIED_OWNER)
			}

			break
		case ModalState.VERIFIED_OWNER:
			setStep(ModalState.TRANSATION_INITIATED)
			initiateTransaction()
			setSendFundsModalIsOpen(false)
			setSendFundsDrawerIsOpen(false)
			setTxnInitModalIsOpen(true)

			break
		}
	}

	const onModalClose = async() => {
		setStep(ModalState.RECEIPT_DETAILS)
		setSendFundsModalIsOpen(false)
		setSendFundsDrawerIsOpen(false)
		setTxnInitModalIsOpen(false)
		if(phantomWallet?.isConnected) {
			await phantomWallet.disconnect()
			setPhantomWalletConnected(false)
		}

		if(isConnected) {
			disconnect()
		}
	}

	//end of implementation

	const [getReviewersForAWorkspaceParams, setGetReviewersForAWorkspaceParams] = useState<any>({
		client:
			subgraphClients[
				getSupportedChainIdFromWorkspace(workspace) || defaultChainId
			].client,
	})
	const { data: reviewersForAWorkspaceData } = useGetReviewersForAWorkspaceQuery(getReviewersForAWorkspaceParams)
	useEffect(() => {
		if(!workspace) {
			return
		}

		setGetReviewersForAWorkspaceParams({
			client:
				subgraphClients[getSupportedChainIdFromWorkspace(workspace)!].client,
			variables: {
				workspaceId: workspace.id
			},
		})
	}, [workspace])

	const [areReviewersAdded, setAreReviewersAdded] = useState<boolean>(false)
	const [areRubricsSet, setAreRubricsSet] = useState<boolean>(false)

	useEffect(() => {
		if(!reviewersForAWorkspaceData) {
			setAreReviewersAdded(true)
		} else if(reviewersForAWorkspaceData?.workspaces[0]?.members.length) {
			setAreReviewersAdded(reviewersForAWorkspaceData?.workspaces[0]?.members.length > 0)
		} else {
			setAreReviewersAdded(false)
		}
	}, [reviewersForAWorkspaceData])

	useEffect(() => {
		if(!grantData) {
			setAreRubricsSet(true)
		} else if(grantData?.grants[0].rubric?.items.length) {
			setAreRubricsSet(grantData?.grants[0].rubric?.items.length > 0)
		} else {
			setAreRubricsSet(false)
		}
	}, [grantData])

	return (
		<Container
			maxW='100%'
			display='flex'
			pb='300px'
			px={0}
			minH='calc(100vh - 64px)'
			bg='#FBFBFD'
		>
			<Container
				flex={1}
				display='flex'
				flexDirection='column'
				maxW='1116px'
				alignItems='stretch'
				pb={8}
				px={8}
				pt={6}
				pos='relative'
			>
				<Breadcrumbs path={['My Grants', 'View Applicants']} />

				<Flex>
					<Text
						mt={1}
						mr='auto'
						fontSize='24px'
						lineHeight='32px'
						fontWeight='500'
					>
						{applicantsData[0]?.grantTitle || 'Grant Title'}
					</Text>

					{
						isAdmin && (
							<Menu>
								<MenuButton
									as={
										forwardRef<IconButtonProps, 'div'>((props, ref) => (
											<IconButton
												borderRadius='2.25px'
												mt='auto'
												h={6}
												w={6}
												minW={0}
												onClick={() => setRubricDrawerOpen(true)}
												icon={
													<ThreeDotsHorizontal
														h='3px'
														w='13.5px' />
												}
												{...props}
												ref={ref}
												aria-label='options'
											/>
										))
									}
								/>
								<MenuList
									minW='240px'
									py={0}>
									<Flex
										bg='#F0F0F7'
										px={4}
										py={2}
									>
										<Text
											fontSize='14px'
											lineHeight='20px'
											fontWeight='500'
											textAlign='center'
											color='#555570'
										>
											Grant options
										</Text>
									</Flex>
									<MenuItem
										px='19px'
										py='10px'
										onClick={
											() => (grantData?.grants[0]?.rubric?.items.length || 0) > 0 || false ?
												setViewRubricDrawerOpen(true) : setRubricDrawerOpen(true)
										}
									>
										{
											(grantData?.grants[0]?.rubric?.items.length || 0) > 0 || false ? (
												<ViewEye
													color='#C8CBFC'
													mr='11px' />
											) : (
												<EditPencil
													color='#C8CBFC'
													mr='11px' />
											)
										}
										<Text
											fontSize='14px'
											lineHeight='20px'
											fontWeight='400'
											textAlign='center'
											color='#555570'
										>
											{(grantData?.grants[0]?.rubric?.items.length || 0) > 0 || false ? 'View scoring rubric' : 'Setup applicant evaluation'}
										</Text>
									</MenuItem>
									<MenuItem
										px='19px'
										py='10px'
									>
										<ArchiveGrant
											color='#C8CBFC'
											mr='11px' />
										<Text
											fontSize='14px'
											lineHeight='20px'
											fontWeight='400'
											textAlign='center'
											color='#555570'
										>
											Archive grant
										</Text>
									</MenuItem>
								</MenuList>
							</Menu>
						)
					}
				</Flex>

				<Box mt={4} />

				<StatsBanner
					funds={totalFundDisbursed}
					reviews={applicantsData.reduce((acc: any, curr: any) => acc + curr.reviews.length, 0)}
					totalReviews={applicantsData.reduce((acc: any, curr: any) => acc + curr.reviewers.length, 0)}
					applicants={applicantsData.length}
				/>

				<Box mt={5} />
				{
					!areReviewersAdded && !areRubricsSet && !addReviewerBannerCancelled && (
						<NoReviewerBanner
							onSetup={
								() => {
									router.push({
										pathname: '/manage_dao/',
										query: {
											tab: 'members',
										},
									})
								}
							}
							onClose={() => setAddReviewerBannerCancelled(true)} />
					)
				}
				{
					areReviewersAdded && !areRubricsSet && !setupRubricBannerCancelled && (
						<RubricNotSetBanner
							onSetup={() => setRubricDrawerOpen(true)}
							onClose={() => setSetupRubricBannerCancelled(true)} />

					)
				}


				<Tabs
					h={8}
					colorScheme='brandv2'>
					<TabList>
						<StyledTab label={`Accepted (${applicantsData.filter((item: any) => (2 === item.status)).length})`} />
						<StyledTab label={`In Review (${applicantsData.filter((item: any) => (0 === item.status)).length})`} />
						<StyledTab label={`Rejected (${applicantsData.filter((item: any) => (3 === item.status)).length})`} />
						<StyledTab label={`Asked to Resubmit (${applicantsData.filter((item: any) => (1 === item.status)).length})`} />
					</TabList>

					<TabPanels>
						<TabPanel
							borderRadius='2px'
							p={0}
							mt={5}
							bg='white'
							boxShadow='inset 1px 1px 0px #F0F0F7, inset -1px -1px 0px #F0F0F7' >
							<AcceptedProposalsPanel
								applicationStatuses={applicationStatuses}
								applicantsData={applicantsData}
								onSendFundsClicked={onSendFundsButtonClicked}
								onBulkSendFundsClicked={onSendFundsButtonClicked}
								grantData={grantData}
							/>
						</TabPanel>

						<TabPanel
							tabIndex={1}
							borderRadius='2px'
							p={0}
							mt={5}
							bg='white'
							boxShadow='inset 1px 1px 0px #F0F0F7, inset -1px -1px 0px #F0F0F7'>
							<InReviewPanel
								applicantsData={applicantsData}
								grantData={grantData} />
						</TabPanel>

						<TabPanel
							tabIndex={2}
							borderRadius='2px'
							p={0}
							mt={5}
							bg='white'
							boxShadow='inset 1px 1px 0px #F0F0F7, inset -1px -1px 0px #F0F0F7'>
							<RejectedPanel
								applicantsData={applicantsData} />
						</TabPanel>

						<TabPanel
							tabIndex={3}
							borderRadius='2px'
							p={0}
							mt={5}
							bg='white'
							boxShadow='inset 1px 1px 0px #F0F0F7, inset -1px -1px 0px #F0F0F7'>
							<ResubmitPanel
								applicantsData={applicantsData} />
						</TabPanel>


					</TabPanels>
				</Tabs>

				<SetupEvaluationDrawer
					isOpen={rubricDrawerOpen}
					onClose={() => setRubricDrawerOpen(false)}
					onComplete={() => setRubricDrawerOpen(false)}
					grantAddress={grantID}
					chainId={getSupportedChainIdFromWorkspace(workspace) || defaultChainId}
					setNetworkTransactionModalStep={setNetworkTransactionModalStep}
					data={reviewersForAWorkspaceData}
				/>

				<ViewEvaluationDrawer
					isOpen={viewRubricDrawerOpen}
					grantData={grantData}
					onClose={() => setViewRubricDrawerOpen(false)}
					onComplete={() => setViewRubricDrawerOpen(false)}
				/>

				<SendFundsModal
					isOpen={sendFundsModalIsOpen}
					onClose={onModalClose}
					safeAddress={workspaceSafe ?? 'HWuCwhwayTaNcRtt72edn2uEMuKCuWMwmDFcJLbah3KC'}
					proposals={sendFundsTo ?? []}

					onChangeRecepientDetails={onChangeRecepientDetails}
					phantomWallet={phantomWallet}
					isEvmChain={isEvmChain}
					signerVerified={signerVerified}
					initiateTransactionData={initiateTransactionData}
					onModalStepChange={onModalStepChange}
					step={step}
				/>

				<TransactionInitiatedModal
					isOpen={!!(txnInitModalIsOpen && proposalAddr)}
					onClose={onModalClose}
					proposalUrl={isEvmChain ? getGnosisTansactionLink(current_safe?.id?.toString()!, current_safe?.chainId.toString()!) : getProposalUrl(current_safe?.id?.toString()!, proposalAddr)}
				/>

				<SendFundsDrawer
					isOpen={sendFundsDrawerIsOpen}
					onClose={onModalClose}
					safeAddress={workspaceSafe ?? 'HWuCwhwayTaNcRtt72edn2uEMuKCuWMwmDFcJLbah3KC'}
					proposals={sendFundsTo ?? []}
					onChangeRecepientDetails={onChangeRecepientDetails}
					phantomWallet={phantomWallet}
					setPhantomWalletConnected={setPhantomWalletConnected}
					isEvmChain={isEvmChain}
					current_safe={current_safe}
					signerVerified={signerVerified}
					initiateTransaction={initiateTransaction}
					initiateTransactionData={initiateTransactionData}

					onModalStepChange={onModalStepChange}
					step={step}
				/>

				<NetworkTransactionModal
					isOpen={networkTransactionModalStep !== undefined}
					subtitle='Creating scoring rubric'
					description={
						<Flex
							direction='column'
							w='100%'
							align='start'>
							<Text
								fontWeight='500'
								fontSize='17px'
							>
								{grantData && grantData?.grants && grantData?.grants.length > 0 && grantData?.grants[0].title}
							</Text>

							<Button
								rightIcon={<ExternalLinkIcon />}
								variant='linkV2'
								bg='#D5F1EB'>
								{grantID && formatAddress(grantID)}
							</Button>
						</Flex>
					}
					currentStepIndex={networkTransactionModalStep || 0}
					steps={
						[
							'Connect your wallet',
							'Uploading rubric data to IPFS',
							'Setting rubric and enabling auto assignment of reviewers',
							'Waiting for transaction to complete',
							'Rubric created and Reviewers assigned',
						]
					} />

			</Container>
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title=''
			>
				<ChangeAccessibilityModalContent
					onClose={() => setIsModalOpen(false)}
					imagePath='/illustrations/publish_grant.svg'
					title='Are you sure you want to publish this grant?'
					subtitle='The grant will be live, and applicants can apply for this grant.'
					actionButtonText='Publish grant'
					actionButtonOnClick={
						() => {
							// console.log('Doing it!')
							// console.log('Is Accepting Applications (Button click): ', isAcceptingApplications)
							setIsAcceptingApplications([
								!isAcceptingApplications[0],
								isAcceptingApplications[1] + 1,
							])
						}
					}
					loading={archiveGrantLoading}
					isBiconomyInitialised={isBiconomyInitialised}
				/>
			</Modal>
		</Container>
	)
}

ViewApplicants.getLayout = function(page: ReactElement) {
	return (
		<NavbarLayout>
			{page}
		</NavbarLayout>
	)
}

export default ViewApplicants