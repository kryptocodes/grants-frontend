/* eslint-disable */
import {
	createInstructionData,
	getAllTokenOwnerRecords,
	getGovernanceAccounts,
	getNativeTreasuryAddress,
	getRealm,
	Governance,
	Proposal,
	pubkeyFilter,
	VoteType,
	withCreateProposal,
	withInsertTransaction,
	withSignOffProposal,
} from '@solana/spl-governance'
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import assert from 'assert'
import axios from 'axios'
import { USD_THRESHOLD } from 'src/constants'
import { NetworkType } from 'src/constants/Networks'
import { SafeSelectOption } from 'src/v2/components/Onboarding/CreateDomain/SafeSelect'
import { MetaTransaction, Safe, TransactionType } from 'src/v2/types/safe'

export class Realms_Solana implements Safe {
	id: PublicKey | undefined
	name: string
	description: string
	image: string
	chainId: number

	connection: Connection
	programId: PublicKey
	constructor(realmsId: string) {
    	this.id = realmsId ? new PublicKey(realmsId) : undefined // devnet realmPK
    	this.name = 'Realms on Solana'
    	this.description = 'Realms on Solana'
    	this.image = ''
    	this.chainId = 9000001

    	this.connection = new Connection(process.env.SOLANA_RPC!, 'recent')
    	//this.connection = new Connection('http://realms-realms-c335.mainnet.rpcpool.com/258d3727-bb96-409d-abea-0b1b4c48af29', 'recent')
    	this.programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw')
	}

	createMultiTransaction(transactions: MetaTransaction[], safeAddress: string): void {
    	throw new Error('Method not implemented.')
	}


	async proposeTransactions(grantname: string, transactions: TransactionType[], wallet: any): Promise<string> {

    	const realmData = await getRealm(this.connection, this.id!)
    	const governances = await getGovernanceAccounts(this.connection, this.programId, Governance, [
			pubkeyFilter(1, this.id)!,
		])
  
		const governance = governances.filter((gov)=>gov.pubkey.toString()===realmData.account.authority?.toString())[0]
    	const payer = wallet.publicKey

    	const tokenOwnerRecord = await getAllTokenOwnerRecords(
    		this.connection,
    		realmData.owner,
    		realmData.pubkey
    	)

    	const proposalInstructions: TransactionInstruction[] = []

    	const proposalAddress = await withCreateProposal(
    		proposalInstructions,
    		this.programId,
    		2,
    		this.id!,
    		governance.pubkey,
    		tokenOwnerRecord[0].pubkey,
    		`${transactions.length > 1 ? 'Batched Payout - ' : ''} ${grantname} - ${new Date().toDateString()}`,
    		`${grantname}`,
    		tokenOwnerRecord[0].account.governingTokenMint,
            payer!,
            governance.account.proposalCount,
            VoteType.SINGLE_CHOICE,
            ['Approve'],
            true,
            payer!
    	)

    	const nativeTreasury = await getNativeTreasuryAddress(this.programId, governance.pubkey)

    	for(let i = 0; i < transactions.length; i++) {
    		const ins = SystemProgram.transfer({
    			fromPubkey: nativeTreasury,
    			toPubkey: new PublicKey(transactions[i].to),
    			lamports: parseFloat(transactions[i].amount.toFixed(9)) * 1000000000,
    			programId: this.programId,
    		})

    		const instructionData = createInstructionData(ins)

    		await withInsertTransaction(
    			proposalInstructions,
    			this.programId,
    			2,
    			governance.pubkey,
    			proposalAddress,
    			tokenOwnerRecord[0].pubkey,
				payer!,
				i,
				0,
				0,
				[instructionData],
				payer!
    		)
    	}

    	withSignOffProposal(
    		proposalInstructions,
    		this.programId,
    		2,
    		this.id!,
    		governance.pubkey,
    		proposalAddress,
            payer!,
            undefined,
            tokenOwnerRecord[0].pubkey
    	)

    	const getProvider = (): any => {
    		if('solana' in window) {
    			// @ts-ignore
    			const provider = window.solana as any
    			if(provider.isPhantom) {
    				return provider as any
    			}
    		}
    	}

    	console.log('create New proposal - getProvider', getProvider())

    	const block = await this.connection.getLatestBlockhash('confirmed')
    	const transaction = new Transaction()
    	transaction.recentBlockhash = block.blockhash
    	transaction.feePayer = payer!
    	transaction.add(...proposalInstructions)
    	const sendTrxn = await getProvider().signAndSendTransaction(transaction)

    	return proposalAddress.toString()
	}

	isValidSafeAddress(realmsPublicKey: string): any {
    	//safe address => realms public key

    	return false
	}

