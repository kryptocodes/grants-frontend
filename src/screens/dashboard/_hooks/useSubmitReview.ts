import { useContext, useMemo } from 'react'
import { defaultChainId } from 'src/constants/chains'
import useFunctionCall from 'src/libraries/hooks/useFunctionCall'
import logger from 'src/libraries/logger'
import { useGenerateReviewData } from 'src/libraries/utils/reviews'
import { getSupportedChainIdFromWorkspace } from 'src/libraries/utils/validations'
import { GrantsProgramContext, WebwalletContext } from 'src/pages/_app'
import { DashboardContext } from 'src/screens/dashboard/Context'

interface Props {
	setNetworkTransactionModalStep: (step: number | undefined) => void
	setTransactionHash: (hash: string) => void
}

function useSubmitReview({ setNetworkTransactionModalStep, setTransactionHash }: Props) {
	const { webwallet, scwAddress } = useContext(WebwalletContext)!
	const { grant } = useContext(GrantsProgramContext)!
	const { selectedProposals, proposals, review } = useContext(DashboardContext)!

	const chainId = useMemo(() => {
		return getSupportedChainIdFromWorkspace(grant?.workspace) ?? defaultChainId
	}, [grant])

	const proposal = useMemo(() => {
		return proposals.find(p => selectedProposals.has(p.id))
	}, [proposals, selectedProposals])

	const { call, isBiconomyInitialised } = useFunctionCall({ chainId, contractName: 'reviews', setTransactionStep: setNetworkTransactionModalStep, setTransactionHash })

	const { generateReviewData } = useGenerateReviewData({
		grantId: grant?.id!,
		applicationId: proposal?.id!,
		isPrivate: grant?.rubric?.isPrivate || false,
		chainId,
	})

	const submitReview = async() => {
		try {
			if(!webwallet || !isBiconomyInitialised || !scwAddress || !grant?.workspace?.id || !grant || !proposal?.id || !review) {
				return
			}

			const shouldAssignAndReview = proposal.applicationReviewers.find(reviewer => reviewer.member.actorId === scwAddress.toLowerCase()) === undefined
			logger.info({ review }, 'Review to be submitted')

			const { ipfsHash } = await generateReviewData({ items: review?.items! })

			const methodArgs = shouldAssignAndReview ? [grant?.workspace.id, proposal.id, grant.id, scwAddress, true, ipfsHash] : [grant?.workspace.id, proposal.id, grant.id, ipfsHash]
			logger.info({ methodArgs }, 'useSubmitProposal: (Method args)')

			const receipt = await call({ method: shouldAssignAndReview ? 'assignAndReview' : 'submitReview', args: methodArgs })

			if(!receipt) {
				throw new Error('useSubmitReview: (No receipt)')
			}
		} catch(e) {
			logger.error(e, 'useSubmitReview: (Error)')
			setNetworkTransactionModalStep(undefined)
		}
	}

	return {
		submitReview, isBiconomyInitialised
	}
}

export default useSubmitReview