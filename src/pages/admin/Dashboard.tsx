import { addToast, Button } from '@heroui/react'

const Dashboard = () => {
  return (
    <div className='flex flex-col gap-4 p-4'>
      Dashboard
      <Button onClick={() => addToast({ title: 'Sistema de toasts activo' })} className='max-w-xs'>
        Mostrar Toast
      </Button>
    </div>
  )
}

export default Dashboard
