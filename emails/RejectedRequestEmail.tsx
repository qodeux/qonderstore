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

interface RejectedEmailProps {
  email: string
}

const raw = process.env.PUBLIC_BASE_URL ?? '' // server-side env
const baseUrl = raw
  ? raw.replace(/\/$/, '') // sin slash final
  : 'http://localhost:8888' // fallback dev

export const RejectedRequestEmail = ({ email }: RejectedEmailProps) => {
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
        <Preview>Tu solcitud ha sido rechazada</Preview>
        <Body className='bg-gray-100 font-sans text-base'>
          <Img
            src={`https://qonderstore-dev.netlify.app/branding/logo-full-black.png`}
            width='280'
            alt='Qonderstore'
            className='mx-auto my-10'
          />
          <Container className='bg-white p-45'>
            <Heading className='my-0 text-center leading-8 text-2xl'>Ups! Tu solicitud fue rechazada</Heading>

            <Section>
              <Row>
                <Text className='text-base'>
                  Lamentablemente nuestro equipo no logro reunir las bases suficientes para aprobar tu solicitud.
                </Text>

                <Text className='text-base'>
                  Si lo deseas puedes contactarnos directamente para revisar tu caso y resolver cualquier duda que tengas.
                </Text>
              </Row>
            </Section>

            <Section className='text-center'>
              <Button className='rounded-lg bg-brand px-[18px] py-3 text-white' href='https://wa.me/1234567890'>
                Contactar por WhatsApp
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
                  <Link href={`${baseUrl}/faq`}>Preguntas frecuentes</Link>
                </Column>
                <Column className='text-center'>
                  <Link href={`${baseUrl}/privacidad`}>Aviso de privacidad</Link>
                </Column>
                <Column className='text-center'>
                  <Link href={`${baseUrl}/terminos-y-condiciones`}>Términos y condiciones</Link>
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

RejectedRequestEmail.PreviewProps = {
  email: 'usuario@example.com'
} satisfies RejectedEmailProps

export default RejectedRequestEmail
