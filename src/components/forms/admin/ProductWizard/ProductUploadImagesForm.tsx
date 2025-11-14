import UploaderR2 from '../../../common/UploaderR2'

const ProductUploadImagesForm = () => {
  return (
    <div>
      <UploaderR2 name='images' prefix='products' mode='private' maxFiles={4} maxSize={1 * 1024 * 1024} previewExpiresIn={180} />
    </div>
  )
}

export default ProductUploadImagesForm
