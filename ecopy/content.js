// Content script injected into all pages

// --- Enhanced Voice Form Filling with Better Field Identification ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let currentInputIndex = 0;
let inputs = [];
let isListening = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Enhanced field type detection patterns
const FIELD_PATTERNS = {
  email: ['email', 'e-mail', 'mail', 'contact'],
  phone: ['phone', 'tel', 'mobile', 'number', 'contact'],
  name: ['name', 'first', 'last', 'full', 'fname', 'lname'],
  address: ['address', 'street', 'city', 'zip', 'postal', 'location'],
  date: ['date', 'birth', 'dob', 'birthday', 'born'],
  password: ['password', 'pass', 'pwd', 'secret'],
  age: ['age', 'years', 'old'],
  gender: ['gender', 'sex'],
  company: ['company', 'organization', 'employer', 'work'],
  title: ['title', 'position', 'job', 'role'],
  website: ['website', 'url', 'site', 'link'],
  country: ['country', 'nation'],
  state: ['state', 'province', 'region'],
  comment: ['comment', 'message', 'note', 'feedback', 'description']
};

// Voice command mappings for better recognition
const VOICE_CORRECTIONS = {
  'at': '@',
  'dot': '.',
  'dash': '-',
  'underscore': '_',
  'space': ' ',
  'comma': ',',
  'period': '.',
  'exclamation': '!',
  'question mark': '?',
  'hashtag': '#',
  'dollar': '$',
  'percent': '%',
  'ampersand': '&',
  'plus': '+',
  'equals': '=',
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
};

function startVoiceFormFilling() {
  if (!SpeechRecognition) {
    alert('Speech Recognition API not supported in this browser.');
    return;
  }

  // Enhanced input detection with better filtering
  inputs = Array.from(document.querySelectorAll('input, textarea, select'))
    .filter(el => {
      return !el.disabled && 
             !el.hidden && 
             el.offsetParent !== null &&
             el.type !== 'hidden' &&
             el.type !== 'submit' &&
             el.type !== 'button' &&
             window.getComputedStyle(el).display !== 'none' &&
             window.getComputedStyle(el).visibility !== 'hidden';
    });

  if (inputs.length === 0) {
    alert('No form inputs found on this page.');
    return;
  }

  currentInputIndex = 0;
  retryCount = 0;
  setupEnhancedRecognition();
  
  // Announce form filling start
  const totalFields = inputs.length;
  const announcement = `Starting voice form filling. Found ${totalFields} field${totalFields === 1 ? '' : 's'} to fill.`;
  speakText(announcement);
  
  setTimeout(() => startListeningForField(), 2000);
}

function setupEnhancedRecognition() {
  recognition = new SpeechRecognition();
  
  // Enhanced recognition settings for better accuracy
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5; // Get multiple alternatives
  
  // Adjust recognition settings based on browser
  if (recognition.serviceURI) {
    recognition.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
  }

  recognition.onstart = () => {
    isListening = true;
    highlightCurrentField();
    const fieldInfo = getDetailedFieldInfo();
    showVoiceStatus(`🎤 Listening for: ${fieldInfo.label}`);
  };

  recognition.onresult = (event) => {
    isListening = false;
    const results = event.results[0];
    let bestTranscript = '';
    let highestConfidence = 0;

    // Find the result with highest confidence
    for (let i = 0; i < results.length; i++) {
      if (results[i].confidence > highestConfidence) {
        highestConfidence = results[i].confidence;
        bestTranscript = results[i].transcript;
      }
    }

    // Fallback to first result if no confidence scores
    if (!bestTranscript) {
      bestTranscript = results[0].transcript;
    }

    console.log('Voice Input - Raw:', bestTranscript, 'Confidence:', highestConfidence);
    
    // Process and clean the transcript
    const processedText = processVoiceInput(bestTranscript.trim(), inputs[currentInputIndex]);
    
    // Confirm input with user if confidence is low
    if (highestConfidence < 0.7 && highestConfidence > 0) {
      confirmInput(processedText, inputs[currentInputIndex]);
    } else {
      fillCurrentField(processedText);
    }
  };

  recognition.onerror = (event) => {
    isListening = false;
    console.error('Speech recognition error:', event.error);
    
    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        const fieldInfo = getDetailedFieldInfo();
        showVoiceStatus(`No speech detected. Retry ${retryCount}/${MAX_RETRIES}`);
        speakText(`No speech detected. Please try again for ${fieldInfo.readableLabel}`);
        setTimeout(() => startListeningForField(), 2000);
        return;
      }
    }
    
    showVoiceStatus('Voice recognition error. Retrying...');
    speakText('Voice recognition error. Please try again.');
    setTimeout(() => {
      if (currentInputIndex < inputs.length) {
        startListeningForField();
      }
    }, 3000);
  };

  recognition.onend = () => {
    isListening = false;
    // Auto-restart if we're still in the middle of form filling
    if (currentInputIndex < inputs.length && !recognition.aborted) {
      setTimeout(() => startListeningForField(), 500);
    }
  };
}

