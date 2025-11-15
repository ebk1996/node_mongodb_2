// Face Scanner using face-api.js
(function() {
  let modelsLoaded = false;
  
  async function loadModels() {
    if (modelsLoaded) return true;
    
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      modelsLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading face detection models:', error);
      return false;
    }
  }
  
  async function detectFace(imageElement) {
    try {
      const detection = await faceapi.detectSingleFace(
        imageElement,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();
      
      return detection;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }
  
  function showResult(elementId, message, type) {
    const resultDiv = document.getElementById(elementId);
    if (resultDiv) {
      resultDiv.textContent = message;
      resultDiv.className = 'detection-result ' + type;
    }
  }
  
  // Setup face image input handler
  document.addEventListener('DOMContentLoaded', function() {
    const faceImageInput = document.getElementById('faceImage');
    const canvas = document.getElementById('faceCanvas');
    
    if (!faceImageInput || !canvas) return;
    
    faceImageInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      showResult('faceDetectionResult', 'Loading face detection models...', 'info');
      
      // Load models
      const loaded = await loadModels();
      if (!loaded) {
        showResult('faceDetectionResult', 'Failed to load face detection models. Please try again.', 'error');
        document.getElementById('faceVerified').value = 'false';
        return;
      }
      
      showResult('faceDetectionResult', 'Analyzing image...', 'info');
      
      // Create image element
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      
      img.onload = async function() {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Detect face
        const detection = await detectFace(img);
        
        if (detection) {
          showResult('faceDetectionResult', '✓ Face detected successfully! Image verified.', 'success');
          document.getElementById('faceVerified').value = 'true';
          
          // Draw detection on canvas (optional - for debugging)
          const displaySize = { width: img.width, height: img.height };
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          faceapi.draw.drawDetections(canvas, resizedDetection);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
        } else {
          showResult('faceDetectionResult', '✗ No face detected. Please upload a clear photo of your face.', 'error');
          document.getElementById('faceVerified').value = 'false';
        }
        
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = function() {
        showResult('faceDetectionResult', 'Error loading image. Please try another file.', 'error');
        document.getElementById('faceVerified').value = 'false';
      };
    });
  });
})();
