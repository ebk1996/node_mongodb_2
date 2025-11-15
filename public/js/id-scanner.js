// ID Scanner - Basic validation for ID images
(function() {
  function showResult(elementId, message, type) {
    const resultDiv = document.getElementById(elementId);
    if (resultDiv) {
      resultDiv.textContent = message;
      resultDiv.className = 'detection-result ' + type;
    }
  }
  
  function validateImageDimensions(img) {
    // ID cards are typically landscape orientation with minimum dimensions
    const minWidth = 200;
    const minHeight = 150;
    const aspectRatio = img.width / img.height;
    
    if (img.width < minWidth || img.height < minHeight) {
      return {
        valid: false,
        message: 'Image resolution too low. Please upload a higher quality image.'
      };
    }
    
    // ID cards typically have aspect ratio between 1.4 and 1.8 (landscape)
    if (aspectRatio < 1.2 || aspectRatio > 2.0) {
      return {
        valid: true,
        message: '⚠ Image orientation may not be ideal. ID cards are typically landscape orientation.',
        warning: true
      };
    }
    
    return {
      valid: true,
      message: '✓ Image quality acceptable for ID verification.'
    };
  }
  
  function analyzeImageQuality(img, canvas) {
    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate basic brightness
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
        }
        
        const avgBrightness = totalBrightness / (data.length / 4);
        
        // Check if image is too dark or too bright
        if (avgBrightness < 50) {
          resolve({
            valid: false,
            message: 'Image is too dark. Please upload a clearer image with better lighting.'
          });
        } else if (avgBrightness > 220) {
          resolve({
            valid: false,
            message: 'Image is overexposed. Please upload an image with better lighting.'
          });
        } else {
          resolve({
            valid: true,
            message: '✓ Image lighting is acceptable.'
          });
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        resolve({
          valid: true,
          message: '✓ Image uploaded. Manual verification will be performed.',
          warning: true
        });
      }
    });
  }
  
  async function validateIDImage(file) {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      
      img.src = URL.createObjectURL(file);
      
      img.onload = async function() {
        // Check dimensions
        const dimensionCheck = validateImageDimensions(img);
        
        if (!dimensionCheck.valid) {
          URL.revokeObjectURL(img.src);
          resolve(dimensionCheck);
          return;
        }
        
        // Check image quality
        const qualityCheck = await analyzeImageQuality(img, canvas);
        
        URL.revokeObjectURL(img.src);
        
        // Return the most restrictive result
        if (!qualityCheck.valid) {
          resolve(qualityCheck);
        } else if (dimensionCheck.warning) {
          resolve(dimensionCheck);
        } else {
          resolve(qualityCheck);
        }
      };
      
      img.onerror = function() {
        URL.revokeObjectURL(img.src);
        resolve({
          valid: false,
          message: 'Error loading image. Please try another file.'
        });
      };
    });
  }
  
  // Setup ID image input handler
  document.addEventListener('DOMContentLoaded', function() {
    const idImageInput = document.getElementById('idImage');
    
    if (!idImageInput) return;
    
    idImageInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      // Check file type
      if (file.type === 'application/pdf') {
        showResult('idScanResult', '✓ PDF document uploaded. Manual verification will be performed.', 'success');
        document.getElementById('idVerified').value = 'true';
        return;
      }
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        showResult('idScanResult', '✗ Invalid file type. Please upload an image or PDF.', 'error');
        document.getElementById('idVerified').value = 'false';
        return;
      }
      
      showResult('idScanResult', 'Analyzing ID image...', 'info');
      
      // Validate image
      const result = await validateIDImage(file);
      
      if (result.valid) {
        if (result.warning) {
          showResult('idScanResult', result.message + ' Manual verification will be performed.', 'info');
        } else {
          showResult('idScanResult', result.message + ' Document will be manually verified.', 'success');
        }
        document.getElementById('idVerified').value = 'true';
      } else {
        showResult('idScanResult', result.message, 'error');
        document.getElementById('idVerified').value = 'false';
      }
    });
  });
})();
