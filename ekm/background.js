// Replace with your OpenAI API key (keep it secret!)
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

// Function to call OpenAI API for summarization
async function summarizeText(text) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: `Summarize this website content briefly:\n\n${text}` }],
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeText(request.text)
      .then(summary => sendResponse({ summary }))
      .catch(err => sendResponse({ error: err.message }));
    return true; // Keep channel open for async response
  }
});