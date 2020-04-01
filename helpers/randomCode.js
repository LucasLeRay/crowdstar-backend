function randomCode() {
  return (Math.random() * 10000).toString().slice(0, 4).replace('.', '0')
}

module.exports = randomCode
