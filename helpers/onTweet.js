function formatTweet(tweet, counter) {
  return {
    tweet: {
      profilePicture: tweet.user.profile_image_url.replace('_normal', ''),
      userName: tweet.user.name,
      screenName: `@${tweet.user.screen_name}`,
      content: tweet.text,
      media: tweet.entities.media ? tweet.entities.media[0].media_url : '',
      id: tweet.id_str,
    },
    counter,
  }
}

function canHaveWinner(board) {
  return (board.giveway === 'EVERY'
  || (board.giveway === 'AT' && board.counter < board.winnerRate))
}

function getBoardsFromHashtag(boards, tweet) {
  const hashtags = tweet.entities.hashtags.map((h) => h.text)
  const related = []
  Object.keys(boards).forEach((key) => {
    if (hashtags.includes(boards[key].hashtag)) {
      related.push(boards[key])
    }
  })
  return related
}

function onTweet({ tweet, boards }) {
  const related = getBoardsFromHashtag(boards, tweet)
  let board
  for (let i = 0; i < related.length; i += 1) {
    board = related[i]
    if (canHaveWinner(board)
    && board.counter % board.winnerRate === board.winnerIndex) {
      board.winner = formatTweet(tweet, board.counter)
    }
    board.counter += 1
    for (let j = 0; j < board.sockets.length; j += 1) {
      board.sockets[j].emit('tweet', formatTweet(tweet, board.counter))
      if (canHaveWinner(board)
        && board.counter % board.winnerRate === 0 && board.counter > 0) {
        board.sockets[j].emit('winner', board.winner)
      }
    }
  }
}

module.exports = onTweet