	async isOwner(address: String): Promise<boolean> {
    	const tokenownerrecord = await getAllTokenOwnerRecords(this.connection, this.programId, this.id!)
    	let isOwner = false
    	for(let i = 0; i < tokenownerrecord.length; i++) {
    		if(tokenownerrecord[i].account.governingTokenOwner.toString() === address) {
    			isOwner = true
    			break
    		}
    	}

    	return isOwner
	}

	async getSafeDetails(realmsPublicKey: String): Promise<any> {
    	const realmData = await getRealm(this.connection, new PublicKey(realmsPublicKey))
    	const COUNCIL_MINT = realmData.account.config.councilMint
    	const governanceInfo = await getGovernanceAccounts(this.connection, this.programId, Governance, [pubkeyFilter(33, COUNCIL_MINT)!])
	}

	async getTransactionHashStatus(proposalPublicKey: string): Promise<any> {
    	const realmData = await getRealm(this.connection, new PublicKey(this.id!))
    	const governances = await getGovernanceAccounts(this.connection, this.programId, Governance, [
			pubkeyFilter(1, this.id)!,
		])
		const governance = governances.filter((gov)=>gov.pubkey.toString()===realmData.account.authority?.toString())[0]

    	const proposals = await getGovernanceAccounts(this.connection, new PublicKey(this.programId), Proposal, [
                    pubkeyFilter(1, governance.pubkey)!,
    	])

    	const propsalsToSend: {[proposalKey: string]: number} = {};

    	(proposals
    		.filter((proposal) => proposalPublicKey.includes(proposal.pubkey.toString())) || [])
    		.map((proposal) => {
    			propsalsToSend[proposal.pubkey.toString()] = proposal.account.state < 5 ? 0 : proposal.account.state === 5 ? 1 : 2
    		})
    	return propsalsToSend
	}
}

const solanaToUsd = async(solAmount: number) => {
	const url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
	const solToUsd = parseFloat((await axios.get(url)).data.solana.usd)
	return Math.floor(solToUsd * solAmount)
}

const usdToSolana = async(usdAmount: number) => {
	const url = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
	const usdToSolana = parseFloat((await axios.get(url)).data.solana.usd)
	return (usdAmount / usdToSolana)
}

const getSafeDetails = async(realmsAddress: string): Promise<SafeSelectOption | null> => {
	const connection = new Connection(process.env.SOLANA_RPC!, 'recent')
	const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw')
	const realmsPublicKey = new PublicKey(realmsAddress)
	const realmData = await getRealm(connection, realmsPublicKey)
	const governances = await getGovernanceAccounts(connection, programId, Governance, [
		pubkeyFilter(1, new PublicKey(realmsAddress))!,
	])
	const governance = governances.filter((gov)=>gov.pubkey.toString()===realmData.account.authority?.toString())[0]
	const nativeTreasuryAddress = await getNativeTreasuryAddress(programId, governance.pubkey)
	assert(realmData.account.name)
	const solAmount = (await connection.getAccountInfo(nativeTreasuryAddress))!.lamports / 1000000000
	const usdAmount = await solanaToUsd(solAmount)

	return {
		safeAddress: realmsAddress,
		networkType: NetworkType.Solana,
		networkId: '900001', // A costum value for Solana as it's not EVM.
		networkName: 'Solana',
		networkIcon: '/network_icons/solana.svg',
		safeType: 'SPL-GOV',
		safeIcon: '/safes_icons/realms.svg',
		amount: usdAmount, // 1000
		isDisabled: usdAmount < USD_THRESHOLD
	}
}

const isOwner = async(safeAddress: string, address: String): Promise<boolean> => {
	const connection = new Connection(process.env.SOLANA_RPC!, 'recent')
	const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw')
	const safeAddressPublicKey = new PublicKey(safeAddress)

	const tokenownerrecord = await getAllTokenOwnerRecords(connection, programId, safeAddressPublicKey)
	let isOwner = false
	for(let i = 0; i < tokenownerrecord.length; i++) {
		if(tokenownerrecord[i].account.governingTokenOwner.toString() === address) {
			isOwner = true
			break
		}
	}

	return isOwner
}

const getOwners = async(safeAddress: string): Promise<string[]> => {
	const connection = new Connection(process.env.SOLANA_RPC!, 'recent')
	const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw')

	try {
		const safeAddressPublicKey = new PublicKey(safeAddress)
		const tokenownerrecord = await getAllTokenOwnerRecords(connection, programId, safeAddressPublicKey)
		const owners = tokenownerrecord.map(record => record.account.governingTokenOwner.toString())
		return owners
	} catch(e: any) {
		return []
	}

}


export { getSafeDetails, isOwner, getOwners, solanaToUsd, usdToSolana }