import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertDialogOverlay, Box, Flex, Image, Modal, ModalBody, ModalContent, Text, useToast, VStack } from '@chakra-ui/react'
import { Papercups } from '@papercups-io/chat-widget'
import { NetworkType } from 'src/constants/Networks'
import { NetworkType as TzNetworkType } from '@airgap/beacon-types'
import { MetamaskFox } from 'src/v2/assets/custom chakra icons/SupportedWallets/MetamaskFox'
import { PhantomLogo } from 'src/v2/assets/custom chakra icons/SupportedWallets/PhantomLogo'
import { WalletConnectLogo } from 'src/v2/assets/custom chakra icons/SupportedWallets/WalletConnectLogo'
import ConnectWalletButton from 'src/v2/components/ConnectWalletModal/ConnectWalletButton'
import ErrorToast from 'src/v2/components/Toasts/errorToast'
import SuccessToast from 'src/v2/components/Toasts/successToast'
import VerifySignerErrorState from 'src/v2/components/VerifySignerModal/VeirfySignerErrorState'
import usePhantomWallet from 'src/v2/hooks/usePhantomWallet'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import useTezosWallet from 'src/v2/hooks/useTezosWallet'
import { TezosToolkit } from '@taquito/taquito';

const Tezos = new TezosToolkit('https://ghostnet.tezos.marigold.dev/');

