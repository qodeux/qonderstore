import { Button } from '@heroui/react'
import { useEffect, useState } from 'react'
import supabase from '../../lib/supabase'

export default function LoggedUser() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <div>No logeado</div>
  } else {
    return (
      <div className='w-full'>
        Logged in!
        <Button onClick={() => supabase.auth.signOut()}>Cerrar sesión</Button>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
    )
  }
}
