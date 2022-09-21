import React, { useEffect } from 'react'
import { ApiClientsContext } from 'pages/_app'
import { useGetNumberOfApplicationsQuery } from 'src/generated/graphql'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import { useMultiChainQuery } from 'src/hooks/useMultiChainQuery'

type Tabs = 'DISCOVER' | 'MY_APPLICATIONS' | 'DASHBOARD' | 'GRANTS_AND_BOUNTIES' | 'SAFE' | 'APPS' | 'SETTINGS' | 'PAYOUTS'

const TAB_INDEXES: {[_ in Tabs]: number} = {
	DISCOVER: 0,
	MY_APPLICATIONS: 1,
	DASHBOARD: 2,
	GRANTS_AND_BOUNTIES: 3,
	SAFE: 4,
	APPS: 5,
	SETTINGS: 6,
	PAYOUTS: 7,
}

export type TabType = keyof typeof TAB_INDEXES

const TABS = [
	{ id: 'discover', index: TAB_INDEXES.DISCOVER, name: 'Discover', path: '/browse_dao' },
	{ id: 'my_applications', index: TAB_INDEXES.MY_APPLICATIONS, name: 'My Proposals', path: '/your_applications' },
	{ id: 'dashboard', index: TAB_INDEXES.DASHBOARD, name: 'Stats', path: '/dashboard' },
	{ id: 'grants_and_bounties', index: TAB_INDEXES.GRANTS_AND_BOUNTIES, name: 'Grants', path: '/your_grants' },
	{ id: 'safe', index: TAB_INDEXES.SAFE, name: 'Multisig Wallet', path: '/safe' },
	{ id: 'settings', index: TAB_INDEXES.SETTINGS, name: 'Profile', path: '/manage_dao' },
]

function useGetTabs() {
	const { data: accountData } = useQuestbookAccount()
	const { workspace } = React.useContext(ApiClientsContext)!

	const [applicationCount, setApplicationCount] = React.useState(0)

	const { results, fetchMore } = useMultiChainQuery({
		useQuery: useGetNumberOfApplicationsQuery,
		options: {
			variables: {
				applicantId: accountData?.address ?? '',
			}
		}
	})

	useEffect(() => {
		if(accountData?.address) {
			fetchMore({ applicantId: accountData?.address }, true)
		}
	}, [accountData?.address])

	useEffect(() => {
		setApplicationCount(results.length)
	}, [results])

	if(!workspace || !workspace.id) {
		// Pure applicant
		return [ [TABS[0], TABS[1]], [] ]
	} else {
		const member = workspace.members.find((m) => m.actorId.toLowerCase() === accountData?.address?.toLowerCase())
		if(!member) {
			return [[], []]
		}

		if(member.accessLevel === 'admin' || member.accessLevel === 'owner') {
			if(applicationCount > 0) {
				// Owner or admin with applicants
				return [ TABS.slice(0, 2), TABS.slice(2, 7) ]
			} else {
				// Owner or admin without applicants
				return [ TABS.slice(0, 1), TABS.slice(2, 7) ]
			}
		} else {
			if(applicationCount > 0) {
				// Reviewer with applicants
				return [ TABS.slice(0, 2), [TABS[3]] ]
			} else {
				// Reviewer without applicants
				return [ TABS.slice(0, 1), [TABS[3]] ]
			}
		}
	}
}

export { useGetTabs, TAB_INDEXES, TABS }
