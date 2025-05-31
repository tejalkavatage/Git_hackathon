chrome.runtime.onInstalled.addListener(() => {
    // Initialize default settings
    chrome.storage.sync.set({
      accessibilitySettings: {
        voiceControl: true,
        colorBlindMode: 'none',
        textToSpeech: true,
        summarization: true
      }
    });
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateSummary') {
      // Potential future server-side processing
      sendResponse({ status: 'success' });
    }
  });