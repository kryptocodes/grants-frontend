import { ContentState, convertFromRaw, EditorState } from 'draft-js'
import { getFromIPFS, isIpfsHash } from 'src/libraries/utils/ipfs'
import { isSupportedAddress } from 'src/libraries/utils/validations'
import { Form, Grant } from 'src/screens/proposal_form/_utils/types'

function containsField(grant: Grant, field: string) {
	return grant?.fields?.some((f) => f.id.endsWith(field))
}

function findField(form: Form, id: string) {
	return form.fields.find((f) => f.id === id) ?? { id, value: '' }
}

function findFieldBySuffix(form: Form, suffix: string, defaultId: string) {
	// console.log('hasan', form.fields.find((f) => f.id.endsWith(suffix)))
	return form.fields.find((f) => f.id.endsWith(suffix)) ?? { id: defaultId, value: '' }
}

const getProjectDetails = async(projectDetails: string) => {
	try {
		if(isIpfsHash(projectDetails)) {
			const o = await getFromIPFS(projectDetails)
			// console.log('From IPFS: ', o)
			return EditorState.createWithContent(convertFromRaw(JSON.parse(o)))
		} else {
			// console.log('Previous text value: ', projectDetails)
			const o = JSON.parse(projectDetails)
			return EditorState.createWithContent(convertFromRaw(o))
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch(e: any) {
		if(projectDetails) {
			return EditorState.createWithContent(ContentState.createFromText(projectDetails))
		} else {
			return EditorState.createEmpty()
		}
	}
}

const validateEmail = (email: string, callback: (isValid: boolean) => void) => {
	if(email) {
		const re = /\S+@\S+\.\S+/
		callback(re.test(email))
	} else {
		callback(true)
	}
}

const validateWalletAddress = async(address: string, callback: (isValid: boolean) => void) => {
	if(address) {
		if(address === '') {
			callback(false)
		} else if(await isSupportedAddress(address)) {
			callback(true)
		} else {
			callback(false)
		}
	} else {
		callback(true)
	}
}

export { containsField, findField, getProjectDetails, validateEmail, validateWalletAddress, findFieldBySuffix }