function getDetailedFieldInfo() {
  const input = inputs[currentInputIndex];
  const fieldLabel = getFieldLabel(input);
  const fieldType = detectFieldType(input);
  const position = `${currentInputIndex + 1} of ${inputs.length}`;
  
  // Create a more descriptive label
  let readableLabel = fieldLabel || `Field ${currentInputIndex + 1}`;
  let typeDescription = getTypeDescription(fieldType, input);
  
  // Clean up the label
  readableLabel = cleanFieldLabel(readableLabel);
  
  return {
    label: `${readableLabel} (${typeDescription})`,
    readableLabel: readableLabel,
    type: fieldType,
    position: position,
    element: input
  };
}

function cleanFieldLabel(label) {
  // Remove common suffixes and clean up
  return label
    .replace(/[\*\:]+$/g, '') // Remove trailing asterisks and colons
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .replace(/^(Enter|Input|Type)\s+/i, '') // Remove common prefixes
    .replace(/\s+(here|below)$/i, ''); // Remove common suffixes
}

function getTypeDescription(fieldType, element) {
  const typeDescriptions = {
    email: 'email address',
    phone: 'phone number',
    name: 'name',
    address: 'address',
    date: 'date',
    password: 'password',
    age: 'age',
    gender: 'gender',
    company: 'company name',
    title: 'job title',
    website: 'website URL',
    country: 'country',
    state: 'state or province',
    comment: 'comments or message',
    text: 'text'
  };
  
  // Special handling for select elements
  if (element.tagName === 'SELECT') {
    const options = Array.from(element.options).slice(1); // Skip first option (usually empty)
    if (options.length > 0) {
      const optionsList = options.slice(0, 3).map(o => o.text).join(', ');
      const moreText = options.length > 3 ? ` and ${options.length - 3} more` : '';
      return `dropdown with options: ${optionsList}${moreText}`;
    }
    return 'dropdown selection';
  }
  
  // Special handling for textareas
  if (element.tagName === 'TEXTAREA') {
    return 'text area for longer text';
  }
  
  // Special handling for specific input types
  if (element.type === 'number') {
    return 'number';
  }
  
  if (element.type === 'checkbox') {
    return 'checkbox';
  }
  
  if (element.type === 'radio') {
    return 'radio button';
  }
  
  return typeDescriptions[fieldType] || 'text input';
}

function processVoiceInput(transcript, inputElement) {
  let processed = transcript.toLowerCase();
  
  // Apply voice corrections for special characters
  for (const [spoken, actual] of Object.entries(VOICE_CORRECTIONS)) {
    const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
    processed = processed.replace(regex, actual);
  }

  // Field-specific processing
  const fieldType = detectFieldType(inputElement);
  
  switch (fieldType) {
    case 'email':
      processed = processEmailInput(processed);
      break;
    case 'phone':
      processed = processPhoneInput(processed);
      break;
    case 'date':
      processed = processDateInput(processed);
      break;
    case 'name':
      processed = processNameInput(processed);
      break;
  }

  return processed;
}

function detectFieldType(element) {
  const id = (element.id || '').toLowerCase();
  const name = (element.name || '').toLowerCase();
  const placeholder = (element.placeholder || '').toLowerCase();
  const label = getFieldLabel(element).toLowerCase();
  const type = element.type.toLowerCase();
  
  const fieldText = `${id} ${name} ${placeholder} ${label} ${type}`;
  
  for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (patterns.some(pattern => fieldText.includes(pattern))) {
      return fieldType;
    }
  }
  
  return 'text';
}

function getFieldLabel(element) {
  // Try to find associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }
  
  // Look for parent label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    const labelText = parentLabel.textContent.replace(element.value || '', '').trim();
    if (labelText) return labelText;
  }
  
  // Look for preceding text/label
  const prevElement = element.previousElementSibling;
  if (prevElement) {
    if (prevElement.tagName === 'LABEL') {
      return prevElement.textContent.trim();
    }
    // Check for text nodes or spans before the input
    if (prevElement.textContent && prevElement.textContent.trim().length > 0) {
      return prevElement.textContent.trim();
    }
  }
  
  // Try placeholder as fallback
  if (element.placeholder) {
    return element.placeholder;
  }
  
  // Try name attribute as last resort
  if (element.name) {
    return element.name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return '';
}

