const calculateImageDimentions = (width, height, maxSize) => {
    const newDimentions = {}

    if (width > height) {
        newDimentions.width = maxSize
        newDimentions.height = parseInt(newDimentions.width * (height / width))
    } else {
        newDimentions.height = maxSize
        newDimentions.width = parseInt(newDimentions.height * (width / height))
    }
    
    console.log(newDimentions)
    return newDimentions
}

module.exports = {
    calculateImageDimentions
}