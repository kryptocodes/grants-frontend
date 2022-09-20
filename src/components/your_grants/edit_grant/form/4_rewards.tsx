import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Box,
	Flex,
	Switch,
	Text,
} from '@chakra-ui/react'
import { Token } from '@questbook/service-validator-client'
import Datepicker from 'src/components/ui/forms/datepicker'
import Dropdown from 'src/components/ui/forms/dropdown'
import SingleLineInput from 'src/components/ui/forms/singleLineInput'
import CustomTokenModal from 'src/components/ui/submitCustomTokenModal'
import { extractDate } from 'src/utils/formattingUtils'
import 'react-datepicker/dist/react-datepicker.css'

function GrantRewardsInput({
	reward,
	setReward,
	rewardError,
	setRewardError,
	setRewardToken,
	rewardCurrency,
	setRewardCurrency,
	setRewardCurrencyAddress,
	date,
	setDate,
	dateError,
	setDateError,
	supportedCurrencies,
	shouldEncrypt,
	setShouldEncrypt,
	defaultShouldEncrypt,
	defaultShouldEncryptReviews,
	shouldEncryptReviews,
	setShouldEncryptReviews,
	isEVM
}: {
  reward: string
  setReward: (rewards: string) => void
  rewardError: boolean
  setRewardError: (rewardError: boolean) => void
  setRewardToken: (rewardToken: Token) => void
  rewardCurrency: string
  setRewardCurrency: (rewardCurrency: string) => void
  setRewardCurrencyAddress: (rewardCurrencyAddress: string) => void
  date: string
  setDate: (date: string) => void
  dateError: boolean
  setDateError: (dateError: boolean) => void
  supportedCurrencies: any[]
  shouldEncrypt: boolean
  setShouldEncrypt: (shouldEncrypt: boolean) => void
  defaultShouldEncrypt: boolean
  defaultShouldEncryptReviews: boolean
  shouldEncryptReviews: boolean
  setShouldEncryptReviews: (shouldEncryptReviews: boolean) => void
  isEVM: boolean
}) {
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [supportedCurrenciesList, setSupportedCurrenciesList] = React.useState<any[]>([])

	useEffect(() => {
		if(supportedCurrencies && supportedCurrencies.length > 0) {
			setSupportedCurrenciesList(supportedCurrencies)
		}
	}, [supportedCurrencies])

	const [isJustAddedToken, setIsJustAddedToken] = React.useState<boolean>(false)
	const addERC = false

	const [showDropdown, setShowDropdown] = React.useState(false)

	useEffect(() => {
		const CurrenciesList = supportedCurrenciesList.filter((currencyItem) => currencyItem.length > 0)
		setShowDropdown(CurrenciesList.length > 0)
	}, [supportedCurrenciesList])

	const { t } = useTranslation()
	return (
		<Flex direction='column'>

			<Flex
				direction='row'
				mt={12}>
				<Box
					minW='160px'
					flex={1}>
					<SingleLineInput
						label={t('/create-grant.amount')}
						placeholder='100'
						errorText='Required'
						onChange={
							(e) => {
								if(rewardError) {
									setRewardError(false)
								}

								setReward(e.target.value)
							}
						}
						value={reward}
						isError={rewardError}
						type='number'
					/>
				</Box>
			</Flex>

			<Box mt={12} />

			<Datepicker
				onChange={
					(e) => {
						if(dateError) {
							setDateError(false)
						}

						setDate(e.target.value)
					}
				}
				value={extractDate(date)}
				isError={dateError}
				errorText='Required'
				label='Proposal Deadline'
			/>
			{/* <Flex
				mt={8}
				gap='2'
				justifyContent='space-between'>
				<Flex direction='column'>
					<Text
						color='#122224'
						fontWeight='bold'
						fontSize='16px'
						lineHeight='20px'
					>
						Hide applicant personal data (email, and about team)
					</Text>
					<Flex>
						<Text
							color='#717A7C'
							fontSize='14px'
							lineHeight='20px'>
							{
								shouldEncrypt
									? 'The applicant data will be visible only to DAO members.'
									: 'The applicant data will be visible to everyone with the link.'
							}
						</Text>
					</Flex>
				</Flex>
				<Flex
					justifyContent='center'
					gap={2}
					alignItems='center'>
					<Switch
						id='encrypt'
						defaultChecked={defaultShouldEncrypt}
						onChange={
							(e) => {
								setShouldEncrypt(e.target.checked)
							}
						}
					/>
					<Text
						fontSize='12px'
						fontWeight='bold'
						lineHeight='16px'>
						{`${shouldEncrypt ? 'YES' : 'NO'}`}
					</Text>
				</Flex>
			</Flex> */}

			<Flex
				mt={8}
				gap='2'
				justifyContent='space-between'>
				<Flex direction='column'>
					<Text
						color='#122224'
						fontWeight='bold'
						fontSize='16px'
						lineHeight='20px'
					>
						{t('/create-grant.private_review')}
					</Text>
					<Flex>
						<Text
							color='#717A7C'
							fontSize='14px'
							lineHeight='20px'>
							{t('/create-grant.private_review_desc')}
						</Text>
					</Flex>
				</Flex>
				<Flex
					justifyContent='center'
					gap={2}
					alignItems='center'>
					<Switch
						id='encrypt'
						defaultChecked={defaultShouldEncryptReviews}
						onChange={
							(e) => {
								setShouldEncryptReviews(e.target.checked)
							}
						}
					/>
					<Text
						fontSize='12px'
						fontWeight='bold'
						lineHeight='16px'>
						{`${shouldEncryptReviews ? 'YES' : 'NO'}`}
					</Text>
				</Flex>
			</Flex>

		</Flex>
	)
}

export default GrantRewardsInput
