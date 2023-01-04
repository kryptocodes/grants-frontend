import React from 'react'
import {
	Box,
	Flex, Text, } from '@chakra-ui/react'
import { EditorState } from 'draft-js'
import TextEditor from 'src/libraries/ui/RichTextEditor/textEditor'

interface RichTextEditorProps {
  label?: string
  value: EditorState
  onChange: (e: EditorState) => void
  placeholder?: string
  isError: boolean
  errorText?: string
  subtext?: string | null | undefined
  maxLength?: number
  disabled?: boolean
  visible?: boolean
}

const defaultProps = {
	label: '',
	placeholder: '',
	subtext: '',
	maxLength: -1,
	disabled: false,
	tooltip: '',
	errorText: '',
	visible: true,
}

function RichTextEditor({
	label,
	value,
	onChange,
	placeholder,
	isError,
	errorText,
	subtext,
	visible,
	disabled,
}: RichTextEditorProps) {
	return (
		<Flex
			flex={1}
			direction='column'
			display={visible ? '' : 'none'}>
			<Text
				lineHeight='20px'
				fontWeight='bold'
				mb={1}>
				{label}
			</Text>
			<TextEditor
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				readOnly={disabled}
			/>
			{
				(subtext?.length) || (isError && errorText && errorText?.length) ? (
					<Box mt={1} />
				) : null
			}
			{
				isError && errorText && errorText?.length && (
					<Text
						fontSize='14px'
						color='#EE7979'
						fontWeight='700'
						lineHeight='20px'
					>
						{errorText}
					</Text>
				)
			}
			{
				(subtext?.length || 0) > 0 && (
					<Text
						fontSize='12px'
						color='#717A7C'
						fontWeight='400'
						lineHeight='20px'
					>
						{subtext}
					</Text>
				)
			}
		</Flex>
	)
}

RichTextEditor.defaultProps = defaultProps
export default RichTextEditor
