import { Button } from '@heroui/react'

const Confirmation = () => {
  return (
    <form className='flex w-full flex-col text-center space-y-4 '>
      <h4 className='font-bold text-xl'>Confirmación</h4>

      <p className='text-sm'>
        Tu solicitud ha sido recibida, puedes contactarnos directamente para agilizar el proceso o esperar a que nuestro equipo se comunique
        contigo.
      </p>
      <Button variant='ghost' color='success' size='md'>
        Enviar mensaje por WhatsApp
      </Button>
    </form>
  )
}

export default Confirmation
