import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Box, Text,
} from '@chakra-ui/react'
import SingleLineInput from 'src/components/ui/forms/singleLineInput'
import { ApiClientsContext } from 'src/pages/_app'
import { chainNames } from 'src/utils/chainNames'
import { isValidEthereumAddress } from 'src/utils/validationUtils'
import { RealmsSolana } from 'src/v2/constants/safe/realms_solana'

function ApplicantDetails({
	applicantName,
	setApplicantName,
	applicantEmail,
	setApplicantEmail,
	applicantAddress,
	setApplicantAddress,
	applicantNameError,
	setApplicantNameError,
	applicantEmailError,
	setApplicantEmailError,
	grantRequiredFields,
	applicantAddressError,
	setApplicantAddressError,
	safeNetwork,
	resolvedDomain,
	resolvedDomainError
}: {
  applicantName: string
  setApplicantName: (applicantName: string) => void
  applicantEmail: string
  setApplicantEmail: (applicantEmail: string) => void
  applicantNameError: boolean
  applicantAddress: string
  setApplicantAddress: (applicantAddress: string) => void
  setApplicantNameError: (applicantNameError: boolean) => void
  applicantEmailError: boolean
  setApplicantEmailError: (applicantEmailError: boolean) => void
  applicantAddressError: boolean
  setApplicantAddressError: (applicantAddressError: boolean) => void
  grantRequiredFields: string[]
  safeNetwork: string
  resolvedDomain: string
  resolvedDomainError: boolean
}) {
	const { workspace } = useContext(ApiClientsContext)!
	const { t } = useTranslation()

	const isSafeOnSolana = (safeNetwork == '9001' || safeNetwork == '90001' || safeNetwork == '900001' || safeNetwork == '9000001')
	return (
		<>
			<Text
				fontWeight='700'
				fontSize='16px'
				lineHeight='20px'
				color='#8850EA'>
				{t('/explore_grants/apply.proposer_details')}
			</Text>
			<Box mt={6} />
			<SingleLineInput
				label={t('/explore_grants/apply.name')}
				onChange={
					(e) => {
						if(applicantNameError) {
							setApplicantNameError(false)
						}

						setApplicantName(e.target.value)
					}
				}
				isError={applicantNameError}
				errorText='Required'
				value={applicantName}
				visible={grantRequiredFields.includes('applicantName')}
			/>
			<Box mt={6} />
			<SingleLineInput
				label={t('/explore_grants/apply.email')}
				value={applicantEmail}
				onChange={
					(e) => {
						if(applicantEmailError) {
							setApplicantEmailError(false)
						}

						setApplicantEmail(e.target.value)
					}
				}
				isError={applicantEmailError}
				errorText='Required'
				visible={grantRequiredFields.includes('applicantEmail')}
				type='email'
			/>
			<Box mt={6} />
			<SingleLineInput
				label={t('/explore_grants/apply.address')}
				placeholder={isSafeOnSolana ? '5yDU...' : '0xa2dD...' } //TODO : remove hardcoding of chainId
				subtext={resolvedDomain ? `Unstoppable domain found with owner ${resolvedDomain}` : `${t('/explore_grants/apply.your_address_on')} ${chainNames.get(safeNetwork)}`}
				onChange={
					async(e) => {
						debugger
						setApplicantAddress(e.target.value)
						let safeAddressValid = false
						if(isSafeOnSolana) {
							const realms = new RealmsSolana('')
							safeAddressValid = await realms.isValidRecipientAddress(e.target.value)
							setApplicantAddressError(!safeAddressValid)
						} else {
							safeAddressValid = await isValidEthereumAddress(e.target.value)
							setApplicantAddressError(!safeAddressValid)
						}

						// console.log('safe address', e.target.value, safeAddressValid)
					}
				}
				isError={applicantAddressError && resolvedDomainError}
				errorText={t('/explore_grants/apply.invalid_address_on_chain').replace('%CHAIN', chainNames.get(safeNetwork)!.toString())}
				value={applicantAddress}
				visible={grantRequiredFields.includes('applicantAddress')}
			/>
		</>
	)
}

export default ApplicantDetails
