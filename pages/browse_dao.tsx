import { ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Divider, Flex, HStack, Text, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { WebwalletContext } from 'pages/_app'
import AllDaosGrid from 'src/components/browse_daos/all_daos'
import { GetDaOsForExploreQuery, useGetDaOsForExploreQuery, Workspace_Filter as WorkspaceFilter, Workspace_OrderBy as WorkspaceOrderBy } from 'src/generated/graphql'
import { useMultiChainPaginatedQuery } from 'src/hooks/useMultiChainPaginatedQuery'
import NavbarLayout from 'src/layout/navbarLayout'
import { extractInviteInfo, InviteInfo } from 'src/utils/invite'
import logger from 'src/utils/logger'
import { mergeSortedArrays } from 'src/utils/mergeSortedArrays'
import AcceptInviteModal from 'src/v2/components/AcceptInviteModal'

const PAGE_SIZE = 3

/**
 * Ah the browse DAOs page.
 * We've two sections here:
 * 1. Popular DAOs (either sort by number of applicants or the max award size)
 * 2. New DAOs -- sorted by most recent grant posted
 * @returns
 */
function BrowseDao() {
	const { scwAddress } = useContext(WebwalletContext)!

	const toast = useToast()
	const router = useRouter()

	const [inviteInfo, setInviteInfo] = useState<InviteInfo>()

	const { t } = useTranslation()

	const {
		results: newDaos,
		hasMore: hasMoreNewDaos,
		fetchMore: fetchMoreNewDaos,
	} = useMultiChainDaosForExplore(
		WorkspaceOrderBy.CreatedAtS,
		// only show DAOs that have created at least one grant
		// with at least 1 USD in funding promised
		// eslint-disable-next-line camelcase
		{ totalGrantFundingCommittedUSD_gt: 0 }
	)

	const {
		results: popularDaos,
		fetchMore: fetchMorePopularDaos
	} = useMultiChainDaosForExplore(
		WorkspaceOrderBy.TotalGrantFundingDisbursedUsd,
		// eslint-disable-next-line camelcase
		{ totalGrantFundingDisbursedUSD_gte: 1000 },
	)

	const {
		results: myDaos,
		fetchMore: fetchMoreMyDaos
	} = useMultiChainDaosForExplore(
		WorkspaceOrderBy.TotalGrantFundingDisbursedUsd,
		{ members_: { actorId: scwAddress } },
	)

	const totalDaos = useMemo(() => [
		...(scwAddress ? myDaos : []),
		...popularDaos,
	], [myDaos, popularDaos])

	useEffect(() => {
		try {
			const inviteInfo = extractInviteInfo()
			if(inviteInfo) {
				setInviteInfo(inviteInfo)
			}
		} catch(error) {
			toast({
				title: `Invalid invite "${(error as Error).message}"`,
				status: 'error',
				duration: 9000,
				isClosable: true,
			})
		}
	}, [])

	useEffect(() => {
		logger.info('fetching daos')
		fetchMoreNewDaos(true)
		fetchMorePopularDaos(true)
		if(scwAddress) {
			fetchMoreMyDaos(true)
		}
	}, [])

	useEffect(() => {
		if(scwAddress) {
			fetchMoreMyDaos(true)
		}
	}, [scwAddress])

	return (
		<>
			<Container
				maxWidth='1280px'
				w='100%'>
				<Flex
					my='16px'
					maxWidth='1280px'>
					<Text
						fontSize='24px'
						fontWeight='700'>
						{t('/.section_1.title')}
					</Text>
				</Flex>

				<AllDaosGrid
					renderGetStarted
					workspaces={totalDaos} />

				<HStack
					align='center'
					justify='stretch'
					my='16px'
					maxWidth='1280px'>
					<Text
						fontSize='24px'
						fontWeight='700'>
						{t('/.section_2.title')}
					</Text>

					<Divider />
				</HStack>

				<AllDaosGrid
					renderGetStarted={false}
					workspaces={newDaos}
					hasMore={hasMoreNewDaos}
					fetchMore={() => fetchMoreNewDaos()} />
			</Container>
			<AcceptInviteModal
				inviteInfo={inviteInfo}
				onClose={
					() => {
						setInviteInfo(undefined)
						window.history.pushState(undefined, '', '/')
						router.reload()
					}
				} />
		</>
	)
}

BrowseDao.getLayout = function(page: ReactElement) {
	return (
		<NavbarLayout>
			{page}
		</NavbarLayout>
	)
}

function useMultiChainDaosForExplore(
	orderBy: WorkspaceOrderBy,
	filter: WorkspaceFilter
) {
	return useMultiChainPaginatedQuery({
		useQuery: useGetDaOsForExploreQuery,
		pageSize: PAGE_SIZE,
		variables: { orderBy, filter },
		mergeResults(results) {
			let final: GetDaOsForExploreQuery['workspaces'] = []
			for(const { workspaces } of results) {
				// logger.info({ workspaces }, 'Browse DAO Workspaces')
				final = mergeSortedArrays(final, workspaces, (a, b) => {
					// @ts-ignore
					// basically, we use the order key to fetch the sorting property
					// and sort the results
					return b[orderBy] < a[orderBy]
				})
			}

			return final.filter((workspace) => {
				return !DAOS_TO_IGNORE.includes(workspace.id)
					&& workspace.supportedNetworks[0] !== 'chain_5'
			})
		}
	})
}

const DAOS_TO_IGNORE = [ '0xe9' ]

export default BrowseDao