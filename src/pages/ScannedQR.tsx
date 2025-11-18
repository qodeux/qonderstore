import { useNavigate, useParams } from 'react-router'
import { useAppSelector } from '../store/store'

const ScannedQR = () => {
  const { id } = useParams()
  const { user } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()

  console.log(id)

  if (!user) {
    window.location.href = 'https://google.com'

    return
  }

  switch (user?.role) {
    case 'admin':
      navigate('/admin/')
      break

    case 'staff':
      navigate('/admin/orden/' + id)
      break

    case 'customer':
      navigate('/mi-cuenta?tab=pedidos')
      break
  }

  return <div>ScannedQR</div>
}

export default ScannedQR
