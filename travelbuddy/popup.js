document.addEventListener('DOMContentLoaded', () => {
  const voiceControl = document.getElementById('voiceControl');
  const colorBlindMode = document.getElementById('colorBlindMode');
  const textToSpeech = document.getElementById('textToSpeech');
  const summarization = document.getElementById('summarization');

  // Load saved settings
  chrome.storage.sync.get('accessibilitySettings', (data) => {
    const settings = data.accessibilitySettings;
    voiceControl.checked = settings.voiceControl;
    colorBlindMode.value = settings.colorBlindMode;
    textToSpeech.checked = settings.textToSpeech;
    summarization.checked = settings.summarization;
  });

  // Save settings on change
  [voiceControl, colorBlindMode, textToSpeech, summarization].forEach(element => {
    element.addEventListener('change', () => {
      chrome.storage.sync.set({
        accessibilitySettings: {
          voiceControl: voiceControl.checked,
          colorBlindMode: colorBlindMode.value,
          textToSpeech: textToSpeech.checked,
          summarization: summarization.checked
        }
      });
    });
  });
});