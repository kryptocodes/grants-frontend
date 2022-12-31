import React from 'react'
import {
	IconButton,
	Image,
	Menu as MenuComponent,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
} from '@chakra-ui/react'
import copy from 'copy-to-clipboard'
import { SupportedChainId } from 'src/constants/chains'

interface Props {
  grantID: string
  chainId: SupportedChainId | undefined
  onArchiveGrantClick: () => void
  isArchived: boolean
  numOfApplicants: number
  onViewApplicantsClick: (() => void) | undefined
  onEditClick: (() => void) | undefined
  isAdmin: boolean
}

interface MenuItemProps {
  iconPath: string
  iconWidth?: string | number
  iconHeight?: string | number
  text: string
  onClick: () => void
}

function YourGrantMenu({
	grantID,
	chainId,
	onArchiveGrantClick,
	isArchived,
	numOfApplicants,
	onViewApplicantsClick,
	onEditClick,
	isAdmin,
}: Props) {
	const [copied, setCopied] = React.useState(false)

	const defaultItems: MenuItemProps[] = [
		{
			iconPath: '/ui_icons/share_brand.svg',
			iconWidth: '15px',
			iconHeight: '15px',
			text: copied ? 'Link Copied!' : 'Share grant link',
			onClick: () => {
				const href = window.location.href.split('/')
				const protocol = href[0]
				const domain = href[2]
				copy(
					`${protocol}//${domain}/proposal_form/?grantId=${grantID}&chainId=${chainId}`,
				)
				setCopied(true)
			},
		},
	]

	const adminItems: MenuItemProps[] = []

	const archivedItems: MenuItemProps[] = [
		{
			iconPath: '/ui_icons/view_applicants.svg',
			text: numOfApplicants > 0 ? 'View proposals' : 'Edit grant',
			onClick: () => (numOfApplicants > 0
				? onViewApplicantsClick?.()
				: onEditClick?.()),
		},
	]
	const nonArchivedItems: MenuItemProps[] = [
		{
			iconPath: '/ui_icons/archive_grant.svg',
			text: 'Archive grant',
			onClick: () => onArchiveGrantClick?.(),
		},
	]

	// eslint-disable-next-line no-nested-ternary
	const items = isAdmin
		? isArchived
			? [...defaultItems, ...adminItems, ...archivedItems]
			: [...defaultItems, ...adminItems, ...nonArchivedItems]
		: [...defaultItems, ...archivedItems]

	return (
		<MenuComponent
			closeOnSelect={false}
			placement='left'
			onClose={() => setCopied(false)}
		>
			<MenuButton
				as={IconButton}
				aria-label='View More Options'
				icon={
					<Image
						h={4}
						w={4}
						src='/ui_icons/more.svg' />
				}
				variant='link'
				mx={0}
				minW={0}
			/>
			<MenuList
				minW='164px'
				p={0}>
				{
					items.map((item) => (
						<MenuItem
							key={item.text}
							onClick={item.onClick}
							py='12px'
							px='16px'>
							<Text
								fontSize='14px'
								fontWeight='400'
								lineHeight='20px'
								color='#122224'
								display='flex'
								alignItems='center'
							>
								<Image
									mr={18}
									display='inline-block'
									h={item.iconHeight || '20px'}
									w={item.iconWidth || '20px'}
									src={item.iconPath}
								/>
								{item.text}
							</Text>
						</MenuItem>
					))
				}
			</MenuList>
		</MenuComponent>
	)
}

export default YourGrantMenu
