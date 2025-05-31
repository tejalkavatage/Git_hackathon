// Helper to send message to content script in active tab with error handling
function sendMessageToActiveTab(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('No active tab found');
      return;
    }

    const tab = tabs[0];
    
    // Check if we can inject scripts into this tab
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      alert('Voice Form Filler cannot work on browser internal pages. Please navigate to a regular website with forms.');
      return;
    }

    // First, ensure content script is injected
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to inject content script:', chrome.runtime.lastError);
        alert('Failed to inject content script. Please refresh the page and try again.');
        return;
      }

      // Small delay to ensure content script is ready
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Message sending failed:', chrome.runtime.lastError);
            // Try to inject content script again and retry
            retryWithContentScriptInjection(tab.id, message, callback);
          } else if (callback) {
            callback(response);
          }
        });
      }, 100);
    });
  });
}

// Retry mechanism with content script re-injection
function retryWithContentScriptInjection(tabId, message, callback) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Retry: Failed to inject content script:', chrome.runtime.lastError);
      alert('Unable to activate voice form filler. Please refresh the page and try again.');
      return;
    }

    // Wait a bit longer for the content script to initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Retry failed:', chrome.runtime.lastError);
          alert('Voice Form Filler failed to start. Please refresh the page and try again.');
        } else if (callback) {
          callback(response);
        }
      });
    }, 500);
  });
}

// Check if content script is already loaded
function checkContentScriptLoaded(tabId, callback) {
  chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

// Voice form filling button
document.getElementById('voice-fill-btn').addEventListener('click', () => {
  const button = document.getElementById('voice-fill-btn');
  const originalText = button.textContent;
  
  // Show loading state
  button.textContent = '🔄 Starting...';
  button.disabled = true;
  
  sendMessageToActiveTab({ action: 'startVoiceFormFilling' }, (response) => {
    if (response && response.status) {
      // Show success briefly before closing
      button.textContent = '✅ Started!';
      button.style.background = '#28a745';
      
      setTimeout(() => {
        window.close();
      }, 800);
    } else {
      // Reset button on error
      button.textContent = originalText;
      button.disabled = false;
      button.style.background = '';
    }
  });
});

// Video control buttons with enhanced error handling
document.querySelectorAll('.video-btn').forEach(button => {
  button.addEventListener('click', () => {
    const command = button.getAttribute('data-video-command');
    const originalText = button.textContent;
    const originalBackground = button.style.background;
    
    // Show loading state
    button.textContent = '⏳ Working...';
    button.disabled = true;
    
    sendMessageToActiveTab({ action: 'videoControl', command }, (response) => {
      if (response && response.status) {
        // Show success indication
        button.textContent = '✅ Done';
        button.style.background = '#28a745';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = originalBackground;
          button.disabled = false;
        }, 1500);
      } else {
        // Reset button on error
        button.textContent = originalText;
        button.style.background = originalBackground;
        button.disabled = false;
        
        // Show error if no videos found
        if (response && response.error && response.error.includes('No videos')) {
          alert('No videos found on this page.');
        }
      }
    });
  });
});

// Add some helpful status information
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a compatible page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];
      
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        // Show warning for unsupported pages
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
          background: #fff3cd;
          color: #856404;
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          border: 1px solid #ffeaa7;
          font-size: 12px;
          text-align: center;
        `;
        warningDiv.textContent = '⚠️ Cannot work on browser internal pages. Navigate to a regular website.';
        document.body.insertBefore(warningDiv, document.body.firstChild);
        
        // Disable buttons
        document.querySelectorAll('button').forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.5';
        });
      }
    }
  });
});