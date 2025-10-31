import React from 'react'

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  pixelBasedPreset,
  Preview,
  Row,
  Section,
  Tailwind,
  Text
} from '@react-email/components'

interface WelcomeEmailProps {
  username: string
  email: string
  verifyUrl: string
}

const raw = process.env.DEPLOY_BASE_URL ?? '' // server-side env
const baseUrl = raw
  ? raw.replace(/\/$/, '') // sin slash final
  : 'http://localhost:8888' // fallback dev

export const WelcomeEmail = ({ username, verifyUrl, email }: WelcomeEmailProps) => {
  if (!React) return null

  return (
    <Html lang='es'>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: '#2250f4',
                offwhite: '#fafbfb'
              },
              spacing: {
                0: '0px',
                20: '20px',
                45: '45px'
              }
            }
          }
        }}
      >
        <Preview>Te has registrado en Qonderstore</Preview>
        <Body className='bg-gray-100 font-sans text-base'>
          <Img
            src={`https://qonderstore-dev.netlify.app/branding/logo-full-black.png`}
            width='280'
            alt='Qonderstore'
            className='mx-auto my-10'
          />
          <Container className='bg-white p-45'>
            <Heading className='my-0 text-center leading-8 text-2xl'>Bienvenido a bordo {username}</Heading>

            <Section>
              <Row>
                <Text className='text-base'>
                  Te has registrado correctamente en nuestro sitio, nuestro equipo esta revisando tu solicitud y pronto tendrás una
                  respuesta.
                </Text>

                <Text className='text-base'>
                  Si lo deseas puedes contactarnos directamente por <Link href='https://wa.me/1234567890'>Whatsapp</Link> para agilizar el
                  proceso. Mientras tanto, te sugerimos que verifiques tu correo electrónico haciendo click en el siguiente botón.
                </Text>
              </Row>
            </Section>

            <Section className='text-center'>
              <Button className='rounded-lg bg-brand px-[18px] py-3 text-white' href={verifyUrl}>
                Verifica tu correo
              </Button>
            </Section>
          </Container>

          <Container>
            <Text className='text-xs text-justify  text-gray-400 px-2 mt-2 '>
              Este correo está dirigido a {email} y puede contener información confidencial. Si no eres el destinatario, elimínalo y
              notifícalo al remitente. No respondas a este correo. Este buzón no recibe mensajes. Para cualquier duda o seguimiento,
              comunícate con nosotros a través de nuestros canales oficiales.
            </Text>

            <Section>
              <Row>
                <Column className='px-20 text-center'>
                  <Link>Preguntas frecuentes</Link>
                </Column>
                <Column className='text-center'>
                  <Link>Aviso de privacidad</Link>
                </Column>
                <Column className='text-center'>
                  <Link>Términos y condiciones</Link>
                </Column>
              </Row>
            </Section>

            <Text className='mb-45 text-center text-gray-400'>Qonderstore &copy; {new Date().getFullYear()}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  username: 'Kevin',
  email: 'usuario@example.com',
  verifyUrl: baseUrl + '/verificar-email?token=exampletoken123'
} satisfies WelcomeEmailProps

export default WelcomeEmail
