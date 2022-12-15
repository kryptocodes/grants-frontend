import { ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Button, Flex, ToastId, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import NetworkTransactionFlowStepperModal from 'src/components/ui/NetworkTransactionFlowStepperModal'
import ErrorToast from 'src/components/ui/toasts/errorToast'
import { APPLICATION_REGISTRY_ADDRESS, WORKSPACE_REGISTRY_ADDRESS } from 'src/constants/addresses'
import applicantDetailsList from 'src/constants/applicantDetailsList'
import WorkspaceRegistryAbi from 'src/contracts/abi/WorkspaceRegistryAbi.json'
import SupportedChainId from 'src/generated/SupportedChainId'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { useBiconomy } from 'src/hooks/gasless/useBiconomy'
import { useNetwork } from 'src/hooks/gasless/useNetwork'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import logger from 'src/libraries/logger'
import NavbarLayout from 'src/libraries/ui/navbarLayout'
import { validateAndUploadToIpfs, validateRequest } from 'src/libraries/validator'
import { ApiClientsContext, WebwalletContext } from 'src/pages/_app'
import BuilderDiscovery from 'src/screens/request_proposal/_subscreens/BuilderDiscovery'
import LinkMultiSig from 'src/screens/request_proposal/_subscreens/LinkMultiSig'
import Payouts from 'src/screens/request_proposal/_subscreens/Payouts'
import ProposalReview from 'src/screens/request_proposal/_subscreens/ProposalReview'
import ProposalSubmission from 'src/screens/request_proposal/_subscreens/ProposalSubmission'
import { today } from 'src/screens/request_proposal/_utils/utils'
import { ApplicantDetailsFieldType, ReviewType } from 'src/types'
import getErrorMessage from 'src/utils/errorUtils'
import { getExplorerUrlForTxHash } from 'src/utils/formattingUtils'
import { addAuthorizedOwner, addAuthorizedUser, bicoDapps, chargeGas, getEventData, getTransactionDetails, networksMapping, sendGaslessTransaction } from 'src/utils/gaslessUtils'
import { uploadToIPFS } from 'src/utils/ipfsUtils'
import { getSupportedChainIdFromWorkspace, getSupportedValidatorNetworkFromChainId } from 'src/utils/validationUtils'
import { SafeSelectOption } from 'src/v2/components/Onboarding/CreateDomain/SafeSelect'
import { USD_ASSET, USD_DECIMALS, USD_ICON } from 'src/constants/chains'
import { DEFAULT_NETWORK } from 'src/constants'

function RequestProposal() {
	const buildComponent = () => {
		return (
			<Flex
				className='card'
				minWidth='90%'
				gap={8}
				bgColor='white'
				padding={4}
				justifyContent='center'
				alignItems='center'
				marginTop={8}
				marginRight={16}
				marginLeft={16}
				marginBottom={4}>
				{/* <Button onClick={() => createGrant()}>create grant</Button> */}
				{renderBody()}
			</Flex>
		)
	}

	const renderBody = () => {
		switch (step) {
			case 1:
				return (
					<ProposalSubmission
						proposalName={proposalName}
						setProposalName={setProposalName}
						startdate={startDate}
						setStartdate={setStartDate}
						endDate={endDate}
						setEndDate={setEndDate}
						requiredDetails={requiredDetails}
						moreDetails={moreDetails}
						setMoreDetails={setMoreDetails}
						link={link}
						setLink={setLink}
						doc={doc!}
						setDoc={setDoc}
						step={step}
						setStep={setStep}
						allApplicantDetails={allApplicantDetails}
						setAllApplicantDetails={setAllApplicantDetails}
					/>
				)
			case 2:
				return (
					<ProposalReview
						numberOfReviewers={numberOfReviewers}
						setNumberOfReviewers={setNumberOfReviewers}
						reviewMechanism={reviewMechanism}
						setReviewMechanism={setReviewMechanism}
						step={step}
						setStep={setStep}
						rubrics={rubrics}
						setRubrics={setRubrics} />
				)
			case 3:
				return (
					<Payouts
						payoutMode={payoutMode}
						setPayoutMode={setPayoutMode}
						amount={amount}
						setAmount={setAmount}
						step={step}
						setStep={setStep}
						milestones={milestones}
						setMilestones={setMilestones} />
				)
			case 4: return (
				<LinkMultiSig
					multiSigAddress={multiSigAddress}
					setMultiSigAddress={setMultiSigAddress}
					step={step}
					setStep={setStep}
					selectedSafeNetwork={selectedSafeNetwork!}
					setSelectedSafeNetwork={setSelectedSafeNetwork} />
			)
			case 5: return (
				<>
					<BuilderDiscovery
						domainName={domainName}
						setDomainName={setDomainName}
						domainImage={domainImage!}
						setDomainImage={setDomainImage}
						step={step}
						setIsOpen={setIsNetworkTransactionModalOpen}
						createWorkspace={createWorkspace} />
					<NetworkTransactionFlowStepperModal
						isOpen={isNetworkTransactionModalOpen}
						currentStepIndex={currentStepIndex!}
						viewTxnLink={getExplorerUrlForTxHash(network, txHash)}
						onClose={
							() => {
								setCurrentStepIndex(undefined)
								setRole('admin')
								router.push({ pathname: '/dashboard' })
							}
						} />
				</>
			)
		}
	}

	// State for proposal creation
	const todayDate = today()
	const [proposalName, setProposalName] = useState('')
	const [startDate, setStartDate] = useState(todayDate)
	const [endDate, setEndDate] = useState('')

	const applicantDetails = applicantDetailsList
		.map(({
			title, id, inputType, isRequired, pii
		}, index) => {
			if (index === applicantDetailsList.length - 1) {
				return null
			}

			// if(index === applicantDetailsList.length - 2) {
			// 	return null
			// }

			return {
				title,
				required: isRequired || false,
				id,
				inputType,
				pii
			}
		})
		.filter((obj) => obj !== null)

	const [requiredDetails, setRequiredDetails] = useState(applicantDetails)
	const [moreDetails, setMoreDetails] = useState([''])
	const [allApplicantDetails, setAllApplicantDetails] = useState<{ [key: string]: ApplicantDetailsFieldType }>({})
	const [link, setLink] = useState('')
	const [doc, setDoc] = useState<FileList>()

	const [step, setStep] = useState(1)

	// State for Proposal Review
	const [numberOfReviewers, setNumberOfReviewers] = useState(2)
	const [reviewMechanism, setReviewMechanism] = useState('')
	const [rubrics, setRubrics] = useState({})

	// State for Payouts
	const [payoutMode, setPayoutMode] = useState('')
	const [amount, setAmount] = useState(0)
	const [milestones, setMilestones] = useState({})

	// State for Linking MultiSig
	const [multiSigAddress, setMultiSigAddress] = useState('')
	const [selectedSafeNetwork, setSelectedSafeNetwork] = useState<SafeSelectOption>()

	// State for Builder Discovery
	const [domainName, setDomainName] = useState('')
	const [domainImage, setDomainImage] = useState<File | null>(null)

	// State for Network Transaction Flow
	const [isNetworkTransactionModalOpen, setIsNetworkTransactionModalOpen] = useState(false)
	const [currentStepIndex, setCurrentStepIndex] = useState<number>()

	// state for gasless transactions
	const [txHash, setTxHash] = useState('')

	// state for workspace creation
	const [workspaceId, setWorkspaceId] = useState('')

	// Webwallet
	const [shouldRefreshNonce, setShouldRefreshNonce] = useState<boolean>()
	const { data: accountDataWebwallet, nonce } = useQuestbookAccount(shouldRefreshNonce)
	const { webwallet } = useContext(WebwalletContext)!

	const { subgraphClients, setRole } = useContext(ApiClientsContext)!
	const { network } = useNetwork()
	const targetContractObject = useQBContract('workspace', network as unknown as SupportedChainId)

	const { biconomyDaoObj: biconomy, biconomyWalletClient, scwAddress, loading: biconomyLoading } = useBiconomy({
		chainId: selectedSafeNetwork?.networkId ? networksMapping[selectedSafeNetwork?.networkId?.toString()] : DEFAULT_NETWORK,
		shouldRefreshNonce: shouldRefreshNonce
	})
	const [isBiconomyInitialised, setIsBiconomyInitialised] = useState(false)

	const toastRef = useRef<ToastId>()
	const toast = useToast()

	const router = useRouter()

	const grantContract = useQBContract('grantFactory', network)

	useEffect(() => {
		// console.log("add_user", nonce, webwallet)
		if (nonce && nonce !== 'Token expired') {
			return
		}

		if (webwallet) {
			addAuthorizedUser(webwallet?.address)
				.then(() => {
					setShouldRefreshNonce(true)
					// console.log('Added authorized user', webwallet.address)
				})
			// .catch((err) => console.log("Couldn't add authorized user", err))
		}
	}, [webwallet, nonce])


	useEffect(() => {
		console.log('start date', startDate)
	}, [])

	useEffect(() => {
		console.log('end date', endDate)
	}, [])

	useEffect(() => {

		if (biconomy && biconomyWalletClient && scwAddress && !biconomyLoading && biconomy.networkId) {
			if (process.env.NEXT_PUBLIC_IS_TEST == 'true' && !selectedSafeNetwork?.networkId) {
				setIsBiconomyInitialised(true)
			}
			if (selectedSafeNetwork?.networkId && biconomy.networkId.toString() === networksMapping[selectedSafeNetwork?.networkId?.toString()]) {
				setIsBiconomyInitialised(true)
			}



			console.log('biconomy', biconomy)
		}
	}, [biconomy, biconomyWalletClient, scwAddress, biconomyLoading, isBiconomyInitialised, selectedSafeNetwork?.networkId])


	// create workspace
	const createWorkspace = useCallback(async () => {
		// let workspaceId: number
		try {
			setCurrentStepIndex(0)
			const uploadedImageHash = (await uploadToIPFS(domainImage)).hash
			console.log('domain logo', uploadedImageHash)
			const { hash: workspaceCreateIpfsHash } = await validateAndUploadToIpfs('WorkspaceCreateRequest', {
				title: domainName!,
				about: '',
				logoIpfsHash: uploadedImageHash,
				creatorId: accountDataWebwallet!.address!,
				creatorPublicKey: webwallet?.publicKey,
				socials: [],
				supportedNetworks: [
					getSupportedValidatorNetworkFromChainId(network!),
				],
			})

			if (!workspaceCreateIpfsHash) {
				throw new Error('Error validating grant data')
			}

			console.log('sefe', selectedSafeNetwork)
			console.log('network', network)
			// if (!selectedSafeNetwork || !network) {
			// 	throw new Error('No network specified')
			// }

			if (!network) {
				throw new Error('No network specified')
			}

			if (typeof biconomyWalletClient === 'string' || !biconomyWalletClient || !scwAddress) {
				return
			}

			// setCurrentStepIndex(1)

			const transactionHash = await sendGaslessTransaction(
				biconomy,
				targetContractObject,
				'createWorkspace',
				[workspaceCreateIpfsHash, new Uint8Array(32), multiSigAddress, selectedSafeNetwork ? parseInt(selectedSafeNetwork.networkId) : '0'],
				WORKSPACE_REGISTRY_ADDRESS[network],
				biconomyWalletClient,
				scwAddress,
				webwallet,
				`${network}`,
				bicoDapps[network].webHookId,
				nonce
			)

			if (!transactionHash) {
				return
			}

			const { txFee: workspaceCreateTxFee, receipt: workspaceCreateReceipt } = await getTransactionDetails(transactionHash, network.toString())
			setTxHash(workspaceCreateReceipt?.transactionHash)
			logger.info({ network, subgraphClients }, 'Network and Client')
			await subgraphClients[network]?.waitForBlock(workspaceCreateReceipt?.blockNumber)
			console.log('txFee', workspaceCreateTxFee)

			// setCurrentStepIndex(1)
			const event = await getEventData(workspaceCreateReceipt, 'WorkspaceCreated', WorkspaceRegistryAbi)
			if (event) {
				const workspace_Id = Number(event.args[0].toBigInt())
				debugger
				console.log('workspace_id', workspace_Id)
				setWorkspaceId(workspace_Id.toString())
				const newWorkspace = `chain_${network}-0x${workspace_Id.toString(16)}`
				logger.info({ newWorkspace }, 'New workspace created')
				localStorage.setItem('currentWorkspace', newWorkspace)
				await addAuthorizedOwner(workspace_Id, webwallet?.address!, scwAddress, network.toString(),
					'this is the safe addres - to be updated in the new flow')

				await chargeGas(workspace_Id, Number(workspaceCreateTxFee), network)


				// createGrant()
				let fileIPFSHash = ''
				if (doc) {
					const fileCID = await uploadToIPFS(doc[0]!)
					logger.info('fileCID', fileCID)
					fileIPFSHash = fileCID.hash
				}

				// 2. validate grant data
				let payout: string
				console.log('payout type', payoutMode)
				if (payoutMode === 'in one go') {
					payout = 'in_one_go'
				} else if (payoutMode! === 'based on milestone') {
					payout = 'milestones'
				}

				let review: string
				if (reviewMechanism === 'Voting') {
					review = 'voting'
				} else if (reviewMechanism === 'Rubric') {
					review = 'rubrics'
				}

				if (allApplicantDetails) {

					console.log('fields', allApplicantDetails)
				}

				console.log('review type', reviewMechanism)
				console.log('end date', endDate)
				const { hash: grantCreateIpfsHash } = await validateAndUploadToIpfs('GrantCreateRequest', {
					title: proposalName!,
					startDate: startDate!,
					endDate: endDate!,
					// details: allApplicantDetails!,
					link: link!,
					docIpfsHash: fileIPFSHash,
					reward: {
						asset: USD_ASSET!,
						committed: amount.toString()!,
						token: {
							label: 'USD',
							address: USD_ASSET!,
							decimal: USD_DECIMALS.toString(),
							iconHash: USD_ICON
						}
					},
					payoutType: payout!,
					reviewType: review!,
					creatorId: accountDataWebwallet!.address!,
					workspaceId: workspaceId!,
					fields: allApplicantDetails,
				})

				console.log('ipfsHash', grantCreateIpfsHash)
				console.log('rubrics', rubrics)

				let rubricHash = ''
				if (reviewMechanism === 'Rubric') {
					const { hash: auxRubricHash } = await validateAndUploadToIpfs('RubricSetRequest', {
						rubric: {
							rubric: rubrics,
							isPrivate: false
						},
					})

					if (auxRubricHash) {
						rubricHash = auxRubricHash || ''
						console.log('Aux rubric hash', auxRubricHash)
					}
				}
				console.log('rubric hash', rubricHash)
				if (workspace_Id) {
					const methodArgs = [
						workspace_Id.toString(),
						grantCreateIpfsHash,
						rubricHash,
						numberOfReviewers,
						WORKSPACE_REGISTRY_ADDRESS[network!],
						APPLICATION_REGISTRY_ADDRESS[network!],
					]
					console.log('methodArgs for grant creation', methodArgs)
					const response = await sendGaslessTransaction(
						biconomy,
						grantContract,
						'createGrant',
						methodArgs,
						grantContract.address,
						biconomyWalletClient!,
						scwAddress!,
						webwallet,
						`${network}`,
						bicoDapps[network!.toString()].webHookId,
						nonce
					)
					console.log('response', response)
					if (!response) {
						return
					}

					// setCurrentStep(2)
					const { txFee: createGrantTxFee, receipt: createGrantTxReceipt } = await getTransactionDetails(response, network!.toString())
					await subgraphClients[network!].waitForBlock(createGrantTxReceipt?.blockNumber)

					setCurrentStepIndex(1)

					await chargeGas(workspace_Id, Number(createGrantTxFee), network!)


					setCurrentStepIndex(2)
					setCurrentStepIndex(3) // 3 is the final step

				} else {
					console.log('workspaceId not found')
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setCurrentStepIndex(3) // 3 is the final step
			const message = getErrorMessage(e)
			console.log('error', message)
			toastRef.current = toast({
				position: 'top',
				render: () => ErrorToast({
					content: message,
					close: () => {
						if (toastRef.current) {
							toast.close(toastRef.current)
						}
					},
				}),
			})
		}
	}, [biconomyWalletClient, workspaceId, domainName, accountDataWebwallet, allApplicantDetails, link, doc, rubrics, amount, payoutMode, reviewMechanism, startDate, network, biconomy, targetContractObject, scwAddress, webwallet, nonce, selectedSafeNetwork])

	// create grant
	// 1. upload document to ipfs
	// const createGrant = async () => {

	// 	try {
	// 		let fileIPFSHash = ''
	// 		if (doc) {
	// 			const fileCID = await uploadToIPFS(doc[0]!)
	// 			logger.info('fileCID', fileCID)
	// 			fileIPFSHash = fileCID.hash
	// 		}

	// 		// 2. validate grant data
	// 		let payout: string
	// 		console.log('payout type', payoutMode)
	// 		if (payoutMode! === 'in one go') {
	// 			payout = 'in-one-go'
	// 		} else if (payoutMode! === 'based on milestone') {
	// 			payout = 'milestones'
	// 		}

	// 		let review: string
	// 		if (reviewMechanism === 'Voting') {
	// 			review = 'voting'
	// 		} else if (reviewMechanism === 'Rubric') {
	// 			review = 'rubrics'
	// 		}

	// 		let fields: { field: {} }
	// 		if (allApplicantDetails) {
	// 			fields = { field: allApplicantDetails[0] }
	// 			console.log('fields', fields.field)
	// 		}

	// 		console.log('review type', reviewMechanism)
	// 		console.log('end date', endDate)
	// 		const ipfsHash = await validateAndUploadToIpfs('GrantCreateRequest', {
	// 			title: proposalName!,
	// 			startDate: startDate!,
	// 			endDate: endDate!,
	// 			// details: allApplicantDetails!,
	// 			link: link!,
	// 			docIpfsHash: fileIPFSHash,
	// 			reward: {
	// 				asset: USD_ASSET!,
	// 				committed: amount.toString()!,
	// 				token: {
	// 					label: 'USD',
	// 					address: USD_ASSET!,
	// 					decimal: USD_DECIMALS.toString(),
	// 					iconHash: USD_ICON
	// 				}
	// 			},
	// 			payoutType: payout!,
	// 			reviewType: review!,
	// 			creatorId: accountDataWebwallet!.address!,
	// 			workspaceId: workspaceId!,
	// 			fields: allApplicantDetails,
	// 		})

	// 		console.log('ipfsHash', ipfsHash)
	// 		console.log('rubrics', rubrics)

	// 		let rubricHash = ''
	// 		if (reviewMechanism === 'Rubrics') {
	// 			const { hash: auxRubricHash } = await validateAndUploadToIpfs('RubricSetRequest', {
	// 				rubric: rubrics,
	// 			})

	// 			if (auxRubricHash) {
	// 				rubricHash = auxRubricHash || ''
	// 			}
	// 		}


	// 		const methodArgs = [
	// 			workspaceId || Number(workspaceId).toString(),
	// 			ipfsHash,
	// 			rubricHash,
	// 			numberOfReviewers,
	// 			WORKSPACE_REGISTRY_ADDRESS[network!],
	// 			APPLICATION_REGISTRY_ADDRESS[network!],
	// 		]

	// 		console.log('methodArgs', methodArgs)
	// 		const response = await sendGaslessTransaction(
	// 			biconomy,
	// 			grantContract,
	// 			'createGrant',
	// 			methodArgs,
	// 			grantContract.address,
	// 			biconomyWalletClient!,
	// 			scwAddress!,
	// 			webwallet,
	// 			`${network}`,
	// 			bicoDapps[network!.toString()].webHookId,
	// 			nonce
	// 		)
	// 		console.log('response', response)
	// 		if (!response) {
	// 			return
	// 		}

	// 		// setCurrentStep(2)
	// 		const { txFee, receipt } = await getTransactionDetails(response, network!.toString())
	// 		await subgraphClients[network!].waitForBlock(receipt?.blockNumber)

	// 		// setCurrentStep(3)

	// 		await chargeGas(Number(workspaceId || Number(workspaceId).toString()), Number(txFee), network!)
	// 		setCurrentStepIndex(1)
	// 		// const CACHE_KEY = strings.cache.create_grant
	// 		// const cacheKey = `${network || getSupportedChainIdFromWorkspace(workspace)}-${CACHE_KEY}-${workspace?.id}`
	// 		// console.log('Deleting key: ', cacheKey)
	// 		// if(typeof window !== 'undefined') {
	// 		// 	localStorage.removeItem(cacheKey)
	// 		// }

	// 		// setTransactionData(receipt)
	// 		// setLoading(false)
	// 		// setCurrentStep(5)

	// 	} catch (e: any) {
	// 		setCurrentStepIndex(3) // 3 is the final step
	// 		const message = getErrorMessage(e)
	// 		toastRef.current = toast({
	// 			position: 'top',
	// 			render: () => ErrorToast({
	// 				content: message,
	// 				close: () => {
	// 					if (toastRef.current) {
	// 						toast.close(toastRef.current)
	// 					}
	// 				},
	// 			}),
	// 		})
	// 	}
	// }

	// 3. create grant


	return buildComponent()
}

RequestProposal.getLayout = function (page: ReactElement) {
	return (
		<NavbarLayout renderSidebar={false}>
			{page}
		</NavbarLayout>
	)
}

export default RequestProposal