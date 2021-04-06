const multer = require('multer')

const calculateImageDimentions = (width, height, maxSize) => {
    const newDimentions = {}

    if (width > height) {
        newDimentions.width = maxSize
        newDimentions.height = parseInt(newDimentions.width * (height / width))
    } else {
        newDimentions.height = maxSize
        newDimentions.width = parseInt(newDimentions.height * (width / height))
    }
    
    return newDimentions
}

const upload = multer({
    limits: {
        fileSize: 1e6
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            callback(new Error('Please upload an image file'))
            return
        }
        callback(undefined, true)
    }
})


module.exports = {
    calculateImageDimentions,
    upload
}