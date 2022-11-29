import { useContext, useMemo, useRef } from 'react'
import { Button, Flex, IconButton, Image, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger, Text } from '@chakra-ui/react'
import { DashboardContext } from 'src/screens/dashboard/Context'

function TopBar() {
	const buildComponent = () => {
		return (
			<Flex
				w='100%'
				h='64px'
				px={8}
				py={4}
				align='center'>
				<IconButton
					variant='ghost'
					aria-label='left-arrow'
					icon={<Image src={`/v2/icons/arrow left/${isLeftArrowEnabled ? 'enabled' : 'disabled'}.svg`} />}
					onClick={
						() => {
							setSelectedGrantIndex((selectedGrantIndex! - 1) % grants.length)
						}
					} />
				<IconButton
					variant='ghost'
					aria-label='right-arrow'
					icon={<Image src={`/v2/icons/arrow right/${isRightArrowEnabled ? 'enabled' : 'disabled'}.svg`} />}
					onClick={
						() => {
							setSelectedGrantIndex((selectedGrantIndex! + 1) % grants.length)
						}
					} />
				<Text
					ml={2}
					variant='subheading'
					fontWeight='500'>
					{selectedGrant?.title}
				</Text>
				<Text
					variant='body'
					fontWeight='500'
					ml={2}
					px={2}
					borderRadius='4px'
					bg={selectedGrant?.acceptingApplications ? 'accent.june' : 'accent.royal'}>
					{selectedGrant?.acceptingApplications ? 'OPEN' : 'CLOSED'}
				</Text>
				<Button
					ml={2}
					variant='link'
					color='black.1'
					leftIcon={
						<Image
							src='/v2/icons/pencil.svg'
							boxSize='16px' />
					}>
					<Text
						variant='body'
						fontWeight='500'>
						Edit
					</Text>
				</Button>
				{sharePopover()}
			</Flex>
		)
	}

	const sharePopover = () => {
		return (
			<Popover
				isLazy
				initialFocusRef={popoverRef}>
				{
					({ onClose }) => (
						<>
							<PopoverTrigger>
								{sharePopoverButton()}
							</PopoverTrigger>
							<PopoverContent>
								<PopoverArrow />
								<PopoverBody
									maxH='40vh'
									overflowY='auto'>
									{
										popoverBodyItem.map((item, index) => {
											return (
												<Flex
													py={3}
													px={4}
													key={index}
													direction='column'
													align='start'>
													<Text
														variant='body'
														fontWeight='500'>
														{item.title}
													</Text>
													<Text
														variant='body'
														mt={1}>
														{item.description}
													</Text>
													<Button
														justifyContent='flex-start'
														leftIcon={
															<Image
																src={item.buttonIcon}
																boxSize='20px' />
														}
														mt={4}
														variant='link'
														onClick={
															() => {
																onClose()
																item.onButtonClick()
															}
														}>
														<Text
															variant='body'
															color='accent.azure'>
															{item.buttonText}
														</Text>
													</Button>
												</Flex>
											)
										})
									}
								</PopoverBody>
							</PopoverContent>
						</>
					)
				}
			</Popover>
		)
	}

	const popoverBodyItem = [
		{
			title: 'Share',
			description: 'Attract builders with a link, or embed your stats on any website.',
			buttonIcon: '/v2/icons/copy/azure.svg',
			buttonText: 'Copy Link',
			onButtonClick: () => {}
		},
		{
			title: 'Embed',
			description: 'Add your stats and link to any website with embed.',
			buttonIcon: '/v2/icons/embed.svg',
			buttonText: 'Embed code',
			onButtonClick: () => {}
		}
	]

	const sharePopoverButton = () => {
		return (
			<Button
				ml='auto'
				variant='link'
				color='black.1'
				leftIcon={
					<Image
						src='/v2/icons/share forward.svg'
						boxSize='16px' />
				}>
				<Text
					variant='body'
					fontWeight='500'>
					Share
				</Text>
			</Button>
		)
	}

	const popoverRef = useRef<HTMLButtonElement>(null)
	const { selectedGrantIndex, setSelectedGrantIndex, grants } = useContext(DashboardContext)!

	const selectedGrant = useMemo(() => {
		if(!grants?.length || selectedGrantIndex === undefined || selectedGrantIndex >= grants?.length) {
			return
		}

		return grants[selectedGrantIndex]
	}, [selectedGrantIndex, grants])

	const isLeftArrowEnabled = useMemo(() => {
		if(!grants?.length || selectedGrantIndex === undefined) {
			return false
		}

		const index = grants.findIndex(grant => grant.id === selectedGrant?.id)
		return index > 0
	}, [selectedGrant])

	const isRightArrowEnabled = useMemo(() => {
		if(!grants?.length || selectedGrantIndex === undefined) {
			return false
		}

		const index = grants.findIndex(grant => grant.id === selectedGrant?.id)
		return index < grants.length - 1
	}, [selectedGrant])

	return buildComponent()
}

export default TopBar