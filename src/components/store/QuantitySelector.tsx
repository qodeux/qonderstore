import { Button, NumberInput } from '@heroui/react'
import { Minus, Plus } from 'lucide-react'

type QuantitySelectorProps = {
  quantity: number
  setQuantity: (quantity: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const QuantitySelector = ({ quantity, setQuantity, size = 'lg' }: QuantitySelectorProps) => {
  //const [quantity, setQuantity] = useState(1)

  const handleSetQuantity = (action: 'add' | 'remove') => {
    if (action === 'add') {
      setQuantity(quantity + 1)
    } else {
      setQuantity(Math.max(1, quantity - 1))
    }
  }
  return (
    <div className='flex items-center max-w-fit'>
      <Button
        isIconOnly
        size={size}
        className='rounded-r-none bg-black text-white'
        variant='solid'
        onPress={() => handleSetQuantity('remove')}
      >
        <Minus />
      </Button>
      <NumberInput
        size='sm'
        maxLength={3}
        aria-label='Cantidad'
        minValue={1}
        value={quantity}
        onValueChange={(value) => setQuantity(value || 1)}
        radius='none'
        classNames={{ mainWrapper: 'w-12 ', input: 'text-center', inputWrapper: 'border-black p-0' }}
        hideStepper
        variant='bordered'
      />
      <Button
        isIconOnly
        size={size}
        className='rounded-l-none bg-black text-white'
        variant='solid'
        onPress={() => handleSetQuantity('add')}
      >
        <Plus />
      </Button>
    </div>
  )
}

export default QuantitySelector
