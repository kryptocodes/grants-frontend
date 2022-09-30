import React from 'react'
import {
	Box,
	Button,
	Container,
	Drawer,
	DrawerContent,
	DrawerOverlay,
	Flex,
	Text,
} from '@chakra-ui/react'
import { IApplicantData } from 'src/types'
import logger from 'src/utils/logger'
import { CancelCircleFilled } from 'src/v2/assets/custom chakra icons/CancelCircleFilled'
import { FishEye } from 'src/v2/assets/custom chakra icons/FishEye'
import { FundsCircle } from 'src/v2/assets/custom chakra icons/Your Grants/FundsCircle'
import { GnosisSafe } from 'src/v2/constants/safe/gnosis_safe'
import { RealmsSolana } from 'src/v2/constants/safe/realms_solana'
import RecipientDetails from 'src/v2/payouts/SendFundsDrawer/RecepientDetails'
import SafeOwner from 'src/v2/payouts/SendFundsModal/SafeOwner'
// import { MODAL_STATE_INDEXES, ModalStateType } from 'src/v2/payouts/SendFundsModal/SendFundsModal'
import { PhantomProvider } from 'src/v2/types/phantom'
import { Safe, TransactionType } from 'src/v2/types/safe'

interface Props {
	isOpen: boolean
	onClose: () => void
	safeAddress: string
	proposals: IApplicantData[]
	safeTokenList: any
	onChangeRecepientDetails: (applicationId: string, fieldName: string, fieldValue: string | number) => void
	phantomWallet: PhantomProvider | undefined
	setPhantomWalletConnected: (value: boolean) => void
	isEvmChain: boolean
	current_safe?: Safe | RealmsSolana | GnosisSafe
	signerVerified: boolean
	initiateTransaction: () => Promise<void>
	initiateTransactionData: TransactionType[]
	onModalStepChange: (value: string) => Promise<void>
	step: string
}


