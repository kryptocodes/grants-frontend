import { useState } from 'react'
import { Flex, FlexProps, Input, InputProps, Text } from '@chakra-ui/react'

interface Props extends InputProps {
    helperText?: string
	textPadding?: number
	flexProps?: FlexProps
}

function FlushedInput({ helperText, textPadding = 2, flexProps, ...props }: Props) {
	const [value, setValue] = useState<string>(props?.value?.toString() ?? '')

	return (
		<>
			<Flex
				direction='column'
				{...flexProps}
			>
				<Input
					variant='flushed'
					borderBottom='5px solid'
					borderColor={value ? 'black' : 'gray.300'}
					fontWeight='400'
					fontSize='20px'
					minWidth={`${(props?.placeholder?.length || 0) + textPadding * 2}ch`}
					width={value !== '' ? `${(value?.toString()?.length || 0) + textPadding}ch` : `${(props?.placeholder?.length || 0) + textPadding}ch`}
					textAlign={props?.textAlign ? props?.textAlign : 'center'}
					onChange={
						(e) => {
							setValue(e.target.value)
							props?.onChange?.(e)
						}
					}
					{...props}
					 />
				{
					helperText && (
						<Text
							mt={2}
							variant='v2_helper_text'>
							{helperText}
						</Text>
					)
				}
			</Flex>
		</>
	)
}

export default FlushedInput