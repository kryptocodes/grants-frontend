import Safe, { SafeFactory } from '@gnosis.pm/safe-core-sdk'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { ethers } from 'ethers'
import { MetaTransaction, Safe as GnosisSafe, TransactionType } from '../../types/safe'

export class Gnosis_Safe implements GnosisSafe {
    id: string;
    name: string;
    description: string;
    image: string;
    chainId: number;
    txnServiceURL: string;

    constructor(chainId: number, txnServiceURL: string, safeAddress: string) {
    	this.id = safeAddress
    	this.name = 'Gnosis Safe'
    	this.description = 'Gnosis Safe'
    	this.image = ''
    	this.chainId = chainId
    	this.txnServiceURL = txnServiceURL
    }
    proposeTransactions(grantName: string, transactions: TransactionType[], wallet: any): Promise<string> {
    	throw new Error('Method not implemented.')
    }

    async createMultiTransaction(transactions: MetaTransaction[], safeAddress: string) {

    	console.log('creating gnosis transaction for', transactions)
    	//@ts-ignore
    	const provider = new ethers.providers.Web3Provider(window.ethereum)
    	await provider.send('eth_requestAccounts', [])

    	const signer = provider.getSigner()
    	const ethAdapter = new EthersAdapter({
    		ethers,
    		signer,
    	})

    	const safeService = new SafeServiceClient({ txServiceUrl: this.txnServiceURL, ethAdapter })
    	const safeFactory = await SafeFactory.create({ ethAdapter })
    	const safeSdk = await Safe.create({ ethAdapter, safeAddress })

    	try {
    		const safeTransaction = await safeSdk.createTransaction(transactions)

    		console.log(safeTransaction)

    		const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    		const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
    		console.log(signer.getAddress())
    		const txhash = await safeService.proposeTransaction({
    			safeAddress,
    			safeTransactionData: safeTransaction.data,
    			safeTxHash,
    			senderAddress: await signer.getAddress(),
    			senderSignature: senderSignature.data,
    			origin
    		})


    	} catch(e) {
    		console.log(e)
    	}


    }

    async isValidSafeAddress(address: String) {
    	return false
    }

    async isOwner(safeAddress: string): Promise<boolean> {
    	//@ts-ignore
    	const provider = new ethers.providers.Web3Provider(window.ethereum)
    	await provider.send('eth_requestAccounts', [])

    	const signer = provider.getSigner()
    	const ethAdapter = new EthersAdapter({
    		ethers,
    		signer,
    	})

    	const safeSdk = await Safe.create({ ethAdapter, safeAddress })

    	const userAddress = await signer.getAddress()
    	const isOwner = await safeSdk.isOwner(userAddress)

    	return isOwner
    }

    getTransactionHashStatus(proposalPublicKeys: String[]):any {

    }

    getSafeDetails(address: String): any {

    }

}