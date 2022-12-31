import { useCallback, useContext, useMemo } from 'react'
import { APPLICATION_REVIEW_REGISTRY_ADDRESS } from 'src/constants/addresses'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { useBiconomy } from 'src/hooks/gasless/useBiconomy'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import logger from 'src/libraries/logger'
import { useGenerateReviewData } from 'src/libraries/utils/reviews'
import { ApiClientsContext, WebwalletContext } from 'src/pages/_app'
import { DashboardContext } from 'src/screens/dashboard/Context'
import { bicoDapps, getTransactionDetails, sendGaslessTransaction } from 'src/utils/gaslessUtils'

interface Props {
	setNetworkTransactionModalStep: (step: number | undefined) => void
	setTransactionHash: (hash: string) => void
}

function useSubmitReview({ setNetworkTransactionModalStep, setTransactionHash }: Props) {
	const { workspace, subgraphClients, chainId } = useContext(ApiClientsContext)!
	const { webwallet } = useContext(WebwalletContext)!

	const { selectedGrant, selectedProposals, proposals, review } = useContext(DashboardContext)!

	const applicationReviewRegistryContract = useQBContract('reviews', chainId)

	const { nonce } = useQuestbookAccount()
	const { biconomyDaoObj: biconomy, biconomyWalletClient, scwAddress, loading: biconomyLoading } = useBiconomy({
		chainId: chainId?.toString(),
	})

	const isBiconomyInitialised = useMemo(() => {
		return biconomy && biconomyWalletClient && scwAddress && !biconomyLoading && chainId && biconomy.networkId && biconomy.networkId.toString() === chainId.toString()
	}, [biconomy, biconomyWalletClient, scwAddress, biconomyLoading, chainId])

	const proposal = useMemo(() => {
		const index = selectedProposals.indexOf(true)

		if(index !== -1) {
			return proposals[index]
		}
	}, [proposals, selectedProposals])

	const { generateReviewData } = useGenerateReviewData({
		grantId: selectedGrant?.id!,
		applicationId: proposal?.id!,
		isPrivate: selectedGrant?.rubric?.isPrivate || false,
		chainId,
	})

	const submitReview = useCallback(async() => {
		try {
			if(!webwallet || !biconomyWalletClient || typeof biconomyWalletClient === 'string' || !scwAddress || !workspace?.id || !selectedGrant || !proposal?.id || !review) {
				return
			}

			logger.info({ review }, 'Review to be submitted')

			setNetworkTransactionModalStep(0)
			logger.info({ review }, 'useSubmitReview: (review)')

			const { ipfsHash } = await generateReviewData({ items: review?.items! })

			const methodArgs = [scwAddress, workspace.id, proposal.id, selectedGrant.id, ipfsHash]
			logger.info({ methodArgs }, 'useSubmitProposal: (Method args)')

			const response = await sendGaslessTransaction(
				biconomy,
				applicationReviewRegistryContract,
				'submitReview',
				methodArgs,
				APPLICATION_REVIEW_REGISTRY_ADDRESS[chainId],
				biconomyWalletClient,
				scwAddress,
				webwallet,
				`${chainId}`,
				bicoDapps[chainId].webHookId,
				nonce
			)
			logger.info({ response }, 'useSubmitReview: (Response)')

			// Step - 7: If the proposal is submitted successfully, then create the mapping between the email and the scwAddress
			if(response) {
				setNetworkTransactionModalStep(1)
				const { receipt, txFee } = await getTransactionDetails(response, chainId.toString())
				setTransactionHash(receipt?.transactionHash)
				setNetworkTransactionModalStep(2)

				logger.info({ receipt, txFee }, 'useSubmitReview: (Receipt)')
				await subgraphClients[chainId].waitForBlock(receipt?.blockNumber)
				setNetworkTransactionModalStep(3)
			} else {
				setNetworkTransactionModalStep(undefined)
			}
		} catch(e) {
			logger.error(e, 'useSubmitReview: (Error)')
			setNetworkTransactionModalStep(undefined)
		}
	}, [chainId, webwallet, biconomy, biconomyWalletClient, scwAddress, biconomyLoading, workspace, selectedGrant, proposal, review])

	return {
		submitReview: useMemo(() => {
			return submitReview
		}, [chainId, webwallet, biconomy, biconomyWalletClient, scwAddress, biconomyLoading, workspace, selectedGrant, proposal, review]), isBiconomyInitialised
	}
}

export default useSubmitReview