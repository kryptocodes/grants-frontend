import { ReactElement } from 'react'
import { TokenDetailsInterface } from '@questbook/supported-safes/lib/types/Safe'
import {
	ApplicationState,
	GetCommentsQuery,
	GetPayoutsQuery,
	GetProposalsQuery,
	RubricItem,
} from 'src/generated/graphql'
import { PIIForCommentType } from 'src/libraries/utils/types'

export type CommentMap = {[key: string]: CommentType[]}

export type DashboardContextType = {
  proposals: Proposals
  selectedProposals: Set<string>
  setSelectedProposals: (set: Set<string>) => void
  review: ReviewInfo | undefined
  setReview: (reviews: ReviewInfo) => void
  showSubmitReviewPanel: boolean
  setShowSubmitReviewPanel: (show: boolean) => void
  areCommentsLoading: boolean
  commentMap: CommentMap
  setCommentMap: (coments: CommentMap) => void
  refreshComments: (refresh: boolean) => void
  filterState: ApplicationState | undefined
  setFilterState: (state: ApplicationState | undefined) => void
};

// export interface TokenInfo {
//   tokenIcon: string
//   tokenName: string
//   symbol: string
//   tokenValueAmount: number
//   usdValueAmount: number
//   mintAddress: string
//   info: {
//     decimals: number
//     tokenAddress: string
//     fiatConversion: number
//   }
//   fiatConversion: number
// }

export type FundBuilderContextType = {
  tokenList?: TokenDetailsInterface[]
  setTokenList: (tokenList: TokenDetailsInterface[]) => void
  selectedTokenInfo?: TokenDetailsInterface
  setSelectedTokenInfo: (tokenInfo: TokenDetailsInterface) => void
  amounts: number[]
  setAmounts: (amount: number[]) => void
  tos: string[]
  setTos: (to: string[]) => void
  milestoneIndices: number[]
  setMilestoneIndices: (milestoneIndex: number[]) => void

  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  isDrawerOpen: boolean
  setIsDrawerOpen: (isOpen: boolean) => void

  signerVerifiedState: SignerVerifiedState
  setSignerVerifiedState: (state: SignerVerifiedState) => void
};

export type ModalContextType = {
  isFundingMethodModalOpen: boolean
  setIsFundingMethodModalOpen: (isOpen: boolean) => void
  isSendAnUpdateModalOpen: boolean
  setIsSendAnUpdateModalOpen: (isOpen: boolean) => void
  isLinkYourMultisigModalOpen: boolean
  setIsLinkYourMultisigModalOpen: (isOpen: boolean) => void
};

export type ReviewData = {
  rubric: RubricItem
  rating: number
  comment: string
};
export type ReviewInfo = {
  isApproved?: boolean
  createdAtS?: number
  reviewer?: string
  items?: ReviewData[]
  total?: number
};

export type Proposals = Exclude<
  GetProposalsQuery['grantApplications'],
  null | undefined
>;
export type ProposalType = Proposals[number];
export type PayoutsType = Exclude<
  GetPayoutsQuery['fundsTransfers'],
  null | undefined
>;
export type Payout = PayoutsType[number];

export type SignerVerifiedState = 'unverified' | 'initiate_verification' | 'verifying'| 'failed' | 'verified' | 'transaction_initiated' | 'initiate_TON_transaction' | 'transaction_done_wallet'

export type CommentType = Exclude<
  GetCommentsQuery['comments'],
  null | undefined
>[number] & PIIForCommentType;

export type TagType = {
  id: string
  title: string
  icon: ReactElement
  isPrivate: boolean
  commentString: string
}

export type DynamicData = {
	title: string
	description: string
}