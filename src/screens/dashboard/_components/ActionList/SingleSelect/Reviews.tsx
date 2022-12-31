import { RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Checkbox, Divider, Flex, Image, InputGroup, InputRightElement, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger, Text } from '@chakra-ui/react'
import logger from 'src/libraries/logger'
import { ApiClientsContext, WebwalletContext } from 'src/pages/_app'
import DashboardInput from 'src/screens/dashboard/_components/DashboardInput'
import useAssignReviewers from 'src/screens/dashboard/_hooks/useAssignReviewers'
import useSetRubrics from 'src/screens/dashboard/_hooks/useSetRubrics'
import { ProposalType } from 'src/screens/dashboard/_utils/types'
import { DashboardContext } from 'src/screens/dashboard/Context'
import { IReviewFeedback, ReviewType } from 'src/types'
import { RubricItem } from 'src/types/gen'
import getAvatar from 'src/utils/avatarUtils'
import { formatAddress } from 'src/utils/formattingUtils'
import { getUrlForIPFSHash } from 'src/utils/ipfsUtils'
import { useLoadReview } from 'src/utils/reviews'

function Reviews() {
	const buildComponent = () => {
		return (
			<Flex
				px={5}
				py={4}
				direction='column'
				align='stretch'
				w='100%'>
				<Flex
					justify='space-between'
					onClick={
						() => {
							if(proposals?.length > 0) {
								setExpanded(!expanded)
							}
						}
					}>
					<Text fontWeight='500'>
						Reviews
					</Text>
					{
						proposals?.length > 0 && (
							<Image
								mr={2}
								src='/v2/icons/dropdown.svg'
								transform={expanded ? 'rotate(180deg)' : 'rotate(0deg)'}
								alt='options'
								cursor='pointer'
							/>
						)
					}
				</Flex>

				<Flex
					display={expanded ? 'block' : 'none'}
					direction='column'>
					{reviewer()}
					{reviewWith()}
					{
						(proposal?.applicationReviewers?.length || 0) > 0 && (
							<Text
								mt={4}
								variant='v2_metadata'
								color='gray.5'
								fontWeight='500'>
								REVIEWER EVALUATION
							</Text>
						)
					}

					{(proposal?.applicationReviewers?.length || 0) > 0 && voteGraph()}

					{
						proposal?.applicationReviewers?.map((reviewer, index) => {
							return reviewerItem(reviewer?.member, reviews.find(r => r.reviewer === reviewer?.member.actorId), index)
						})
					}
				</Flex>
			</Flex>
		)
	}

	const voteGraph = () => {
		const votes = reviews.filter(r => r.items?.[0]?.rubric?.maximumPoints === 1)
		const forVotes = votes.filter(v => v.items?.[0]?.rating === 1).length
		const againstVotes = votes.filter(v => v.items?.[0]?.rating === 0).length
		return (
			<Flex
				direction='column'
				mt={2}>
				<Flex
					w='100%'
					justify='space-between'>
					{
						[forVotes, againstVotes].map((vote, index) => {
							return (
								<Flex
									direction='column'
									align={index === 0 ? 'start' : 'end'}
									key={index}>
									<Text
										variant='v2_subheading'
										fontWeight='500'>
										{vote}
									</Text>
									<Text
										mt={1}
										variant='v2_body' >
										{index === 0 ? 'For' : 'Against'}
									</Text>
								</Flex>
							)
						})
					}
				</Flex>
				<Flex
					w='100%'
					mt={2}
					h='12px'>
					<Flex
						bg='accent.june'
						w={`${(forVotes / votes.length) * 100}%`}
						h='100%' />
					<Flex
						bg='accent.royal'
						w={`${100 - ((forVotes / votes.length) * 100)}%`}
						h='100%' />
				</Flex>
			</Flex>
		)
	}

	const setupButton = () => {
		return (
			<Button variant='link' >
				<Text
					variant='v2_body'
					fontWeight='500'
					color='black.1'>
					Setup
				</Text>
			</Button>
		)
	}

	const editButton = () => {
		return (
			<Button
				ml={2}
				variant='link'
				leftIcon={
					<Image
						src='/v2/icons/pencil.svg'
						boxSize='16px' />
				}>
				<Text
					variant='v2_body'
					fontWeight='500'>
					Edit
				</Text>
			</Button>
		)
	}

	const assignReviewerPopup = (popoverRef: RefObject<HTMLButtonElement>, type: 'setup' | 'edit') => {
		return (
			<Popover
				isLazy
				placement='top-start'
				initialFocusRef={popoverRef}
			>
				{
					({ onClose }) => (
						<>
							<PopoverTrigger>
								{type === 'setup' ? setupButton() : editButton()}
							</PopoverTrigger>
							<PopoverContent>
								<PopoverArrow />
								<PopoverBody
									maxH='80vh'
									overflowY='auto'
									px={4}
									py={3} >
									<Text
										variant='v2_body'
										fontWeight='500'>
										Assign Reviewers
									</Text>
									<DashboardInput
										value={numberOfReviewersPerApplication ? numberOfReviewersPerApplication : ''}
										placeholder='Number of reviewers per application'
										onChange={
											(e) => {
												if(!e.target.value) {
													setNumberOfReviewersPerApplication(undefined)
													return
												}

												const val = parseInt(e.target.value)
												if(val > 0) {
													setNumberOfReviewersPerApplication(val)
												}
											}
										}
										type='number' />
									<Text
										mt={6}
										variant='v2_body'
										fontWeight='500'>
										Select Members
									</Text>
									<DashboardInput
										value={searchMemberName}
										placeholder='Search member by name'
										onChange={
											(e) => {
												setSearchMemberName(e.target.value)
											}
										} />
									<Flex
										mt={3}
										w='100%'>
										<Checkbox
											isChecked={workspace?.members?.every(m => members[m.id])}
											onChange={
												(e) => {
													logger.info({ checked: e.target.checked }, 'checkbox changed')
													if(e.target.checked) {
														const newMap: { [key: string]: boolean } = {}
														workspace?.members?.forEach(m => {
															newMap[m.id] = true
														})
														setMembers(newMap)
													} else {
														setMembers({})
													}
												}
											}>
											<Text
												variant='v2_body'
												fontWeight='400'
												color='gray.6'>
												Select All
											</Text>
										</Checkbox>
										<Text
											ml='auto'
											variant='v2_body'>
											{workspace?.members?.filter(m => members[m.id]).length}
											{' '}
											/
											{' '}
											{workspace?.members?.length}
											{' '}
											selected
										</Text>
									</Flex>
									<Flex
										direction='column'
										w='100%'
										pt={2}>
										{
											workspace?.members?.filter(m => searchMemberName === '' || m.fullName?.indexOf(searchMemberName) !== -1).map(m => {
												return (
													<Flex
														key={m.id}
														align='center'
														borderBottom='1px solid #E7E4DD'
														py={3}>
														<Checkbox
															isChecked={m.id in members}
															onChange={
																() => {
																	const newMap = { ...members }
																	if(m.id in members) {
																		delete newMap[m.id]
																	} else {
																		newMap[m.id] = true
																	}

																	setMembers(newMap)
																}
															} />
														<Image
															ml={4}
															borderRadius='3xl'
															src={m?.profilePictureIpfsHash ? getUrlForIPFSHash(m.profilePictureIpfsHash) : getAvatar(false, m?.actorId?.toLowerCase())}
															boxSize='20px' />
														<Text
															ml={4}
															variant='v2_body'>
															{m.fullName ? m.fullName : formatAddress(m?.actorId)}
														</Text>
													</Flex>
												)
											})
										}
									</Flex>
									<Flex mt={6}>
										<Button
											variant='primaryMedium'
											isDisabled={networkTransactionModalStep !== undefined}
											onClick={
												() => {
													if(numberOfReviewersPerApplication) {
														assignReviewers(Object.keys(members).map(m => m.split('.')[1]), numberOfReviewersPerApplication)
													}
												}
											}>
											<Text
												variant='v2_body'
												color='white'
												fontWeight='500'>
												Enable
											</Text>
										</Button>
										<Button
											ml={2}
											variant='primaryMedium'
											bg='white'
											border='1px solid #E7E4DD'
											borderRadius='2px'
											onClick={onClose}>
											<Text variant='v2_body'>
												Cancel
											</Text>
										</Button>
									</Flex>
								</PopoverBody>
							</PopoverContent>
						</>
					)
				}
			</Popover>
		)
	}

	const reviewer = () => {
		return (
			<Flex
				mt={5}
				w='100%'>
				<Text
					w='50%'
					variant='v2_body'
					color='gray.6'>
					Reviewer
				</Text>
				{
					(selectedGrant?.numberOfReviewersPerApplication || 0) > 0 && (
						<Text
							variant='v2_body'>
							{selectedGrant?.numberOfReviewersPerApplication}
						</Text>
					)
				}
				{(selectedGrant?.numberOfReviewersPerApplication || 0) > 0 && <Box ml='auto' />}
				{assignReviewerPopup(assignReviewerPopoverRef, selectedGrant?.numberOfReviewersPerApplication ? 'edit' : 'setup')}
			</Flex>
		)
	}

	const reviewTypeCheckbox = (type: ReviewType, label: string) => {
		return (
			<Checkbox
				isChecked={reviewType === type}
				onChange={
					(e) => {
						if(e.target.checked) {
							setReviewType(type)
						}
					}
				}
				mt={3}>
				<Text
					variant='v2_body'
					fontWeight='500'>
					{label}
				</Text>
			</Checkbox>
		)
	}

	const rubricItem = (item: RubricItem, index: number) => {
		return (
			<Flex
				key={index}
				py={3}
				borderBottom='1px solid #E7E4DD'>
				<Text variant='v2_body'>
					{item.title}
				</Text>
				<Image
					ml='auto'
					src='/v2/icons/delete.svg'
					boxSize='16px'
					cursor='pointer'
					onClick={
						() => {
							if(rubricItems.length > 1) {
								const copy = [...rubricItems]
								setRubricItems(copy.filter((r, i) => i !== index))
							}
						}
					} />
			</Flex>
		)
	}

	const setReviewTypePopup = (popoverRef: RefObject<HTMLButtonElement>, type: 'setup' | 'edit') => {
		return (
			<Popover
				isLazy
				placement='bottom'
				initialFocusRef={popoverRef}>
				{
					({ onClose }) => (
						<>
							<PopoverTrigger>
								{type === 'setup' ? setupButton() : editButton()}
							</PopoverTrigger>
							<PopoverContent>
								<PopoverArrow />
								<PopoverBody
									maxH='80vh'
									overflowY='auto'
									px={4}
									py={3} >
									<Text
										variant='v2_body'
										fontWeight='500'>
										Review By
									</Text>
									<Divider mt={3} />

									{reviewTypeCheckbox(ReviewType.Voting, 'Voting')}

									<Divider mt={3} />

									{reviewTypeCheckbox(ReviewType.Rubrics, 'Rubrics')}

									<Divider mt={3} />

									{
										reviewType === ReviewType.Rubrics && (rubricItems.length > 0 || anotherRubricTitle !== undefined) && (
											<Text
												mt={6}
												variant='v2_body'
												fontWeight='500'>
												Rubric Includes
											</Text>
										)
									}

									{reviewType === ReviewType.Rubrics && rubricItems?.map(rubricItem)}

									{
										reviewType === ReviewType.Rubrics && anotherRubricTitle !== undefined && (
											<InputGroup>
												<DashboardInput
													mt={3}
													variant='unstyled'
													border='none'
													borderBottom='1px solid #E7E4DD'
													borderRadius={0}
													value={anotherRubricTitle}
													onChange={
														(e) => {
															setAnotherRubricTitle(e.target.value)
														}
													}

												/>
												<InputRightElement>
													<Image
														src='/v2/icons/delete.svg'
														cursor='pointer'
														onClick={
															() => {
																setAnotherRubricTitle(undefined)
															}
														}
														boxSize='16px' />
													<Box
														mx={2} />
													<Image
														src='/v2/icons/check double.svg'
														cursor='pointer'
														onClick={
															() => {
																const copy = [...rubricItems, { title: anotherRubricTitle, description: '', maximumPoints: 5 }]
																setRubricItems(copy)
																setAnotherRubricTitle(undefined)
															}
														}
														boxSize='16px' />
												</InputRightElement>
											</InputGroup>

										)
									}

									{
										reviewType === ReviewType.Rubrics && anotherRubricTitle === undefined && (
											<Button
												mt={3}
												variant='link'
												onClick={() => setAnotherRubricTitle('')}>
												<Text
													variant='v2_body'
													fontWeight='500'>
													{rubricItems.length === 0 ? 'Start adding Rubric' : 'Add Another'}
												</Text>
											</Button>
										)
									}

									{reviewType === ReviewType.Rubrics && <Divider mt={3} />}

									<Checkbox
										mt={3}
										isChecked={isReviewPrivate}
										onChange={
											(e) => {
												setIsReviewPrivate(e.target.checked)
											}
										}>
										<Text
											variant='v2_body'
											fontWeight='500'>
											Keep reviews private
										</Text>
									</Checkbox>

									<Flex mt={4}>
										<Button
											variant='primaryMedium'
											isDisabled={networkTransactionModalStep !== undefined}
											onClick={
												() => {
													logger.info({ reviewType, isReviewPrivate, rubricItems }, 'setRubrics')
													setRubrics(reviewType, isReviewPrivate, rubricItems)
												}
											}>
											<Text
												variant='v2_body'
												color='white'
												fontWeight='500'>
												Save
											</Text>
										</Button>
										<Button
											ml={2}
											variant='primaryMedium'
											bg='white'
											border='1px solid #E7E4DD'
											borderRadius='2px'
											onClick={onClose}>
											<Text variant='v2_body'>
												Cancel
											</Text>
										</Button>
									</Flex>
								</PopoverBody>
							</PopoverContent>
						</>
					)
				}
			</Popover>
		)
	}

	const reviewWith = () => {
		return (
			<Flex
				mt={4}
				w='100%'>
				<Text
					w='50%'
					variant='v2_body'
					color='gray.6'>
					Review With
				</Text>
				{
					selectedGrant?.reviewType && (
						<Text
							variant='v2_body'>
							{selectedGrant.reviewType === 'rubrics' ? 'Rubrics' : 'Voting'}
						</Text>
					)
				}
				{selectedGrant?.reviewType && <Box ml='auto' />}
				{setReviewTypePopup(setReviewTypePopoverRef, selectedGrant?.reviewType ? 'edit' : 'setup')}
			</Flex>
		)
	}

	const reviewerItem = (reviewer: ProposalType['applicationReviewers'][number]['member'], review: IReviewFeedback | undefined, index: number) => {
		return (
			<Flex
				mt={index === 0 ? 5 : 3}
				direction='column'
				key={index}>
				<Flex
					w='100%'
					align='center'
					onClick={
						() => {
							const copy = [...reviewersExpanded]
							copy[index] = !reviewersExpanded[index]
							setReviewersExpanded(copy)
						}
					}>
					<Flex
						maxW={review?.items?.[0]?.rubric?.maximumPoints === 1 ? '100%' : '70%'}
						align='center'
					>
						<Image
							borderRadius='3xl'
							boxSize='28px'
							src={getAvatar(false, reviewer?.actorId)}
						/>
						<Text
							variant='v2_body'
							fontWeight='500'
							ml={3}
							noOfLines={3}>
							{reviewer?.fullName}
							{review?.items?.[0]?.rubric?.maximumPoints === 1 && ' voted'}
							{
								review?.items?.[0]?.rubric?.maximumPoints === 1 && (
									<Text
										ml={1}
										display='inline-block'
										variant='v2_body'
										fontWeight='600'
										color={review.items?.[0]?.rating === 0 ? 'accent.royal' : 'accent.june'}>
										{review.items?.[0]?.rating === 0 ? ' against' : ' for'}
									</Text>
								)
							}
						</Text>
					</Flex>

					<Box ml='auto' />

					{
						review && review.items?.[0]?.rubric?.maximumPoints > 1 && (
							<Flex
								align='center'
								justify='end'
							>
								<Image
									mr={2}
									src='/v2/icons/dropdown.svg'
									transform={reviewersExpanded[index] ? 'rotate(180deg)' : 'rotate(0deg)'}
									alt='options'
									cursor='pointer'
								/>
								<Text
									variant='v2_body'
									textAlign='right'
									fontWeight='500'>
									{review?.total}
									<Text
										ml={1}
										color='black.3'
										display='inline-block'>
										{' / '}
										{review?.items?.reduce((acc, item) => acc + item?.rubric?.maximumPoints, 0)}
									</Text>
								</Text>
							</Flex>
						)
					}

					{
						!review && reviewer.actorId.toLowerCase() !== scwAddress?.toLowerCase() && (
							<Text
								bg='gray.4'
								py={1}
								px={2}
								borderRadius='8px'
								color='black.3'
								variant='v2_metadata'
								fontWeight='500'>
								Pending
							</Text>
						)
					}

					{
						!review && reviewer.actorId.toLowerCase() === scwAddress?.toLowerCase() && (
							<Button variant='link'>
								<Text
									color='accent.azure'
									variant='v2_body'
									fontWeight='500'
									onClick={
										() => {
											setShowSubmitReviewPanel(true)
										}
									}>
									Review Proposal
								</Text>
							</Button>
						)
					}

				</Flex>

				<Flex
					mt={2}
					pl={1}
					display={reviewersExpanded[index] ? 'block' : 'none'}
					direction='column'>
					{
						review?.items?.map((item, index) => {
							return (
								<Flex
									key={index}
									mt={index === 0 ? 0 : 3}
									align='start'>
									<Flex direction='column'>
										<Text
											variant='v2_body'>
											{item?.rubric?.title}
										</Text>
										<Text
											variant='v2_metadata'
											color='gray.6'>
											{item?.rubric?.details}
										</Text>
									</Flex>

									<Text
										ml='auto'
										textAlign='right'
										variant='v2_body'>
										{item?.rating}
										<Text
											ml={1}
											color='black.3'
											display='inline-block'>
											{' / '}
											{item?.rubric?.maximumPoints}
										</Text>
									</Text>
								</Flex>
							)
						})
					}
				</Flex>
			</Flex>
		)
	}

	const { workspace, chainId } = useContext(ApiClientsContext)!
	const { scwAddress } = useContext(WebwalletContext)!
	const { proposals, selectedGrant, selectedProposals, setShowSubmitReviewPanel } = useContext(DashboardContext)!
	const { loadReview } = useLoadReview(selectedGrant?.id, chainId)

	const [expanded, setExpanded] = useState<boolean>(false)
	const [reviews, setReviews] = useState<IReviewFeedback[]>([])
	const [reviewersExpanded, setReviewersExpanded] = useState<boolean[]>([])

	const [networkTransactionModalStep, setNetworkTransactionModalStep] = useState<number>()
	const [, setTransactionHash] = useState<string>('')

	const assignReviewerPopoverRef = useRef<HTMLButtonElement>(null)
	const [numberOfReviewersPerApplication, setNumberOfReviewersPerApplication] = useState<number>()
	const [searchMemberName, setSearchMemberName] = useState<string>('')
	const [members, setMembers] = useState<{ [id: string]: boolean }>({})
	const { assignReviewers } = useAssignReviewers()

	const setReviewTypePopoverRef = useRef<HTMLButtonElement>(null)
	const [reviewType, setReviewType] = useState<ReviewType>(ReviewType.Rubrics)
	const [isReviewPrivate, setIsReviewPrivate] = useState<boolean>(false)
	const [rubricItems, setRubricItems] = useState<RubricItem[]>([])
	const [anotherRubricTitle, setAnotherRubricTitle] = useState<string>()
	const { setRubrics } = useSetRubrics({ setNetworkTransactionModalStep, setTransactionHash })

	useEffect(() => {
		if(selectedGrant?.numberOfReviewersPerApplication !== null) {
			setNumberOfReviewersPerApplication(selectedGrant?.numberOfReviewersPerApplication)
		}

		if(selectedGrant?.autoAssignReviewers) {
			const currMembers: {[key: string]: boolean} = {}
			logger.info('Current member state 1: ', currMembers)
			for(const reviewer of selectedGrant?.autoAssignReviewers) {
				currMembers[reviewer.id] = true
			}

			logger.info('Current member state 2: ', currMembers)

			setMembers(currMembers)
		}

		setReviewType(selectedGrant?.reviewType === 'voting' ? ReviewType.Voting : ReviewType.Rubrics)

		if(selectedGrant?.rubric?.items) {
			setRubricItems(selectedGrant?.rubric?.items)
		}

		if(selectedGrant?.rubric?.isPrivate !== undefined) {
			setIsReviewPrivate(selectedGrant?.rubric?.isPrivate)
		}
	}, [selectedGrant])

	useEffect(() => {
		if(proposals?.length === 0) {
			setExpanded(true)
		}
	}, [proposals])

	const proposal = useMemo(() => {
		const index = selectedProposals.indexOf(true)

		if(index !== -1) {
			return proposals[index]
		}
	}, [proposals, selectedProposals])

	useEffect(() => {
		setReviewersExpanded(Array(proposal?.applicationReviewers?.length).fill(false))
	}, [proposal])

	useEffect(() => {
		if(!proposal) {
			return
		}

		const decryptedReviews: Promise<IReviewFeedback>[] = []
		for(const review of proposal?.reviews || []) {
			decryptedReviews.push(loadReview(review, proposal?.id))
		}

		Promise.all(decryptedReviews).then((reviews) => {
			logger.info({ reviews }, 'Decrypted reviews')
			setReviews(reviews)
		})
	}, [])

	// const isDisabled = useMemo(() => {
	// 	if (selectedGrant?.numberOfReviewersPerApplication === numberOfReviewersPerApplication && Object.keys(members).length === selectedGrant?)
	// }, [numberOfReviewersPerApplication, members])

	return buildComponent()
}

export default Reviews