//change to dynamic import
let api = null
async function load(key) {
    const ChatGPT = await import('chatgpt')
    const ChatGPTAPI = ChatGPT.ChatGPTAPI
    const apiX = new ChatGPTAPI({
      apiKey: key,
      completionParams: {
        model: 'text-davinci-003'
      }
    })
    api = apiX

  }


const predict = async (text) => {
  if (api == null)
    await load("sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  const res = await api.sendMessage(text);
  return res.text;
}



/**

 */

module.exports = predict