function processEmailInput(text) {
  // Handle common email speech patterns
  text = text.replace(/\s+at\s+/g, '@');
  text = text.replace(/\s+dot\s+/g, '.');
  text = text.replace(/\s+gmail\s+/g, 'gmail');
  text = text.replace(/\s+yahoo\s+/g, 'yahoo');
  text = text.replace(/\s+hotmail\s+/g, 'hotmail');
  text = text.replace(/\s+outlook\s+/g, 'outlook');
  text = text.replace(/\s+com\s*/g, 'com');
  text = text.replace(/\s+org\s*/g, 'org');
  text = text.replace(/\s+net\s*/g, 'net');
  text = text.replace(/\s/g, ''); // Remove remaining spaces
  
  return text;
}

function processPhoneInput(text) {
  // Extract only numbers from phone input
  return text.replace(/\D/g, '');
}

function processDateInput(text) {
  // Handle date formats
  const datePatterns = {
    'january|jan': '01', 'february|feb': '02', 'march|mar': '03',
    'april|apr': '04', 'may': '05', 'june|jun': '06',
    'july|jul': '07', 'august|aug': '08', 'september|sep': '09',
    'october|oct': '10', 'november|nov': '11', 'december|dec': '12'
  };
  
  for (const [pattern, number] of Object.entries(datePatterns)) {
    const regex = new RegExp(pattern, 'gi');
    text = text.replace(regex, number);
  }
  
  return text;
}

function processNameInput(text) {
  // Capitalize first letter of each word
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

function confirmInput(text, inputElement) {
  const fieldInfo = getDetailedFieldInfo();
  const confirmed = confirm(`Did you say "${text}" for ${fieldInfo.readableLabel}?\n\nClick OK to confirm or Cancel to try again.`);
  
  if (confirmed) {
    fillCurrentField(text);
  } else {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      showVoiceStatus(`Retry ${retryCount}/${MAX_RETRIES}`);
      speakText(`Please try again for ${fieldInfo.readableLabel}`);
      setTimeout(() => startListeningForField(), 2000);
    } else {
      skipCurrentField();
    }
  }
}

function startListeningForField() {
  if (currentInputIndex >= inputs.length) {
    completeFormFilling();
    return;
  }
  
  retryCount = 0;
  focusInput(currentInputIndex);
  
  // Add slight delay before starting recognition
  setTimeout(() => {
    if (recognition && !isListening) {
      recognition.start();
    }
  }, 500);
}

function focusInput(index) {
  const input = inputs[index];
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Show and speak detailed field information to user
  const fieldInfo = getDetailedFieldInfo();
  showVoiceStatus(`📝 Field ${fieldInfo.position}: ${fieldInfo.readableLabel}`);
  
  // Create more natural speech
  let speechText = `Field ${fieldInfo.position}. Please enter your ${fieldInfo.readableLabel}`;
  
  // Add helpful hints based on field type
  const hints = getFieldHints(fieldInfo.type, fieldInfo.element);
  if (hints) {
    speechText += `. ${hints}`;
  }
  
  speakText(speechText);
}

function getFieldHints(fieldType, element) {
  const hints = {
    email: "For example, say 'john dot smith at gmail dot com'",
    phone: "Just say the numbers",
    date: "Say the date in month day year format",
    password: "Speak your password clearly",
    name: "Speak your full name"
  };
  
  if (element.tagName === 'SELECT') {
    const options = Array.from(element.options).slice(1, 4); // Get first few options
    if (options.length > 0) {
      const optionsList = options.map(o => o.text).join(', ');
      return `Choose from: ${optionsList}`;
    }
  }
  
  return hints[fieldType];
}

