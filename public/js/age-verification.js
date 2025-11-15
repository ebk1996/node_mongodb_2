// Age Verification Modal
(function() {
  const AGE_VERIFICATION_KEY = 'ageVerified';
  const AGE_VERIFICATION_EXPIRY = 'ageVerifiedExpiry';
  
  function showAgeModal() {
    const modal = document.getElementById('ageModal');
    if (modal) {
      modal.classList.add('show');
    }
  }
  
  function hideAgeModal() {
    const modal = document.getElementById('ageModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }
  
  function isAgeVerified() {
    const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
    const expiry = localStorage.getItem(AGE_VERIFICATION_EXPIRY);
    
    if (!verified || !expiry) {
      return false;
    }
    
    const expiryDate = new Date(parseInt(expiry));
    const now = new Date();
    
    if (now > expiryDate) {
      localStorage.removeItem(AGE_VERIFICATION_KEY);
      localStorage.removeItem(AGE_VERIFICATION_EXPIRY);
      return false;
    }
    
    return verified === 'true';
  }
  
  function setAgeVerified() {
    // Set expiry to 30 days from now
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    
    localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
    localStorage.setItem(AGE_VERIFICATION_EXPIRY, expiry.getTime().toString());
  }
  
  window.confirmAge = function(isOver18) {
    if (isOver18) {
      setAgeVerified();
      hideAgeModal();
    } else {
      alert('You must be 18 years or older to access this website.');
      // Redirect to a safe page or show alternative content
      window.location.href = 'https://www.google.com';
    }
  };
  
  // Check age verification on page load
  document.addEventListener('DOMContentLoaded', function() {
    if (!isAgeVerified()) {
      // Small delay to ensure page is fully loaded
      setTimeout(showAgeModal, 500);
    }
  });
  
  // Prevent clicking outside the modal to close it
  const modal = document.getElementById('ageModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
})();