const VerifySignerModal = ({
	owners,
	isOpen,
	onClose,
	redirect,
	setIsOwner,
	networkType,
	setOwnerAddress
}: {
	owners: string[]
	isOpen: boolean
	onClose: () => void
	redirect?: () => void
	setIsOwner: (newState: boolean) => void
	networkType: NetworkType
	setOwnerAddress: (ownerAddress: string) => void
}) => {
	const [connectClicked, setConnectClicked] = useState(false)
	const [walletClicked, setWalletClicked] = useState(false)
	const [redirectInitiated, setRedirectInitiated] = useState(false)
	const [tzWalletAddress, setTzWalletAddress] = useState('')
	const { phantomWallet } = usePhantomWallet()
	const { tzWallet } = useTezosWallet()
	const { disconnectAsync } = useDisconnect()
	const toast = useToast()
	const { t } = useTranslation()

	const {
		isError: isErrorConnecting,
		connectAsync,
		connectors,
	} = useConnect()

	const {
		address
	} = useAccount()

	const availableWallets = [{
		name: 'Metamask',
		icon: <MetamaskFox
			h={8}
			w='33px' />,
		isPopular: true,
		id: 'injected',
	}, {
		name: 'WalletConnect',
		icon: <WalletConnectLogo
			h={8}
			w='33px' />,
		isPopular: false,
		id: 'walletConnect'
	}]

	const solanaWallets = [{
		name: 'Phantom',
		icon: <PhantomLogo
			h={8}
			w='33px' />,
		isPopular: false,
		id: 'phantom',
	}]

	const tezosWallet = [{
		name: 'Beacon',
		icon: <PhantomLogo
			h={8}
			w='33px' />,
		isPopular: false,
		id: 'tezos'
	}]

	const [isError, setIsError] = React.useState(false)

	useEffect(() => {
		if (isOpen) {
			setIsError(false)
		}
	}, [isOpen])

	useEffect(() => {
		setIsError(isErrorConnecting)
	}, [isErrorConnecting])

	useEffect(() => {
		// console.log(accountData)
		if (address) {
			if (!redirectInitiated && redirect && connectClicked) {
				setRedirectInitiated(true)
				setConnectClicked(false)
				redirect()
			}
		}
	}, [address])

	console.log(owners, phantomWallet?.publicKey)

	useEffect(() => {
		if (isOpen && walletClicked) {
			console.log('wallet clicked', walletClicked, owners)
			if (networkType === NetworkType.EVM && address && owners.includes(address)) {
				setIsOwner(true)
				setOwnerAddress(address)
				// alert('Your safe ownership is proved.')
				toast.closeAll()
				toast({
					duration: 3000,
					isClosable: true,
					position: 'top-right',
					render: () => SuccessToast({
						content: t('/onboarding/create-domain.successful_verification'),
						close: () => { }
					}),
				})
			} else if (networkType === NetworkType.Solana && phantomWallet?.publicKey && owners.includes(phantomWallet?.publicKey.toString())) {
				setIsOwner(true)
				setOwnerAddress(phantomWallet?.publicKey.toString())
				// alert('Your safe ownership is proved.')
				toast.closeAll()
				toast({
					duration: 3000,
					isClosable: true,
					position: 'top-right',
					render: () => SuccessToast({
						content: t('/onboarding/create-domain.successful_verification'),
						close: () => { }
					}),
				})
			} else if (networkType === NetworkType.Tezos ) {
				console.log('owners', owners, tzWalletAddress)
				setIsOwner(true)
				setOwnerAddress(tzWalletAddress)
				toast.closeAll()
				toast({
					duration: 3000,
					isClosable: true,
					position: 'top-right',
					render: () => SuccessToast({
						content: t('/onboarding/create-domain.successful_verification'),
						close: () => { }
					}),
				})
			} else if (phantomWallet?.publicKey || address) {
				// setIsOwner(false)
				if (address) {
					disconnectAsync()
				}

				phantomWallet?.disconnect()

				toast.closeAll()
				// alert('Whoops! Looks like this wallet is not a signer on the safe.')
				toast({
					duration: 3000,
					isClosable: true,
					position: 'top-right',
					render: () => ErrorToast({
						content: 'Whoops! Looks like this wallet is not an owner of the safe.',
						close: () => { }
					}),
				})
			}

			setWalletClicked(false)
		}
	}, [walletClicked, address, owners, tzWalletAddress, toast, phantomWallet?.publicKey, isOpen, phantomWallet?.disconnect])

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			isCentered
			scrollBehavior='outside'
			size={isError ? 'md' : '2xl'}
		>
			<AlertDialogOverlay
				background='rgba(240, 240, 247, 0.7)'
				backdropFilter='blur(10px)'
			/>

			<ModalContent
				w='36rem'
				boxShadow='none'
				filter='drop-shadow(2px 4px 40px rgba(31, 31, 51, 0.05))'
				borderRadius='base'
				fontFamily='Neue-Haas-Grotesk-Display, sans-serif'
				fontSize='1rem'
			>
				<ModalBody
					p={0}
				>
					{
						isError ? (
							<VerifySignerErrorState
								onBack={() => setIsError(false)}
								onClose={onClose}
							/>
						) : (
							<Flex
								direction='column'
								alignItems='center'
								py={6}>
								<Image
									boxSize='48px'
									src='/ui_icons/verify-signer-top.svg'
									alt='Questbook'
								/>

								<Text
									mt={6}
									variant='v2_heading_3'
									fontWeight='500'
								>
									{t('/onboarding/create-domain.verify_signer_title')}
								</Text>
								<Text
									variant='v2_body'
									color='black.3'>
									{t('/onboarding/create-domain.verify_signer_desc')}
								</Text>

								<VStack
									mt={6}
									direction='column'
									w='full'
									px={4}
									spacing={4}
								>
									{
										networkType === NetworkType.EVM
											? (availableWallets.map((wallet) => (
												<ConnectWalletButton
													key={wallet.id}
													icon={wallet.icon}
													name={wallet.name}
													isPopular={wallet.isPopular}
													onClick={
														async () => {
															const connector = connectors.find((x) => x.id === wallet.id)!
															// swallow error here so we don't fail the remaining logic
															const isConnected = await connector.isAuthorized().catch(() => false)

															setConnectClicked(true)
															if (!isConnected) {
																try {
																	await connectAsync({ connector })
																} catch (e) {
																	// console.log('evm error', e)
																}
															}

															setWalletClicked(true)
														}
													} />
											)))
											: networkType === NetworkType.Solana ? (solanaWallets.map((wallet, index) => (
												<ConnectWalletButton
													key={index}
													icon={wallet.icon}
													name={wallet.name}
													isPopular={wallet.isPopular}
													onClick={
														async () => {
															await phantomWallet?.connect()
															setWalletClicked(true)
															// showToast()
														}
													} />
											))) : (tezosWallet.map((wallet, index) => (
												<ConnectWalletButton
													key={index}
													icon={wallet.icon}
													name={wallet.name}
													isPopular={wallet.isPopular}
													onClick={
														async () => {
															try {
																console.log("Requesting permissions...");
																const permissions = await tzWallet?.client.requestPermissions();
																console.log("Got permissions:", permissions?.address);
																setTzWalletAddress(permissions?.address!)
																// tzWallet()
															} catch (error) {
																console.log("Got error:", error);
															}
															setWalletClicked(true)
															// showToast()
														}
													} />
											)))
									}
								</VStack>

								<Text
									mt={6}
									variant='v2_body'>
									Need help?
								</Text>
								<Text
									mt={2}
									as='u'
									cursor='pointer'
									variant='v2_body'
									onClick={Papercups.open}>
									Get instant support.
								</Text>


								<Box h={5} />

							</Flex>
						)
					}
				</ModalBody>
			</ModalContent>

		</Modal>
	)
}

export default VerifySignerModal
