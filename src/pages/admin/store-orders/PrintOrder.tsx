import { Document, Font, Image, Page, PDFViewer, StyleSheet, Text, View } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { StoreOrder } from '../../../schemas/storeOrders.schema'

//Registro de fuente
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: '/fonts/Roboto-Regular.ttf',
      fontWeight: 'normal'
    },
    {
      src: '/fonts/Roboto-SemiBold.ttf',
      fontWeight: 'semibold'
    },
    {
      src: '/fonts/Roboto-Bold.ttf',
      fontWeight: 'bold'
    }
  ]
})

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 20
  },
  flexRow: {
    flexDirection: 'row'
  },
  grid: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between'
  },
  h1: {
    fontSize: 24,
    marginBottom: 10
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  mb4: {
    marginBottom: 16
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  line: {
    height: 2,
    backgroundColor: '#000',
    marginVertical: 10
  },
  fullBorder: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
    marginVertical: 5
  },
  signSquare: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  signLine: {
    width: '80%',
    height: 1,
    backgroundColor: '#000',
    marginVertical: 5
  },
  qrImage: {
    width: 200,
    height: 200
  }
})

const Line = () => <View style={styles.line} />

// Create Document Component
const PrintOrder = () => {
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      window.location.reload()
    })
  }

  const [orderQR, setOrderQR] = useState<string>('')

  const sessionData = sessionStorage.getItem('admin_selected_store_order')
  const orderData: StoreOrder = JSON.parse(sessionData ?? 'null')

  useEffect(() => {
    const qrCreate = async () => {
      if (!orderData) return
      const qrCode = await QRCode.toDataURL(import.meta.env.VITE_PUBLIC_BASE_URL + '/pedido-qr/' + orderData.id)

      console.log(qrCode)

      setOrderQR(qrCode)
    }

    qrCreate()
  }, [orderData])

  if (!sessionData) {
    return <div>No hay datos de la orden</div>
  }

  return (
    <PDFViewer width='100%' className='min-h-screen'>
      <Document language='es'>
        <Page size='LETTER' style={styles.page}>
          <View>
            <Text>Consecutivo: {orderData.ci}</Text>
          </View>

          <Line />

          <View style={styles.h2}>
            <Text>Datos generales</Text>
          </View>
          <View>
            <Text>ID: {orderData.id}</Text>
            <Text>Fecha: {orderData.phone}</Text>
          </View>

          <View style={styles.flexRow}>
            <View style={styles.section}>
              <Text>Datos de contacto</Text>
              <Text>Nombre: {orderData.name}</Text>
              <Text>Teléfono: {orderData.phone}</Text>
              {orderData.email && <Text>Correo electrónico: {orderData.email}</Text>}
            </View>
            <View style={styles.section}>
              <Text>Datos de envío</Text>
            </View>
          </View>

          <View>
            <Text style={[styles.h2]}>Detalles del pedido</Text>
            <Line />
          </View>
          <View>
            <Text style={[styles.h2]}>Datos de control</Text>
            <Line />
            <View style={[styles.flexRow, { gap: 12 }]}>
              <View style={[styles.fullBorder, styles.signSquare, { flexGrow: 1, height: 120 }]}>
                <Text>Bodega - Suministro</Text>
                <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                  <View style={styles.signLine}></View>
                  <Text>Firma</Text>
                </View>
              </View>
              <View style={[styles.fullBorder, styles.signSquare, { flexGrow: 1, height: 120 }]}>
                <Text>Embalaje - Envío</Text>

                <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                  <View style={styles.signLine}></View>
                  <Text>Firma</Text>
                </View>
              </View>
            </View>
          </View>
          <View>
            <Text style={[styles.h2]}>Etiqueta</Text>
            <Line />
            <View style={styles.flexRow}>
              <View style={{ flexGrow: 1, alignItems: 'center' }}>
                <Text>Numero 1</Text>
              </View>
              <View style={{ flexGrow: 1, alignItems: 'center' }}>
                <Image src={orderQR} style={styles.qrImage}></Image>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  )
}

export default PrintOrder
