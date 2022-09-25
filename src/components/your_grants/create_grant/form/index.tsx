/* eslint-disable @typescript-eslint/no-shadow */
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { Token } from '@questbook/service-validator-client'
import { convertFromRaw, convertToRaw, EditorState } from 'draft-js'
import Heading from 'src/components/ui/heading'
import Loader from 'src/components/ui/loader'
import Title from 'src/components/your_grants/create_grant/form/1_title'
import Details from 'src/components/your_grants/create_grant/form/2_details'
import ApplicantDetails from 'src/components/your_grants/create_grant/form/3_applicantDetails'
import GrantRewardsInput from 'src/components/your_grants/create_grant/form/4_rewards'
import applicantDetailsList from 'src/constants/applicantDetailsList'
import SAFES_ENDPOINTS_MAINNETS from 'src/constants/safesEndpoints.json'
import SAFES_ENDPOINTS_TESTNETS from 'src/constants/safesEndpointsTest.json'
import strings from 'src/constants/strings.json'
import { ApiClientsContext } from 'src/pages/_app'
import { getSupportedChainIdFromWorkspace } from 'src/utils/validationUtils'

const SAFES_ENDPOINTS = { ...SAFES_ENDPOINTS_MAINNETS, ...SAFES_ENDPOINTS_TESTNETS }
type ValidChainID = keyof typeof SAFES_ENDPOINTS;

