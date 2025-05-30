// Helper to send message to content script in active tab
function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, message, callback);
    });
  }
  
  // Voice form filling button
  document.getElementById('voice-fill-btn').addEventListener('click', () => {
    sendMessageToActiveTab({ action: 'startVoiceFormFilling' }, (response) => {
      if (response) alert(response.status);
    });
  });
  
  // Video control buttons
  document.querySelectorAll('.video-btn').forEach(button => {
    button.addEventListener('click', () => {
      const command = button.getAttribute('data-video-command');
      sendMessageToActiveTab({ action: 'videoControl', command }, (response) => {
        if (response) alert(response.status);
      });
    });
  });
  
  // Summarize page button
  document.getElementById('summarize-btn').addEventListener('click', () => {
    // Extract text from page first
    sendMessageToActiveTab({ action: 'extractText' }, (response) => {
      if (!response || !response.text) {
        alert('Failed to extract page text.');
        return;
      }
      // Send text to background for summarization
      chrome.runtime.sendMessage({ action: 'summarize', text: response.text }, (res) => {
        if (res.error) {
          alert('Error: ' + res.error);
        } else {
          document.getElementById('summary').textContent = res.summary;
        }
      });
    });
  });
  
  // Colorblind filter buttons
  document.querySelectorAll('.color-btn').forEach(button => {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-color-type');
      sendMessageToActiveTab({ action: 'applyColorFilter', type }, (response) => {
        if (response) alert(response.status);
      });
    });
  });
  
  // Remove color filter button
  document.getElementById('remove-color-filter').addEventListener('click', () => {
    sendMessageToActiveTab({ action: 'removeColorFilter' }, (response) => {
      if (response) alert(response.status);
    });
  });
  
  // Text-to-speech button
  document.getElementById('read-aloud-btn').addEventListener('click', () => {
    sendMessageToActiveTab({ action: 'readPageAloud' }, (response) => {
      if (response) alert(response.status);
    });
  });