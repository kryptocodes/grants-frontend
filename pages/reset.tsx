
import React, { useContext, useEffect, useState } from 'react'
import {
	Button,
	Flex } from '@chakra-ui/react'
import NavbarLayout from '../src/layout/navbarLayout'
import { BiconomyContext, WebwalletContext } from './_app'

function SignupWebwallet() {

	const { setWebwallet, setScwAddress, setNonce } = useContext(WebwalletContext)!
	const { setBiconomyDaoObj } = useContext(BiconomyContext)!

	const handleReset = async(e: any) => {
		e.preventDefault()

		setNonce(undefined)
		setWebwallet(undefined)
		setScwAddress(undefined)
		setBiconomyDaoObj(undefined)

	}

	return (
		<Flex
			width='100%'
			flexDir='row'
			justifyContent='center'>
			<form onSubmit={handleReset}>
				<Button
					mt={4}
					colorScheme='teal'
					type='submit'>
                    Reset
				</Button>
			</form>
		</Flex>
	)
}

SignupWebwallet.getLayout = function(page: any) {
	return (
		<NavbarLayout>
			{page}
		</NavbarLayout>
	)
}

export default SignupWebwallet
