import { Button, InputOtp } from '@heroui/react'
import { Controller, useFormContext } from 'react-hook-form'
import { useWizard } from 'react-use-wizard'

const OTPCode = () => {
  const { control } = useFormContext()
  const { previousStep, nextStep } = useWizard()

  return (
    <form className='flex w-full flex-col space-y-2  text-center'>
      <h4 className='font-bold text-xl'>Código de verificación</h4>

      <div className='flex justify-center'>
        <Controller
          name='alias'
          control={control}
          render={({ field, fieldState }) => (
            <InputOtp length={4} value={field.value} onValueChange={field.onChange} size='lg' onComplete={nextStep} autoFocus />
          )}
        />
      </div>

      <p className='text-sm'>Ingresa el código de verificación que hemos enviado a tu teléfono móvil.</p>

      <p className='text-xs'>¿No recibiste el código? Solicita uno nuevo o comprueba tu número de teléfono.</p>

      <Button variant='ghost' color='primary' size='md' className='w-full mt-2' onPress={previousStep}>
        Regresar
      </Button>
    </form>
  )
}

export default OTPCode
