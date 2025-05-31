class AccessibilityManager {
  constructor() {
    this.currentFontSize = 16; // Track current font size
    this.isNarrating = false; // Track narration state
    this.currentUtterance = null; 
    this.initializeAccessibilityFeatures();
    this.setupPageChangeDetection();
  }

  initializeAccessibilityFeatures() {
    // Create main accessibility toolbar
    this.createAccessibilityToolbar();
  }

  createAccessibilityToolbar() {
     // Create main widget container
     const widget = document.createElement('div');
     widget.id = 'accessibility-widget';
     widget.style.cssText = `
       position: fixed;
       top: 20px;
       right: 20px;
       z-index: 10000;
       font-family: Arial, sans-serif;
     `;
 
     // Create toggle button
     const toggleButton = document.createElement('button');
     toggleButton.id = 'accessibility-toggle';
     toggleButton.innerHTML = '♿';
     toggleButton.title = 'Accessibility Menu';
     toggleButton.style.cssText = `
       width: 50px;
       height: 50px;
       border-radius: 50%;
       background: linear-gradient(135deg, #3498db, #2980b9);
       color: white;
       border: 3px solid #fff;
       font-size: 24px;
       cursor: pointer;
       box-shadow: 0 4px 15px rgba(0,0,0,0.2);
       transition: all 0.3s ease;
       display: flex;
       align-items: center;
       justify-content: center;
     `;
 
     // Create dropdown menu
     const dropdown = document.createElement('div');
     dropdown.id = 'accessibility-dropdown';
     dropdown.style.cssText = `
       position: absolute;
       top: 60px;
       right: 0;
       background: white;
       border-radius: 10px;
       box-shadow: 0 8px 25px rgba(0,0,0,0.15);
       padding: 10px;
       min-width: 220px;
       opacity: 0;
       visibility: hidden;
       transform: translateY(-10px);
       transition: all 0.3s ease;
       border: 2px solid #3498db;
     `;
 
     // Add header to dropdown
     const header = document.createElement('div');
     header.innerHTML = '<strong>🛠️ Accessibility Tools</strong>';
     header.style.cssText = `
       padding: 8px 12px;
       color: #2c3e50;
       border-bottom: 1px solid #ecf0f1;
       margin-bottom: 8px;
       font-size: 14px;
     `;
     dropdown.appendChild(header);

    // Accessibility Feature Buttons
    const features = [
      {
        name: 'Summarize Page',
        icon: '📝',
        action: () => this.generateWebpageSummary()
      },
      {
        name: 'Text-to-Speech',
        icon: '🔊',
        action: () => this.initTextToSpeech()
      },
      {
        name: 'Stop Speech',
        icon: '⏹️',
        action: () => this.stopTextToSpeech()
      },
      {
        name: 'Color Blind Mode',
        icon: '🌈',
        action: () => this.toggleColorBlindMode()
      },
      {
        name: 'Remove Filter',
        icon: '🔄',
        action: () => this.removeAllFilters()
      },
      {
        name: 'Increase Text Size',
        icon: 'A+',
        action: () => this.adjustTextSize(2)
      },
      {
        name: 'Decrease Text Size',
        icon: 'A-',
        action: () => this.adjustTextSize(-2)
      }
    ];
 // Create dropdown buttons
 features.forEach(feature => {
  const button = document.createElement('button');
  button.innerHTML = `${feature.icon} ${feature.name}`;
  button.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #2c3e50;
    font-size: 13px;
    text-align: left;
    margin-bottom: 2px;
  `;

  button.addEventListener('click', () => {
    feature.action();
    this.closeDropdown();
  });

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#f8f9fa';
    button.style.transform = 'translateX(4px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'transparent';
    button.style.transform = 'translateX(0)';
  });

  dropdown.appendChild(button);
});

// Toggle button hover effects
toggleButton.addEventListener('mouseenter', () => {
  toggleButton.style.transform = 'scale(1.1)';
  toggleButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
});

toggleButton.addEventListener('mouseleave', () => {
  toggleButton.style.transform = 'scale(1)';
  toggleButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
});

// Toggle dropdown functionality
let isOpen = false;
toggleButton.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isOpen) {
    this.closeDropdown();
  } else {
    this.openDropdown();
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!widget.contains(e.target)) {
    this.closeDropdown();
  }
});

// Store references for dropdown control
this.dropdown = dropdown;
this.toggleButton = toggleButton;
this.isDropdownOpen = false;

// Open/close dropdown methods
this.openDropdown = () => {
  dropdown.style.opacity = '1';
  dropdown.style.visibility = 'visible';
  dropdown.style.transform = 'translateY(0)';
  toggleButton.style.background = 'linear-gradient(135deg, #2980b9, #3498db)';
  this.isDropdownOpen = true;
  isOpen = true;
};

this.closeDropdown = () => {
  dropdown.style.opacity = '0';
  dropdown.style.visibility = 'hidden';
  dropdown.style.transform = 'translateY(-10px)';
  toggleButton.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
  this.isDropdownOpen = false;
  isOpen = false;
};

// Assemble widget
widget.appendChild(toggleButton);
widget.appendChild(dropdown);

// Add widget to document
document.body.appendChild(widget);
}

   // Summarization Method
   generateWebpageSummary() {
    // Extract main content
    const content = this.extractMainContent();
    
    if (!content || content.trim().length < 50) {
      this.displaySummary("Unable to extract meaningful content from this page for summarization.");
      return;
    }
    
    // Create summary
    const summary = this.createSummary(content);
    
    // Display summary
    this.displaySummary(summary);
  }

  extractMainContent() {
    // Remove script and style elements first
    const scripts = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar');
    const contentToExclude = Array.from(scripts).map(el => el.innerText || '').join(' ');

    // Try multiple content extraction strategies
    const contentSelectors = [
      'article',
      'main', 
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content', 
      '.article-content',
      '.article-body',
      '.story-body',
      '.post-body',
      '.content-body'
    ];

    // First, try to find main content containers
    for (const selector of contentSelectors) {
      const contentElement = document.querySelector(selector);
      if (contentElement) {
        const text = this.cleanText(contentElement.innerText);
        if (text.length > 200) {
          return text;
        }
      }
    }

    // If no main content found, try paragraphs
    const paragraphs = document.querySelectorAll('p');
    let paragraphText = '';
    paragraphs.forEach(p => {
      const text = p.innerText.trim();
      if (text.length > 20 && !this.isNavigationText(text)) {
        paragraphText += text + ' ';
      }
    });

    if (paragraphText.length > 200) {
      return this.cleanText(paragraphText);
    }

    // Last resort - get body text but filter out navigation/UI elements
    const bodyText = document.body.innerText;
    return this.cleanText(bodyText);
  }

  cleanText(text) {
    // Remove common navigation and UI text patterns
    const cleanedText = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\t+/g, ' ') // Replace tabs with spaces
      .replace(/\|/g, ' ') // Remove pipe characters
      .replace(/›/g, ' ') // Remove breadcrumb arrows
      .replace(/»/g, ' ') // Remove breadcrumb arrows
      .replace(/Home\s+About\s+Contact/gi, '') // Remove common nav patterns
      .replace(/Skip to content/gi, '') // Remove skip links
      .replace(/Menu/gi, '') // Remove menu text
      .replace(/Search/gi, '') // Remove search text
      .replace(/Login|Sign in|Register/gi, '') // Remove auth text
      .replace(/Copyright.*$/gi, '') // Remove copyright text
      .replace(/^\s*\d+\s*$/, '') // Remove standalone numbers
      .trim();

    return cleanedText;
  }

  isNavigationText(text) {
    const navPatterns = [
      /^(home|about|contact|menu|search|login|register)$/i,
      /^(next|previous|back|forward)$/i,
      /^(click here|read more|learn more)$/i,
      /^\d+$/, // Just numbers
      /^[^a-zA-Z]*$/ // No letters (just symbols/numbers)
    ];

    return navPatterns.some(pattern => pattern.test(text.trim()));
  }

  createSummary(text) {
    // Clean and prepare text
    const cleanText = text.replace(/[^\w\s.!?]/g, ' ').replace(/\s+/g, ' ');
    
    // Split into sentences more carefully
    const sentences = cleanText.split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => {
        return sentence.length > 15 && 
               sentence.length < 200 && 
               sentence.split(' ').length >= 4 &&
               !this.isNavigationText(sentence);
      });

    if (sentences.length === 0) {
      return "Unable to generate a meaningful summary from this page content.";
    }

    // Improved word frequency analysis
    const words = cleanText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));

    const wordFrequency = {};
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Score sentences based on word frequency and position
    const scoredSentences = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      let score = 0;
      sentenceWords.forEach(word => {
        score += wordFrequency[word] || 0;
      });

      // Boost score for sentences at the beginning (often more important)
      if (index < 3) {
        score *= 1.5;
      }

      // Normalize by sentence length
      score = score / Math.max(sentenceWords.length, 1);
      
      return { sentence: sentence.trim(), score };
    });

    // Select top 3-4 sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(4, Math.max(2, Math.ceil(sentences.length * 0.3))))
      .map(item => item.sentence);

    return topSentences.join('. ') + '.';
  }

  isStopWord(word) {
    const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'];
    return stopWords.includes(word.toLowerCase());
  }

    // Text-to-Speech Method
    initTextToSpeech() {
      // Stop any existing speech first
      this.stopTextToSpeech();
      
      // Extract page content
      const content = this.extractMainContent();
      
      if (!content || content.trim().length === 0) {
        this.createNotification('No content found to read');
        return;
      }
      
      // Create speech synthesis
      const utterance = new SpeechSynthesisUtterance(content);
      this.currentUtterance = utterance; // Store reference
      
      // Configure speech properties
      utterance.rate = 1; // Speed of speech
      utterance.pitch = 1; // Pitch of speech
      
      // Set up event listeners
      utterance.onstart = () => {
        this.isNarrating = true;
        this.createNotification('Started reading page content');
      };
      
      utterance.onend = () => {
        this.isNarrating = false;
        this.currentUtterance = null;
        this.createNotification('Finished reading page content');
      };
      
      utterance.onerror = (event) => {
        // Only show error if its not a mannual cancellation
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          this.createNotification('Error occurred while reading');
        }
        this.isNarrating = false;
        this.currentUtterance = null;
      };
      
      // Speak the content
      window.speechSynthesis.speak(utterance);
    }
  
    // Stop Text-to-Speech Method
    stopTextToSpeech() {
      if (window.speechSynthesis.speaking || this.isNarrating) {
        window.speechSynthesis.cancel();
        this.isNarrating = false;
        this.createNotification('Speech stopped');
      }
    }
  
    // Setup Page Change Detection
    setupPageChangeDetection() {
      // Stop speech when page is about to unload
      window.addEventListener('beforeunload', () => {
        this.stopTextToSpeech();
      });
  
      // Stop speech when page visibility changes (tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isNarrating) {
          this.stopTextToSpeech();
        }
      });
  
      // Monitor URL changes for single-page applications
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
  
      history.pushState = function() {
        if (window.accessibilityManager && window.accessibilityManager.isNarrating) {
          window.accessibilityManager.stopTextToSpeech();
        }
        return originalPushState.apply(history, arguments);
      };
  
      history.replaceState = function() {
        if (window.accessibilityManager && window.accessibilityManager.isNarrating) {
          window.accessibilityManager.stopTextToSpeech();
        }
        return originalReplaceState.apply(history, arguments);
      };
  
      // Listen for popstate events (back/forward button)
      window.addEventListener('popstate', () => {
        this.stopTextToSpeech();
      });
    }
  
// Replace your existing toggleColorBlindMode method with this:
toggleColorBlindMode() {
  // Check if dropdown already exists, if so remove it
  const existingDropdown = document.getElementById('colorblind-options');
  if (existingDropdown) {
    existingDropdown.remove();
    return;
  }

  // Create simple dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'colorblind-options';
  dropdown.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #3498db;
    border-radius: 8px;
    padding: 15px;
    z-index: 10001;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
  `;

  // Create header
  const header = document.createElement('h4');
  header.textContent = 'Choose Color Blind Mode:';
  header.style.cssText = 'margin: 0 0 10px 0; color: #2c3e50;';
  dropdown.appendChild(header);

  // Create buttons with proper event listeners
  const modes = [
    { key: 'none', label: 'Normal Vision' },
    { key: 'deuteranopia', label: 'Deuteranopia (Green Blind)' },
    { key: 'protanopia', label: 'Protanopia (Red Blind)' },
    { key: 'tritanopia', label: 'Tritanopia (Blue Blind)' }
  ];

  modes.forEach(mode => {
    const button = document.createElement('button');
    button.textContent = mode.label;
    button.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f0f8ff';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'white';
    });

    // Add click handler
    button.addEventListener('click', () => {
      this.setColorBlindMode(mode.key);
      dropdown.remove();
    });

    dropdown.appendChild(button);
  });

  document.body.appendChild(dropdown);

  // Close dropdown when clicking outside
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

// Add this new method (same as before):
setColorBlindMode(mode) {
  const filters = {
    'none': '',
    'deuteranopia': 'sepia(100%) saturate(0.6) hue-rotate(80deg)',
    'protanopia': 'sepia(100%) saturate(0.6) hue-rotate(20deg)', 
    'tritanopia': 'sepia(100%) saturate(0.6) hue-rotate(200deg)'
  };
  
  // Apply filter
  document.body.style.filter = filters[mode];
  
  // Store current mode
  document.body.setAttribute('data-colorblind-mode', mode);
  
  // Show notification
  const modeNames = {
    'none': 'Normal Vision',
    'deuteranopia': 'Deuteranopia (Green Blind)',
    'protanopia': 'Protanopia (Red Blind)',
    'tritanopia': 'Tritanopia (Blue Blind)'
  };
  
  this.createNotification(`Color Mode: ${modeNames[mode]}`);
}


  // Remove All Filters Method
  removeAllFilters() {
    // Remove all CSS filters from body
    document.body.style.filter = '';
    
    // Reset font size to default
    document.body.style.fontSize = '';
    this.currentFontSize = 16;
    
    // Apply font size reset to all text elements
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th');
    textElements.forEach(element => {
      element.style.fontSize = '';
    });
    
    // Notify user
    this.createNotification('All filters and text size reset');
  }

  // Text Size Adjustment - Fixed version
  adjustTextSize(change) {
    // Update current font size
    this.currentFontSize += change;
    
    // Ensure minimum font size
    if (this.currentFontSize < 10) {
      this.currentFontSize = 10;
    }
    
    // Apply to body
    document.body.style.fontSize = `${this.currentFontSize}px`;
    
    // Apply to all text elements for better compatibility
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, button, input, textarea, label');
    textElements.forEach(element => {
      // Get current computed font size
      const currentSize = parseFloat(getComputedStyle(element).fontSize) || 16;
      const newSize = currentSize + change;
      
      // Ensure minimum size
      if (newSize >= 10) {
        element.style.fontSize = `${newSize}px`;
      }
    });
    
    // Add CSS rule for better coverage
    let styleElement = document.getElementById('accessibility-font-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'accessibility-font-style';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      * {
        font-size: ${this.currentFontSize}px !important;
      }
      h1 { font-size: ${this.currentFontSize + 8}px !important; }
      h2 { font-size: ${this.currentFontSize + 6}px !important; }
      h3 { font-size: ${this.currentFontSize + 4}px !important; }
      h4 { font-size: ${this.currentFontSize + 2}px !important; }
      h5, h6 { font-size: ${this.currentFontSize + 1}px !important; }
    `;
    
    // Notify user
    this.createNotification(`Text Size: ${this.currentFontSize}px`);
  }

  // NEW: Read Summary Method
  readSummary(summaryText) {
    // Stop any existing speech first
    this.stopTextToSpeech();
    
    if (!summaryText || summaryText.trim().length === 0) {
      this.createNotification('No summary content to read');
      return;
    }
    
    // Create speech synthesis for summary
    const utterance = new SpeechSynthesisUtterance(summaryText);
    this.currentUtterance = utterance;
    
    // Configure speech properties
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    
    // Set up event listeners
    utterance.onstart = () => {
      this.isNarrating = true;
      this.createNotification('Reading summary...');
    };
    
    utterance.onend = () => {
      this.isNarrating = false;
      this.currentUtterance = null;
      this.createNotification('Finished reading summary');
    };
    
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        this.createNotification('Error occurred while reading summary');
      }
      this.isNarrating = false;
      this.currentUtterance = null;
    };
    
    // Speak the summary
    window.speechSynthesis.speak(utterance);
  }

  // Summary Display Method - MODIFIED to include Read button
  displaySummary(summary) {
    // Remove existing summary if present
    const existingSummary = document.getElementById('page-summary');
    if (existingSummary) {
      existingSummary.remove();
    }

    // Create summary container
    const summaryContainer = document.createElement('div');
    summaryContainer.id = 'page-summary';
    summaryContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 600px;
      background-color: white;
      border: 3px solid #3498db;
      border-radius: 10px;
      padding: 20px;
      z-index: 10001;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      max-height: 70vh;
      overflow-y: auto;
    `;

    summaryContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="margin: 0; color: #2c3e50;">Page Summary</h2>
        <button id="close-summary" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #e74c3c;
        ">×</button>
      </div>
      <div style="margin-bottom: 15px;">
        <button id="read-summary-btn" style="
          background: #27ae60;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
        ">🔊 Read Summary</button>
      </div>
      <hr>
      <p id="summary-content" style="line-height: 1.6;">${summary}</p>
    `;

    // Add to document
    document.body.appendChild(summaryContainer);

    // Close button functionality
    document.getElementById('close-summary').addEventListener('click', () => {
      document.body.removeChild(summaryContainer);
    });

    // Read summary button functionality
    document.getElementById('read-summary-btn').addEventListener('click', () => {
      this.readSummary(summary);
    });
  }

  // Notification Method
  createNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #2ecc71;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10002;
      transition: opacity 0.3s;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification && notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize Accessibility Manager
new AccessibilityManager();