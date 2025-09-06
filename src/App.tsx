import { Accordion, AccordionItem, Button } from '@heroui/react'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='container mx-auto p-4'>
      <div>
        <a href='https://vite.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className='card'>
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>

        <Button color='primary' size='lg'>
          Este es un boton de hero
        </Button>
      </div>
      <p className='read-the-docs'>Click on the Vite and React logos to</p>

      <Accordion>
        <AccordionItem key='1' aria-label='Accordion 1' title='Accordion 1'>
          asasasas
        </AccordionItem>
        <AccordionItem key='2' aria-label='Accordion 2' title='Accordion 2'>
          fdddfdsfds
        </AccordionItem>
        <AccordionItem key='3' aria-label='Accordion 3' title='Accordion 3'>
          dfdsfdsfds
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default App
