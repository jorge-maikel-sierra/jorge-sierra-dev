import Jimp from 'jimp'

async function main() {
  try {
    const image = await Jimp.read('public/logo_original.png')

    // Convert almost-black pixels to transparent
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx]
      const g = this.bitmap.data[idx + 1]
      const b = this.bitmap.data[idx + 2]

      // If the pixel is very dark (background), make it transparent
      if (r < 20 && g < 20 && b < 20) {
        this.bitmap.data[idx + 3] = 0 // Set alpha to 0
      }
    })

    // Auto crop to remove transparent space around the logo
    image.autocrop()

    // Save as logo.png
    await image.writeAsync('public/logo.png')
    console.log('Successfully created public/logo.png')

    // Create a 32x32 favicon
    image.resize(32, 32)
    await image.writeAsync('public/favicon.ico')
    console.log('Successfully created public/favicon.ico')
  } catch (error) {
    console.error('Error processing logo:', error)
  }
}

main()
