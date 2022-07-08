
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Wallet } from 'ethers';
import {
    Flex,
    Input,
    Grid,
    Heading,
    Image,
    Link,
    Text,
    Tooltip,
    Button
} from '@chakra-ui/react';
import NavbarLayout from '../src/layout/navbarLayout';
import { GitHubTokenContext, WebwalletContext } from './_app';
import axios from 'axios';
import { ethers, Contract } from 'ethers';
import { Biconomy } from '@biconomy/mexa';
import { registerWebHook, sendGaslessTransaction, deploySCW, jsonRpcProvider, getEventData, getTransactionReceipt, addDapp } from '../src/utils/gaslessUtils';
import { useRouter } from 'next/router';
import { WORKSPACE_REGISTRY_ADDRESS } from 'src/constants/addresses';
import { BiconomyWalletClient } from 'src/types/gasless';

const config = {
    contract: {
        address: "0xEf464fd1bb4951B4Af89bbFd6C46dd970b1Fa2AF",
        abi: [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "GetValue",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_value",
                        "type": "uint256"
                    }
                ],
                "name": "setValue",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "value",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    },
    walletFactory: {
        address: '0xB6D514655c1ed4A7ceeA2D717A3F37D7D8aEE90b',
        abi: [{ "inputs": [{ "internalType": "address", "name": "_baseImpl", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_proxy", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_implementation", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_owner", "type": "address" }], "name": "WalletCreated", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "address", "name": "_entryPoint", "type": "address" }, { "internalType": "address", "name": "_handler", "type": "address" }, { "internalType": "uint256", "name": "_index", "type": "uint256" }], "name": "deployCounterFactualWallet", "outputs": [{ "internalType": "address", "name": "proxy", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "address", "name": "_entryPoint", "type": "address" }, { "internalType": "address", "name": "_handler", "type": "address" }], "name": "deployWallet", "outputs": [{ "internalType": "address", "name": "proxy", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "uint256", "name": "_index", "type": "uint256" }], "name": "getAddressForCounterfactualWallet", "outputs": [{ "internalType": "address", "name": "_wallet", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "isWalletExist", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }]
    },
    apiKey: {
        test: "_0I8gBue9.771c0dc8-5cad-4bf9-99d8-49895fde873a",
        prod: "_0I8gBue9.771c0dc8-5cad-4bf9-99d8-49895fde873a"
    },
    api: {
        test: "https://test-api.biconomy.io",
        prod: "https://api.biconomy.io"
    }
}

let biconomy: any;
let biconomyWalletClient: BiconomyWalletClient;
let contract: Contract;
let scwAddress: string;

const authToken = 'ce87a0be-951a-4475-ad2a-b5b5f93f278a' // authToken from the dashboard

const apiKey = 'qPZRgkerc.afb7905a-12b8-4c90-8e6b-48479f9e58d1' // apiKey from the dashboard
const webHookId = 'b8400628-c963-4761-9369-a14ec9ca2e6f'

function SignupWebwallet() {

    const { webwallet, setWebwallet } = useContext(WebwalletContext)!
    const { isLoggedIn, setIsLoggedIn } = useContext(GitHubTokenContext)!
    const [number, setNumber] = useState<string>("one");

    useEffect(() => {
        // setNumber("two");
        // localStorage.removeItem('webwalletPrivateKey');
        // localStorage.removeItem('isLoggedInGitHub');
        // if (!webwallet) {
        //     setWebwallet(Wallet.createRandom());
        // }

        // if (!isLoggedIn && webwallet) {
        //     window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}`;
        // }

    }, [isLoggedIn, webwallet])

    const initiateBiconomy = async () => {
        console.log(webwallet, isLoggedIn, biconomy);
        if (webwallet && isLoggedIn && !biconomy) {

            biconomy = new Biconomy(jsonRpcProvider,
                {
                    apiKey: apiKey,
                    debug: true
                });

            biconomy.onEvent(biconomy.READY, async () => {
                console.log('Inside biconomy ready event');

                // here should change the contract
                contract = new ethers.Contract(
                    config.contract.address,
                    config.contract.abi,
                    webwallet
                );

                biconomyWalletClient = biconomy.biconomyWalletClient;
                console.log("biconomyWalletClient", biconomyWalletClient);

                console.log("CLIENT WALLET", biconomyWalletClient)

                let walletAddress = await deploySCW(webwallet, biconomyWalletClient);
                scwAddress = walletAddress;

            }).onEvent(biconomy.ERROR, (error: any, message: any) => {
                console.log(message);
                console.log(error);
            });
            console.log("DONE HERE")
        }
    };

    const handleInitiateBiconomy = async (e: any) => {
        e.preventDefault();

        await initiateBiconomy();

    }

    const handleSendGaslessTransaction = async (e: any) => {
        e.preventDefault();
        // contract.on("GetValue", async (...args) => {
        //     console.log("THIS IS EVENT", ...args);
        // })

        // const receipt = await jsonRpcProvider.getTransactionReceipt("0x933f36a114e19e87e70865fa1aafff46acb4cc373515d6a5b254b10dee79d35f");
        // console.log("THIS IS RECEIPT", receipt);
        // let abi = [ "event GetValue(uint value)" ];
        // let iface = new ethers.utils.Interface(abi);
        // let log = iface.parseLog(receipt.logs[0]); // here you can add your own logic to find the correct log
        // console.log(log)
        // const {value} = log.args;

        // console.log("THIS IS EVENT NAME", log.eventFragment.name)
        // console.log("PROBABLY THIS IS VALUE", parseInt(value));

        // let { value } = await getEventData("0xe5704321b85844233e1971660d167acf6066f638e25d90fd0c15f372144b591b", "GetValue", config.contract.abi);
        // console.log(ethers.BigNumber.from(value).toNumber());

        // // jsonRpcProvider.once("0xe5704321b85844233e1971660d167acf6066f638e25d90fd0c15f372144b591b", async (value) => {
        // //     console.log("Got the value", value);
        // // });
        
        // console.log("HERE 2")
        // console.log(await getTransactionReceipt("0x647486ca5fe26f952aacaeeb35287b5c2cab522274f2454ed92007d906e02e1c"))
        // let transactionHash: string | undefined | boolean;

        // console.log("ENTERING")
        // transactionHash = await sendGaslessTransaction(biconomy, contract, 'setValue', [332], config.contract.address, biconomyWalletClient,
        //     scwAddress, webwallet, "80001", webHookId, nonce);

        // console.log(transactionHash);
        // let something = await getEventData(transactionHash, "GetValue", config.contract.abi);
        console.log(process.env.BICO_AUTH_TOKEN);
        await addDapp('darr3', "80001", process.env.BICO_AUTH_TOKEN);
        // console.log("THIS IS EVENT", something);

    }


    return (
        <Flex width='100%' flexDir='row' justifyContent='center'>
            {number}
            {webwallet &&
                <form onSubmit={handleInitiateBiconomy}>
                    <Button mt={4} colorScheme='teal' type='submit'>
                        Initiate Biconomy
                    </Button>
                </form>
            }
            <form onSubmit={handleSendGaslessTransaction}>
                <Button mt={4} colorScheme='teal' type='submit'>
                    Send Transaction
                </Button>
            </form>
        </Flex>
    )
}

SignupWebwallet.getLayout = function (page: any) {
    return (
        <NavbarLayout>
            {page}
        </NavbarLayout>
    )
}

export default SignupWebwallet;