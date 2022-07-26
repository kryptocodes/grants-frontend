import { useContext, useEffect, useState } from 'react'
import { Biconomy } from '@biconomy/mexa'
import { BiconomyWalletClient } from 'src/types/gasless'
import { deploySCW, jsonRpcProviders } from 'src/utils/gaslessUtils'
import { GitHubTokenContext, ScwAddressContext, WebwalletContext } from '../../../pages/_app'

export const useBiconomy = (data: any) => {
	const { webwallet, setWebwallet } = useContext(WebwalletContext)!
	const { isLoggedIn, setIsLoggedIn } = useContext(GitHubTokenContext)!
	const { scwAddress, setScwAddress } = useContext(ScwAddressContext)!
	// const { biconomyDaoObj, setBiconomyDaoObj } = useContext(BiconomyContext)!
	const [biconomyDaoObj, setBiconomyDaoObj] = useState()
	const [biconomyWalletClient, setBiconomyWalletClient] = useState<BiconomyWalletClient>()

	useEffect(() => {
		console.log('EHERE', biconomyDaoObj)
		if(isLoggedIn && webwallet && (!biconomyDaoObj || !biconomyWalletClient || !scwAddress)) {
			initiateBiconomy()
				.then(res => console.log(res))
				.catch(error => console.log(error))
		}
	}, [webwallet, isLoggedIn, biconomyDaoObj, biconomyWalletClient, scwAddress])


	const initiateBiconomy = async() => {
		if(!webwallet) {
			return
		}

		console.log(webwallet, isLoggedIn, biconomyDaoObj)

		console.log('CREATING BICONOMY OBJ')
		let _biconomy: any

		if(!biconomyDaoObj) {
			_biconomy = new Biconomy(jsonRpcProviders[data.chainId],
				{
					apiKey: data.apiKey,
					debug: true
				})
		} else {
			_biconomy = biconomyDaoObj
		}


		console.log('BICONOMY OBJ CREATED', _biconomy)
		_biconomy.onEvent(_biconomy.READY, async() => {
			console.log('Inside biconomy ready event')

			const _biconomyWalletClient: BiconomyWalletClient = _biconomy.biconomyWalletClient
			console.log('biconomyWalletClient', _biconomyWalletClient)

			if(!scwAddress) {
				const walletAddress = await deploySCW(webwallet, _biconomyWalletClient)
				setScwAddress(walletAddress)
			} else {
				console.log('SCW Wallet already exists at Address', scwAddress)
			}

			if(!biconomyWalletClient) {
				setBiconomyWalletClient(_biconomyWalletClient)
			}
		}).onEvent(_biconomy.ERROR, (error: any, message: any) => {
			console.log(message)
			console.log(error)
		})

		if(!biconomyDaoObj) {
			setBiconomyDaoObj(_biconomy)
		}

	}

	return {
		biconomyDaoObj: biconomyDaoObj,
		biconomyWalletClient: biconomyWalletClient,
		scwAddress: scwAddress
	}
}