import { Document, Font, Image, Page, PDFViewer, StyleSheet, Text, View } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { StoreOrder } from '../../../schemas/storeOrders.schema'
import { selectProductsWithBestPromo } from '../../../store/selectors/productsWithPromo'
import { all_units } from '../../../types/storeOrders'
import { formatDate } from '../../../utils/date'
import { formatMoney } from '../../../utils/money'

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
    fontSize: 12,
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
  mb2: {
    marginBottom: 8
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
    width: 150,
    height: 150
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
  const products = useSelector(selectProductsWithBestPromo)

  useEffect(() => {
    const qrCreate = async () => {
      if (!orderData) return
      const qrCode = await QRCode.toDataURL(import.meta.env.VITE_PUBLIC_BASE_URL + '/pedido-qr/' + orderData.id)

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
          <View style={[styles.flexRow, { justifyContent: 'space-between' }, styles.mb4]}>
            <Text>ID: {orderData.id}</Text>
            <Text>Fecha: {formatDate(orderData.created_at)}</Text>
          </View>

          <View style={styles.mb4}>
            <Text style={[styles.h2]}>Detalles del pedido #{orderData.ci}</Text>
            <Line />

            {orderData.items.map((item, index) => {
              const unitInfo = all_units.find((unit) => unit.key === item.unitSelected)

              const finalPrice = item.discount ? item.price - item.discount : item.price

              return (
                <View key={index} style={[styles.flexRow, styles.mb2]}>
                  <View style={{ flexGrow: 1 }}>
                    <Text>Producto ID: {products.find((p) => p.id === item.id)?.name}</Text>
                    <Text>
                      Cantidad: {item.quantity} {item.quantity > 1 && unitInfo ? unitInfo.plural : unitInfo?.label}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text>{formatMoney(finalPrice)}</Text>
                  </View>
                </View>
              )
            })}

            <View style={[styles.flexRow, { justifyContent: 'flex-end', gap: 8 }]}>
              <Text>Costo de envío:</Text>
              <Text style={{ width: 80, textAlign: 'right' }}>{formatMoney(orderData.shipping_price)}</Text>
            </View>
            <View style={[styles.flexRow, { justifyContent: 'flex-end', gap: 8 }]}>
              <Text style={{ fontWeight: 'bold' }}>Total del pedido:</Text>
              <Text style={{ fontWeight: 'bold', width: 80, textAlign: 'right' }}>{formatMoney(orderData.order_total)}</Text>
            </View>
          </View>
          <View style={[styles.mb4]}>
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
            <View style={[styles.flexRow, { justifyContent: 'space-between' }]}>
              <Text style={[styles.h2]}>Datos de envío ({orderData.order_count})</Text>
              {orderData.delivery_route && <Text style={[styles.h2]}>Ruta {orderData.delivery_route}</Text>}
            </View>
            <Line />
          </View>
          <View style={styles.flexRow}>
            <View style={[styles.flexRow, { flexGrow: 1, justifyContent: 'space-between' }]}>
              <View style={[styles.section]}>
                <Text>Nombre: {orderData.name}</Text>
                <Text>Teléfono: {orderData.phone}</Text>
                {orderData.email && <Text>Correo electrónico: {orderData.email}</Text>}
                <Text>Nombre: {orderData.full_name}</Text>
                <Text>Teléfono: {orderData.phone}</Text>
                <Text style={{ marginTop: 10 }}>Dirección</Text>
                <Text>
                  {orderData.street_address}, {orderData.street_number}, {orderData.interior_number}, {orderData.sublocality},{' '}
                  {orderData.postal_code}
                </Text>
                <Text>Referencias de entrega: {orderData.address_notes}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center', border: '2px dashed black', padding: '1px' }}>
              <Image src={orderQR} style={styles.qrImage}></Image>
              <Text style={[{ fontWeight: 'bold', fontSize: 24 }]}>P-{orderData.order_count}</Text>
            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  )
}

export default PrintOrder
