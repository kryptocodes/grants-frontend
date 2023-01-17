import { Button, ButtonProps, Text } from '@chakra-ui/react'
import { TagType } from 'src/screens/dashboard/_utils/types'

type Props = {
    tag: TagType
    isSelected: boolean
    index: number
} & ButtonProps

function QuickReplyButton({ tag, isSelected, index, ...props }: Props) {
	const buildComponent = () => {
		return (
			<Button
				key={index}
				variant='outline'
				justifyContent='start'
				py={1}
				px={3}
				borderRadius='12px'
				leftIcon={tag.icon}
				bg={ isSelected ? 'gray.3' : 'white'}
				border='1px solid #E7E4DD'
				{...props}
			>
				<Text
					variant='v2_body'
					fontWeight={isSelected ? 'bold' : 'normal'}
				>
					{tag.title}
				</Text>
			</Button>
		)
	}

	return buildComponent()
}

export default QuickReplyButton