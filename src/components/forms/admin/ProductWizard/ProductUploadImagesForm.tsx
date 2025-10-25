import RHF_R2Uploader from '../../../common/UploaderR2'

const ProductUploadImagesForm = () => {
  return (
    <div>
      <RHF_R2Uploader name='images' prefix='products' mode='private' maxFiles={4} maxSize={1 * 1024 * 1024} previewExpiresIn={180} />
    </div>
  )
}

export default ProductUploadImagesForm
