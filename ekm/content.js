// Content script injected into all pages

// --- Voice Form Filling ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let currentInputIndex = 0;
let inputs = [];

function startVoiceFormFilling() {
  if (!SpeechRecognition) {
    alert('Speech Recognition API not supported in this browser.');
    return;
  }

  // Find all visible, enabled form inputs
  inputs = Array.from(document.querySelectorAll('input, textarea, select'))
    .filter(el => !el.disabled && el.offsetParent !== null);

  if (inputs.length === 0) {
    alert('No form inputs found on this page.');
    return;
  }

  currentInputIndex = 0;
  focusInput(currentInputIndex);

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log('Recognized:', transcript);
    fillInput(inputs[currentInputIndex], transcript);
    currentInputIndex++;
    if (currentInputIndex < inputs.length) {
      focusInput(currentInputIndex);
      recognition.start();
    } else {
      submitForm();
      recognition.stop();
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    recognition.stop();
  };

  recognition.onend = () => {
    if (currentInputIndex < inputs.length) {
      recognition.start();
    }
  };

  recognition.start();
}

function focusInput(index) {
  inputs[index].focus();
}

function fillInput(input, value) {
  if (input.tagName === 'SELECT') {
    const option = Array.from(input.options).find(o => o.text.toLowerCase() === value.toLowerCase());
    if (option) input.value = option.value;
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function submitForm() {
  const form = inputs[0].form;
  if (form) {
    form.submit();
    alert('Form submitted!');
  } else {
    alert('No form found to submit.');
  }
}

// --- Video Control ---

function controlVideos(command) {
  const videos = document.querySelectorAll('video');
  if (videos.length === 0) {
    alert('No videos found on this page.');
    return;
  }
  videos.forEach(video => {
    switch (command) {
      case 'play':
        video.play();
        break;
      case 'pause':
        video.pause();
        break;
      case 'rewind':
        video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case 'forward':
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        break;
    }
  });
}

// --- Extract main text for summarization ---

function extractMainText() {
  // Simple approach: get visible text from body
  return document.body.innerText;
}

// --- Colorblind Assistance ---

function applyColorblindFilter(type) {
  let filter = '';
  switch(type) {
    case 'protanopia':
      filter = 'grayscale(100%) contrast(1.2)'; // Simplified example
      break;
    case 'deuteranopia':
      filter = 'grayscale(50%) contrast(1.1)';
      break;
    case 'tritanopia':
      filter = 'sepia(0.5)';
      break;
    default:
      filter = 'none';
  }
  document.documentElement.style.filter = filter;
}

function removeColorblindFilter() {
  document.documentElement.style.filter = 'none';
}

// --- Text-to-Speech ---

function readPageAloud() {
  const text = document.body.innerText;
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

// --- Listen for messages from popup ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'startVoiceFormFilling':
      startVoiceFormFilling();
      sendResponse({ status: 'Voice form filling started' });
      break;
    case 'videoControl':
      controlVideos(request.command);
      sendResponse({ status: `Video command '${request.command}' executed` });
      break;
    case 'extractText':
      sendResponse({ text: extractMainText() });
      break;
    case 'applyColorFilter':
      applyColorblindFilter(request.type);
      sendResponse({ status: `Color filter '${request.type}' applied` });
      break;
    case 'removeColorFilter':
      removeColorblindFilter();
      sendResponse({ status: 'Color filter removed' });
      break;
    case 'readPageAloud':
      readPageAloud();
      sendResponse({ status: 'Reading page aloud' });
      break;
    default:
      sendResponse({ error: 'Unknown action' });
  }
  return true; // Keep message channel open for async response if needed
});