function SendFundsDrawer({
	isOpen,
	onClose,
	safeAddress,
	proposals,
	onChangeRecepientDetails,
	phantomWallet,
	isEvmChain,
	signerVerified,
	initiateTransactionData,
	onModalStepChange,
	step,
	safeTokenList,
}: Props) {

	// const {
	// 	isError: isErrorConnecting,
	// 	connect,
	// 	connectors
	// } = useConnect()

	// const validateReceipentInput = () => {
	// 	let isNotValid = false
	// 	initiateTransactionData?.map((data,) => {
	// 		if(data.to === undefined || data.selectedMilestone === undefined || data.amount === undefined || data.amount === 0) {
	// 			isNotValid = true
	// 		}
	// 	})
	// 	return isNotValid
	// }

	return (
		<Drawer
			placement='right'
			isOpen={isOpen}
			onClose={onClose}
			closeOnOverlayClick={false}
		>
			<DrawerOverlay maxH='100vh' />
			<DrawerContent
				minW={528}
				// h="min(90vh, 560px)"
				overflowY='auto'
				borderRadius='4px'>
				<Container
					px={6}
					py={4}
					display='flex'
					flexDirection='column'
					maxH='100vh'
				>

					<Flex
						direction='row'
						align='center'>
						<Flex
							bg='#D1D7F4'
							h='48px'
							w='48px'
							borderRadius='2px'
							alignItems='center'
							justifyContent='center'
						>
							<FundsCircle
								color='#036AFF'
								h='28px'
								w='28px' />
						</Flex>

						<Flex
							ml={2}
							mr='auto'
							flexDirection='column'>
							<Text
								fontSize='20px'
								lineHeight='24px'
								fontWeight='500'
							>
								Send funds
							</Text>
							<Text
								fontSize='14px'
								lineHeight='20px'
								fontWeight='400'
								mt={1}
								color='#7D7DA0'
							>
								Use your safe to send funds to the applicant.
							</Text>
						</Flex>

						<CancelCircleFilled
							mb='auto'
							color='#7D7DA0'
							h={6}
							w={6}
							onClick={onClose}
							cursor='pointer'
						/>
					</Flex>

					<Flex
						bg='#F0F0F7'
						h='1px'
						mx='-24px'
						my={4}
					/>

					<Flex
						maxH='calc(100vh - 32px)'
						overflowY='auto'
						direction='column'>
						<Flex>
							<Flex
								flex={1}
								direction='column'
							>
								<Box
									bg={step === 'RECEIPT_DETAILS' ? '#785EF0' : '#E0E0EC'}
									borderRadius='20px'
									height={1}
								/>

								<Flex
									mt={2}
									color={step === 'RECEIPT_DETAILS' ? '#785EF0' : '#E0E0EC'}>
									{
										step === 'RECEIPT_DETAILS' ? (
											<FishEye
												h='14px'
												w='14px' />
										) : (
											<Box
												border='1px solid #E0E0EC'
												borderRadius='20px'
												height='14px'
												width='14px'
											/>
										)
									}
									<Text
										fontSize='12px'
										lineHeight='16px'
										fontWeight='500'
										ml={1}
										color={step === 'RECEIPT_DETAILS' ? '#785EF0' : '#1F1F33'}
									>
										Recipient Details
									</Text>
								</Flex>
							</Flex>
							<Box w={1} />
							<Flex
								flex={1}
								direction='column'
							>
								<Box
									bg={step === 'CONNECT_WALLET' || step === 'VERIFIED_OWNER' ? '#785EF0' : '#E0E0EC'}
									borderRadius='20px'
									height={1}
								/>

								<Flex
									mt={2}
									color={step === 'CONNECT_WALLET' || step === 'VERIFIED_OWNER' ? '#785EF0' : '#E0E0EC'}>
									{
										step === 'CONNECT_WALLET' || step === 'VERIFIED_OWNER' ? (
											<FishEye
												h='14px'
												w='14px' />
										) : (
											<Box
												border='1px solid #E0E0EC'
												borderRadius='20px'
												height='14px'
												width='14px'
											/>
										)
									}
									<Text
										fontSize='12px'
										lineHeight='16px'
										fontWeight='500'
										ml={1}
										color={step === 'CONNECT_WALLET' || step === 'VERIFIED_OWNER' ? '#785EF0' : '#1F1F33'}
									>
										Verify as a safe owner
									</Text>
								</Flex>
							</Flex>
						</Flex>

						{
							step === 'RECEIPT_DETAILS' ? (
								<RecipientDetails
									applicantData={proposals}
									safeTokenList={safeTokenList}
									onChangeRecepientDetails={onChangeRecepientDetails}
									initiateTransactionData={initiateTransactionData} />
							) : (
								<SafeOwner
									isEvmChain={isEvmChain}
									phantomWallet={phantomWallet}
									signerVerified={signerVerified}
									gnosisSafeAddress={safeAddress} />
							)
						}


					</Flex>


					<Flex
						bg='#F0F0F7'
						h='1px'
						mx='-24px'
					/>

					<Flex
						mt={4}
						direction='row'
						align='center'>


						{
							step === 'RECEIPT_DETAILS' ? (
								<Button
									ml='auto'
									colorScheme='brandv2'
									disabled={
										initiateTransactionData?.filter((data) => {
											logger.info({ data })
											if(data.to === undefined || data.to === '' || data.selectedMilestone === undefined || data.amount === undefined || data.amount <= 0) {
												return true
											}
										})?.length > 0
									}
									onClick={
										async() => {
											onModalStepChange(step)
										}
									}>
									Continue
								</Button>
							) : null
						}


						{
							step === 'CONNECT_WALLET' || step === 'VERIFIED_OWNER' ? (
								<Button
									ml='auto'
									colorScheme='brandv2'
									disabled={!signerVerified}
									onClick={
										async() => {
											onModalStepChange(step)
										}
									}>
									Initiate Transaction
								</Button>
							) : null
						}

					</Flex>


				</Container>
			</DrawerContent>
		</Drawer>
	)
}


export default SendFundsDrawer