function fillCurrentField(value) {
  const input = inputs[currentInputIndex];
  const fieldInfo = getDetailedFieldInfo();
  
  if (input.tagName === 'SELECT') {
    fillSelectField(input, value);
  } else {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  removeHighlight(input);
  const message = `✅ Filled ${fieldInfo.readableLabel} with: ${value}`;
  showVoiceStatus(message);
  
  // More natural completion announcement
  const completionText = `${fieldInfo.readableLabel} filled successfully. ${value}`;
  speakText(completionText);
  
  // Move to next field
  currentInputIndex++;
  setTimeout(() => startListeningForField(), 2500);
}

function fillSelectField(selectElement, spokenValue) {
  const options = Array.from(selectElement.options);
  const normalizedSpoken = spokenValue.toLowerCase().trim();
  
  // Try exact match first
  let matchedOption = options.find(option => 
    option.text.toLowerCase().trim() === normalizedSpoken ||
    option.value.toLowerCase().trim() === normalizedSpoken
  );
  
  // Try partial match if exact match fails
  if (!matchedOption) {
    matchedOption = options.find(option => 
      option.text.toLowerCase().includes(normalizedSpoken) ||
      normalizedSpoken.includes(option.text.toLowerCase())
    );
  }
  
  if (matchedOption) {
    selectElement.value = matchedOption.value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // If no match found, ask user to choose
    const optionsList = options.slice(1).map(o => o.text).join(', ');
    const message = `Could not match "${spokenValue}". Available options are: ${optionsList}. Please try again.`;
    alert(message);
    speakText(message);
    setTimeout(() => startListeningForField(), 3000);
    return;
  }
}

function highlightCurrentField() {
  const input = inputs[currentInputIndex];
  input.style.outline = '3px solid #007bff';
  input.style.boxShadow = '0 0 10px rgba(0, 123, 255, 0.5)';
}

function removeHighlight(input) {
  input.style.outline = '';
  input.style.boxShadow = '';
}

function skipCurrentField() {
  const input = inputs[currentInputIndex];
  const fieldInfo = getDetailedFieldInfo();
  removeHighlight(input);
  const message = `⏭️ Skipped: ${fieldInfo.readableLabel}`;
  showVoiceStatus(message);
  speakText(`Skipped ${fieldInfo.readableLabel}. Moving to next field.`);
  currentInputIndex++;
  setTimeout(() => startListeningForField(), 2000);
}

function completeFormFilling() {
  const message = '🎉 Form filling completed successfully!';
  showVoiceStatus(message);
  speakText('Congratulations! Form filling has been completed successfully. All fields have been filled.');
  
  // Ask if user wants to submit
  setTimeout(() => {
    const shouldSubmit = confirm('Form filling completed! Would you like to submit the form now?');
    if (shouldSubmit) {
      submitForm();
    } else {
      speakText('Form ready for review. You can submit it manually when ready.');
    }
  }, 3000);
  
  // Clean up
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

function submitForm() {
  const form = inputs[0].form;
  if (form) {
    form.submit();
    const message = '📤 Form submitted successfully!';
    alert(message);
    speakText('Form has been submitted successfully. Thank you!');
  } else {
    const message = 'No form container found to submit.';
    alert(message);
    speakText('Could not find a form to submit. Please submit manually.');
  }
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    // Stop any currently speaking text
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slightly slower for better clarity
    utterance.pitch = 1;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    
    // Function to set voice when available
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a good English voice
        const preferredVoice = voices.find(voice => 
          (voice.name.includes('Google') && voice.lang.startsWith('en')) ||
          (voice.name.includes('Microsoft') && voice.lang.startsWith('en')) ||
          (voice.name.includes('Apple') && voice.lang.startsWith('en')) ||
          voice.lang === 'en-US' ||
          voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
      
      // Speak the text
      speechSynthesis.speak(utterance);
    };
    
    // Check if voices are already loaded
    if (speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      // Wait for voices to be loaded
      speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
      
      // Fallback: speak anyway after a short delay
      setTimeout(() => {
        if (!utterance.voice) {
          speechSynthesis.speak(utterance);
        }
      }, 500);
    }
  }
}

function showVoiceStatus(message) {
  // Create or update status display
  let statusDiv = document.getElementById('voice-filling-status');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'voice-filling-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.2);
      text-align: center;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(statusDiv);
  }
  
  statusDiv.textContent = message;
  
  // Auto-hide after delay for completion messages
  if (message.includes('completed') || message.includes('submitted')) {
    setTimeout(() => {
      if (statusDiv && statusDiv.textContent === message) {
        statusDiv.style.opacity = '0';
        statusDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => statusDiv.remove(), 300);
      }
    }, 5000);
  }
}

// --- Video Control (unchanged) ---

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

// --- Listen for messages from popup ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch(request.action) {
      case 'ping':
        // Simple connectivity check
        sendResponse({ status: 'Content script ready' });
        break;
      case 'startVoiceFormFilling':
        startVoiceFormFilling();
        sendResponse({ status: 'Voice form filling started' });
        break;
      case 'videoControl':
        const videos = document.querySelectorAll('video');
        if (videos.length === 0) {
          sendResponse({ error: 'No videos found on this page' });
        } else {
          controlVideos(request.command);
          sendResponse({ status: `Video command '${request.command}' executed on ${videos.length} video(s)` });
        }
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message });
  }
  return true; // Keep message channel open for async responses
});