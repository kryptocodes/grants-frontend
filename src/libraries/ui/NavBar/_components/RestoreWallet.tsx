import { ChangeEvent, useEffect, useState } from 'react'
import { Button, Flex, Icon, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, Text, useToast } from '@chakra-ui/react'
import TextField from 'src/v2/components/InputFields/TextField'
import { ethers, utils, Wallet } from 'ethers';
import { BsArrowLeft } from 'react-icons/bs';
import useCustomToast from 'src/libraries/hooks/useCustomToast'
interface Props {
    importWebwallet: (privateKey: string) => void
    inited: boolean;
    loading: boolean;
    importWalletFromGD: () => Promise<Wallet>
    setSignIn: (signIn: boolean) => void
    setSignInMethod : (signInMethod: 'newWallet' | 'existingWallet' | 'choosing') => void
}

function RestoreWallet({setSignInMethod, setSignIn, inited, loading, importWalletFromGD, importWebwallet }: Props) {
    const toast = useCustomToast()
    const [isEnteringPrivateKey, setIsEnteringPrivateKey] = useState<boolean>(false)
    const [isValidKey, setIsValidKey] = useState<boolean>(false)
    const [privateKey, setPrivateKey]= useState<string>('')
    useEffect(()=>{
        if(utils.isHexString(privateKey,32)){
            console.log(privateKey,'yoyo')
            setIsValidKey(true)
        }
        else setIsValidKey(false)
    }, [privateKey])
    const buildComponent = () => {
        return (
            <ModalBody>
                <Flex
                    pb={6}
                    direction='column'
                    align='center'>
                    <Button
                        colorScheme='gray.1'
                        textColor='black'
                        // variant='linkV2'
                        ml={-5}
                        alignSelf={'flex-start'}
                        leftIcon={<BsArrowLeft />}
                        onClick={()=>{
                            if(!isEnteringPrivateKey)setSignInMethod('choosing')
                            else setIsEnteringPrivateKey(false)
                        }
                    }
                    >
                        Back
                    </Button>
                    <Text
                        variant='v2_subheading'
                        fontWeight='500'
                        mt={1}>
                        Restore your Questbook wallet
                    </Text>
                    <Text
                        variant='v2_body'
                        mt={1}
                        mb={4}
                        color='black.3'>
                        Restore your existing wallet with the private key.
                    </Text>
                    {!isEnteringPrivateKey && (  <Button
                        
                        marginTop={4}
                        w='80%'
                        bg='gray.3'
                        h='10'
                        borderRadius={0}
                        isDisabled={loading || !inited}
                        leftIcon={<Icon as={Image} src='Google_Drive_icon_(2020).svg'/>}
                        onClick={async () => {
                            try {
                                importWebwallet((await importWalletFromGD()).privateKey)
                                setSignIn(false)
                            } catch {
                                toast({
                                    title: 'No key found.',
                                    description: "We could not find your private key in this Google drive. Try again with another account.",
                                    status: 'warning',
                                    duration: 6000,
                                    isClosable: true,
                                })
                            }
                        }
                        }
                    >
                        <Text
                            variant='v2_body'
                            color='black'
                            fontWeight='500'
                        >
                            Export from Google Drive
                        </Text>
                    </Button>)}

                    {!isEnteringPrivateKey && (<Button
                    
                        marginTop={2}
                        w='80%'
                        bg='gray.3'
                        h='10'
                        borderRadius={0}
                    onClick={()=>setIsEnteringPrivateKey(true)}
                    >
                        <Text
                            // alignSelf='flex-start'
                            variant='v2_body'
                            color='black'
                            fontWeight='500'
                        >
                            Enter your private key
                        </Text>
                    </Button>)}
                    {isEnteringPrivateKey && (
                        <Input
                        marginTop={5}
                        width='90%'
                        variant='flushed'
                        placeholder='Enter your private key'
                        value={privateKey}
                        onChange={(e)=>setPrivateKey(e.target.value)}
                        >
                        </Input>
                    )}
                    {isEnteringPrivateKey && (
                        <Button
                        marginTop={3}
                        width='90%'
                        bg='black.1'
                        colorScheme='white'
                        textColor='gray.1'
                        disabled={!isValidKey}
                        onClick={()=>{
                            try{
                            importWebwallet(privateKey)
                            setSignIn(false)
                            }catch{
                                toast({
                                    title: 'Error',
                                    description: "Try again later.",
                                    status: 'warning',
                                    duration: 6000,
                                    isClosable: true,
                                })
                            }
                        }}
                        >
                            continue
                        </Button>
                    )}
                </Flex>
            </ModalBody>
        )
    }

    return buildComponent()
}

export default RestoreWallet