function Form({
	onSubmit,
	hasClicked,
}: {
  onSubmit: (data: any) => void
  hasClicked: boolean
}) {
	const CACHE_KEY = strings.cache.create_grant
	const { workspace } = useContext(ApiClientsContext)!

	const [currentChain, setCurrentChain] = useState(
    	getSupportedChainIdFromWorkspace(workspace)!,
	)

	const [getKey, setGetKey] = useState(`${currentChain}-${CACHE_KEY}-${workspace?.id}`)

	const maxDescriptionLength = 300
	const [title, setTitle] = useState('')
	const [summary, setSummary] = useState('')

	const [titleError, setTitleError] = useState(false)
	const [summaryError, setSummaryError] = useState(false)

	const [details, setDetails] = useState(EditorState.createWithContent(convertFromRaw({
		entityMap: {},
		blocks: [{
			text: '',
			key: 'foo',
			type: 'unstyled',
			entityRanges: [],
		} as any],
	})))
	const [detailsError, setDetailsError] = useState(false)

	const [shouldEncrypt, setShouldEncrypt] = useState(false)
	const [admins, setAdmins] = useState<any[]>([])
	const [maximumPoints, setMaximumPoints] = useState(5)

	const applicantDetails = applicantDetailsList
		.map(({
			title, tooltip, id, inputType, isRequired,
		}, index) => {
			if(index === applicantDetailsList.length - 1) {
				return null
			}

			if(index === applicantDetailsList.length - 2) {
				return null
			}

			return {
				title,
				required: isRequired || false,
				id,
				tooltip,
				index,
				inputType,
			}
		})
		.filter((obj) => obj !== null)
	const [detailsRequired, setDetailsRequired] = useState(applicantDetails)
	// const [extraField, setExtraField] = useState(false);

	const [customFieldsOptionIsVisible, setCustomFieldsOptionIsVisible] = useState(false)
	const [customFields, setCustomFields] = useState<any[]>([
		{
			value: '',
			isError: false,
		},
	])
	const [multipleMilestones, setMultipleMilestones] = useState(false)
	const [milestoneSelectOptionIsVisible, setMilestoneSelectOptionIsVisible] = useState(false)
	const [defaultMilestoneFields, setDefaultMilestoneFields] = useState<any[]>([])

	const toggleDetailsRequired = (index: number) => {
		const newDetailsRequired = [...detailsRequired];
		// TODO: create interface for detailsRequired
		(newDetailsRequired[index] as any).required = !(
      newDetailsRequired[index] as any
		).required
		setDetailsRequired(newDetailsRequired)
	}

	const [rubricRequired, setRubricRequired] = useState(false)
	const [rubrics, setRubrics] = useState<any>([
		{
			name: '',
			nameError: false,
			description: '',
			descriptionError: false,
		},
	])

	const [shouldEncryptReviews, setShouldEncryptReviews] = useState(false)

	// const [extraFieldDetails, setExtraFieldDetails] = useState('');
	// const [extraFieldError, setExtraFieldError] = useState(false);

	// Grant Rewards and Deadline
	const [reward, setReward] = useState('')
	const [rewardToken, setRewardToken] = useState<Token>({
		label: '',
		address: '',
		decimal: '0',
		iconHash: '',
	})
	const [rewardError, setRewardError] = useState(false)

	const [rewardCurrency, setRewardCurrency] = useState('')
	const [rewardCurrencyAddress, setRewardCurrencyAddress] = useState('')

	const [date, setDate] = useState('')
	const [dateError, setDateError] = useState(false)

	const safeAddress = workspace?.safe?.address
	const safeNetwork = workspace?.safe?.chainId as ValidChainID
	const [oldDate, setOldDate] = React.useState(false)
	const isEVM = parseInt(safeNetwork) !== 900001
	let transactionServiceURL

	useEffect(() => {
		setCurrentChain(getSupportedChainIdFromWorkspace(workspace)!)
		setGetKey(`${currentChain}-${CACHE_KEY}-${workspace?.id}`)
	}, [workspace, currentChain])

	useEffect(() => {
		if(workspace?.members) {
			const adminAddresses = workspace.members
				.filter((member) => member.publicKey && member.publicKey !== '')
				.map((member) => member.actorId)
			setAdmins(adminAddresses)
		}
	}, [workspace])

	const handleOnSubmit = () => {
		let error = false
		if(!title || title.length <= 0) {
			setTitleError(true)
			error = true
		}

		if(!summary || summary.length <= 0) {
			setSummaryError(true)
			error = true
		}

		if(!details.getCurrentContent().hasText()) {
			setDetailsError(true)
			error = true
		}

		// if (extraField && extraFieldDetails.length <= 0) {
		//   setExtraFieldError(true);
		//   error = true;
		// }
		if(!reward || reward.length <= 0) {
			setRewardError(true)
			error = true
		}

		if(!date || date.length <= 0) {
			setDateError(true)
			error = true
		}

		const now = new Date()
		const todayDateString = `${now.getFullYear()}-${now.getMonth() + 1 < 10 ? '0' : ''}${now.getMonth() + 1}-${now.getDate()}`
		const today = new Date(todayDateString)
		if(new Date(date) < today) {
			setDateError(true)
			setOldDate(true)
			error = true
		}

		if(customFieldsOptionIsVisible) {
			const errorCheckedCustomFields = customFields.map((customField: any) => {
				const errorCheckedCustomField = { ...customField }
				if(customField.value.length <= 0) {
					errorCheckedCustomField.isError = true
					error = true
				}

				return errorCheckedCustomField
			})
			setCustomFields(errorCheckedCustomFields)
		}

		if(defaultMilestoneFields.length > 0) {
			const errorCheckedDefaultMilestoneFields = defaultMilestoneFields.map(
				(defaultMilestoneField: any) => {
					const errorCheckedDefaultMilestoneField = {
						...defaultMilestoneField,
					}
					if(defaultMilestoneField.value.length <= 0) {
						errorCheckedDefaultMilestoneField.isError = true
						error = true
					}

					return errorCheckedDefaultMilestoneField
				},
			)
			setDefaultMilestoneFields(errorCheckedDefaultMilestoneFields)
		}

		if(rubricRequired) {
			const errorCheckedRubrics = rubrics.map((rubric: any) => {
				const errorCheckedRubric = { ...rubric }
				if(rubric.name.length <= 0) {
					errorCheckedRubric.nameError = true
					error = true
				}

				if(rubric.description.length <= 0) {
					errorCheckedRubric.descriptionError = true
					error = true
				}

				return errorCheckedRubric
			})
			setRubrics(errorCheckedRubrics)
		}

		if(!error) {
			const detailsString = JSON.stringify(
				convertToRaw(details.getCurrentContent()),
			)

			const requiredDetails = {} as any
			detailsRequired.forEach((detail) => {
				if(detail?.required) {
					requiredDetails[detail.id] = {
						title: detail.title,
						inputType: detail.inputType,
					}
				}
			})
			const fields = { ...requiredDetails }

			const rubric = {} as any

			if(rubricRequired) {
				rubrics.forEach((r: any, index: number) => {
					rubric[index.toString()] = {
						title: r.name,
						details: r.description,
						maximumPoints,
					}
				})
			}

			if(multipleMilestones) {
				fields.isMultipleMilestones = {
					title: 'Milestones',
					inputType: 'array',
				}
			}

			if(fields.teamMembers) {
				fields.memberDetails = {
					title: 'Member Details',
					inputType: 'array',
				}
			}

			if(fields.fundingBreakdown) {
				fields.fundingAsk = {
					title: 'Funding Ask',
					inputType: 'short-form',
				}
			}

			if(shouldEncrypt) {
				if(fields.applicantEmail) {
					fields.applicantEmail = { ...fields.applicantEmail, pii: true }
				}

				if(fields.memberDetails) {
					fields.memberDetails = { ...fields.memberDetails, pii: true }
				}
			}

			if(customFieldsOptionIsVisible && customFields.length > 0) {
				customFields.forEach((customField: any, index: number) => {
					const santizedCustomFieldValue = customField.value
						.split(' ')
						.join('\\s')
					fields[`customField${index}-${santizedCustomFieldValue}`] = {
						title: customField.value,
						inputType: 'short-form',
					}
				})
			}

			if(defaultMilestoneFields.length > 0) {
				defaultMilestoneFields.forEach(
					(defaultMilestoneField: any, index: number) => {
						const santizedDefaultMilestoneFieldValue = defaultMilestoneField.value.split(' ').join('\\s')
						fields[
							`defaultMilestone${index}-${santizedDefaultMilestoneFieldValue}`
						] = {
							title: defaultMilestoneField.value,
							inputType: 'short-form',
						}
					},
				)
			}

			const s = {
				title,
				summary,
				details: detailsString,
				fields,
				reward,
				date,
				grantManagers: admins,
				rubric: {
					isPrivate: shouldEncryptReviews,
					rubric,
				},
			}

			onSubmit(s)
		}
	}

	useEffect(() => {
		if(getKey.includes('undefined') || typeof window === 'undefined') {
			return
		}

		const data = localStorage.getItem(getKey)
		if(data === 'undefined') {
			return
		}

		const formData = typeof window !== 'undefined' ? JSON.parse(data || '{}') : {}
		// console.log('Data from cache: ', formData)

		setTitle(formData?.title)
		setSummary(formData?.summary)
		if(formData?.details) {
			setDetails(
				EditorState.createWithContent(convertFromRaw(formData?.details)),
			)
		}

		if(formData?.detailsRequired) {
			setDetailsRequired(formData?.detailsRequired)
		}

		if(formData?.rubricRequired) {
			setRubricRequired(formData?.rubricRequired)
		}

		if(formData?.customFieldsOptionIsVisible) {
			setCustomFieldsOptionIsVisible(formData?.customFieldsOptionIsVisible)
		}

		if(formData?.customFields) {
			setCustomFields(formData?.customFields)
		}

		if(formData?.milestoneSelectOptionIsVisible) {
			setMilestoneSelectOptionIsVisible(formData?.milestoneSelectOptionIsVisible)
		}

		if(formData?.multipleMilestones) {
			setMultipleMilestones(formData?.multipleMilestones)
		}

		if(formData?.rubrics) {
			setRubrics(formData?.rubrics)
		}

		if(formData?.maximumPoints) {
			setMaximumPoints(formData?.maximumPoints)
		}

		if(formData?.reward) {
			setReward(formData?.reward)
		}

		if(formData?.rewardCurrency) {
			setRewardCurrency(formData?.rewardCurrency)
		}

		if(formData?.date) {
			setDate(formData?.date)
		}

		if(formData?.shouldEncrypt) {
			setShouldEncrypt(formData?.shouldEncrypt)
		}

		if(formData?.shouldEncryptReviews) {
			setShouldEncryptReviews(formData?.shouldEncryptReviews)
		}

	}, [getKey])

	useEffect(() => {
		if(getKey.includes('undefined') || typeof window === 'undefined') {
			return
		}

		const formData = {
			title,
			summary,
			details: convertToRaw(details.getCurrentContent()),
			detailsRequired,
			rubricRequired,
			customFieldsOptionIsVisible,
			customFields,
			multipleMilestones,
			milestoneSelectOptionIsVisible,
			rubrics,
			maximumPoints,
			reward,
			rewardCurrency,
			rewardCurrencyAddress,
			date,
			shouldEncrypt,
			shouldEncryptReviews,
		}
		// console.log(JSON.stringify(formData))
		localStorage.setItem(getKey, JSON.stringify(formData))

	}, [
		details,
		reward,
		rewardCurrencyAddress,
		summary,
		detailsRequired,
		rubricRequired,
		rubrics,
		maximumPoints,
		customFieldsOptionIsVisible,
		customFields,
		title,
		shouldEncrypt,
		shouldEncryptReviews,
		date,
		multipleMilestones,
		milestoneSelectOptionIsVisible,
	])

	const { t } = useTranslation()

	return (
		<Flex
			direction='column'
			pb='10rem'
		>
			<Heading
				mt='18px'
				title='Create a new Grant' />
			<Box mt='20px' />
			<Title
				title={title}
				setTitle={setTitle}
				titleError={titleError}
				setTitleError={setTitleError}
				summary={summary}
				setSummary={setSummary}
				summaryError={summaryError}
				setSummaryError={setSummaryError}
				maxDescriptionLength={maxDescriptionLength}
			/>

			<Text
				fontSize='18px'
				fontWeight='700'
				lineHeight='26px'
				letterSpacing={0}
				mt={4}
			>
				{t('/create-grant.instructions_title')}
			</Text>
			<Box mt='20px' />
			<Details
				details={details}
				setDetails={setDetails}
				detailsError={detailsError}
				setDetailsError={setDetailsError}
			/>

			<Text
				fontSize='18px'
				fontWeight='700'
				lineHeight='26px'
				letterSpacing={0}
				mt='40px'
			>
				{t('/create-grant.proposal_form.title')}
			</Text>
			<Box mt='20px' />
			<ApplicantDetails
				detailsRequired={detailsRequired}
				toggleDetailsRequired={toggleDetailsRequired}
				// extraField={extraField}
				// setExtraField={setExtraField}
				// extraFieldDetails={extraFieldDetails}
				// setExtraFieldDetails={setExtraFieldDetails}
				// extraFieldError={extraFieldError}
				// setExtraFieldError={setExtraFieldError}
				customFields={customFields}
				setCustomFields={setCustomFields}
				customFieldsOptionIsVisible={customFieldsOptionIsVisible}
				setCustomFieldsOptionIsVisible={setCustomFieldsOptionIsVisible}
				multipleMilestones={multipleMilestones}
				setMultipleMilestones={setMultipleMilestones}
				milestoneSelectOptionIsVisible={milestoneSelectOptionIsVisible}
				setMilestoneSelectOptionIsVisible={setMilestoneSelectOptionIsVisible}
				defaultMilestoneFields={defaultMilestoneFields}
				setDefaultMilestoneFields={setDefaultMilestoneFields}
				// rubricRequired={rubricRequired}
				// setRubricRequired={setRubricRequired}
				// rubrics={rubrics}
				// setRubrics={setRubrics}
				// setMaximumPoints={setMaximumPoints}
			/>

			<GrantRewardsInput
				reward={reward}
				setReward={setReward}
				// rewardToken={rewardToken}
				rewardError={rewardError}
				setRewardError={setRewardError}
				setRewardCurrencyAddress={setRewardCurrencyAddress}
				date={date}
				setDate={setDate}
				dateError={dateError}
				setDateError={setDateError}
				shouldEncrypt={shouldEncrypt}
				setShouldEncrypt={setShouldEncrypt}
				shouldEncryptReviews={shouldEncryptReviews}
				setShouldEncryptReviews={setShouldEncryptReviews}
				isEVM={isEVM}
				oldDate={oldDate}
				setOldDate={setOldDate}
			/>

			<Button
				mt={8}
				py={hasClicked ? 2 : 0}
				onClick={hasClicked ? () => {} : handleOnSubmit}
				variant='primary'
			>
				{hasClicked ? <Loader /> : 'Create Grant'}
			</Button>
		</Flex>
	)
}

export default Form
