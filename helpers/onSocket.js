function newBoard(socket, {
  hashtag, giveway, winnerRate,
}) {
  return {
    hashtag,
    giveway: winnerRate === 0 ? 'NONE' : giveway,
    winnerRate,
    winnerIndex: ['EVERY', 'AT'].includes(giveway)
      && Math.floor(Math.random() * winnerRate),
    counter: 0,
    sockets: [socket],
  }
}

function getBoardFromSocket(boards, socket) {
  let key
  Object.keys(boards).forEach((keyBoard) => {
    for (let i = 0; i < boards[keyBoard].sockets.length; i += 1) {
      if (boards[keyBoard].sockets[i].id === socket.id) {
        key = keyBoard
      }
    }
  })
  return key
}

function isHashtagUsed(boards, hashtag) {
  let usedHashtag
  Object.keys(boards).forEach((keyBoard) => {
    if (boards[keyBoard].hashtag === hashtag) {
      usedHashtag = true
    }
  })
  return usedHashtag
}

function onDisconnect(boards, socket, tw) {
  const key = getBoardFromSocket(boards, socket)
  const board = boards[key]
  let toRemove = false
  if (!board) return toRemove
  board.sockets = board.sockets.filter((elem) => elem.id !== socket.id)
  if (!board.sockets.length) {
    const { hashtag } = board
    let usedHashtag = false
    toRemove = key
    usedHashtag = isHashtagUsed(boards, hashtag)
    if (!usedHashtag) {
      tw.untrack(`#${hashtag}`)
    }
  }
  return toRemove
}

module.exports = {
  newBoard,
  onDisconnect,
}
