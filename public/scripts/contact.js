// Get form and form elements
const contactForm = document.querySelector('.contact-form form');
const formControls = document.querySelectorAll('.form-control');
const submitButton = document.querySelector('.btn-submit');

// Form validation function
function validateForm() {
  let isValid = true;
  
  // Check each form control
  formControls.forEach(input => {
    // Remove any existing error styling
    input.classList.remove('error');
    const formGroup = input.closest('.form-group');
    
    // Remove existing error message if there is one
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
    
    // Check if field is empty
    if (!input.value.trim()) {
      isValid = false;
      
      // Add error styling
      input.classList.add('error');
      
      // Create and add error message
      const message = document.createElement('div');
      message.className = 'error-message';
      message.style.color = '#e74c3c';
      message.style.fontSize = '0.85rem';
      message.style.marginTop = '0.3rem';
      message.textContent = 'This field is required';
      
      formGroup.appendChild(message);
    }
  });
  
  return isValid;
}

// Function to send email
function sendMail() {
  // Only proceed if form is valid
  if (!validateForm()) {
    console.log('Form validation failed - not submitting');
    // Focus on the first invalid field to help the user
    const firstInvalidField = document.querySelector('.form-control.error');
    if (firstInvalidField) {
      firstInvalidField.focus();
    }
    return;
  }
  
  // Get form values
  let params = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value
  };
  
  // Create and show loading indicator
  const form = document.querySelector('.contact-form');
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'sending-indicator';
  loadingIndicator.innerHTML = `
    <div class="sending-spinner"></div>
    <p>Sending your message...</p>
  `;
  form.appendChild(loadingIndicator);
  
  // Disable submit button while sending
  submitButton.disabled = true;
  submitButton.style.opacity = '0.7';
  
  // Send email using EmailJS
  emailjs.send("service_9ojop4q", "template_t98iaz1", params)
    .then(function(response) {
      console.log('SUCCESS!', response.status, response.text);
      
      // Remove loading indicator
      form.removeChild(loadingIndicator);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'message-container success-message';
      successMessage.innerHTML = `
        <div class="icon-circle success-icon">
          <i class="fas fa-check"></i>
        </div>
        <h3>Thank you, ${params.name}!</h3>
        <p>Your message has been sent successfully. We'll get back to you soon.</p>
        <button class="action-button btn-reset">Send another message</button>
      `;
      form.appendChild(successMessage);
      
      // Clear the form
      contactForm.reset();
      
      // Add event listener to reset button
      const resetBtn = document.querySelector('.btn-reset');
      resetBtn.addEventListener('click', function() {
        form.removeChild(successMessage);
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
        updateSubmitButtonState();
      });
      
    }, function(error) {
      console.log('FAILED...', error);
      
      // Remove loading indicator
      form.removeChild(loadingIndicator);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'message-container error-message';
      errorMessage.innerHTML = `
        <div class="icon-circle error-icon">
          <i class="fas fa-exclamation"></i>
        </div>
        <h3>Message not sent</h3>
        <p>Sorry, there was a problem sending your message. Please try again later.</p>
        <button class="action-button btn-retry">Try again</button>
      `;
      form.appendChild(errorMessage);
      
      // Add event listener to retry button
      const retryBtn = document.querySelector('.btn-retry');
      retryBtn.addEventListener('click', function() {
        form.removeChild(errorMessage);
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
      });
    });
}

// Function to update submit button state
function updateSubmitButtonState() {
  let allFilled = true;
  formControls.forEach(input => {
    if (!input.value.trim()) {
      allFilled = false;
    }
  });
  
  // Visually indicate if form can be submitted
  if (allFilled) {
    submitButton.classList.add('ready');
    submitButton.removeAttribute('disabled');
  } else {
    submitButton.classList.remove('ready');
    submitButton.setAttribute('disabled', 'disabled');
  }
}

// Add form submission handler
contactForm.addEventListener('submit', function(event) {
  // Always prevent default form submission
  event.preventDefault();
  
  // Call the sendMail function to handle everything
  sendMail();
});

// Real-time validation on input change
formControls.forEach(input => {
  input.addEventListener('input', function() {
    // If the input now has a value and previously had an error, remove the error
    if (input.value.trim() && input.classList.contains('error')) {
      input.classList.remove('error');
      
      // Remove error message if it exists
      const formGroup = input.closest('.form-group');
      const errorMessage = formGroup.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.remove();
      }
    }
    
    // Update button state
    updateSubmitButtonState();
  });
});

// Check button state on page load
updateSubmitButtonState();

// Add CSS for styling
const styleElement = document.createElement('style');
styleElement.textContent = `
  .form-control.error {
    border-color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.05);
  }
  
  .form-control.error:focus {
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }
  
  .btn-submit:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
  }
  
  .btn-submit.ready {
    background-color: var(--primary-color);
    opacity: 1;
    cursor: pointer;
  }
  
  .message-container {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .icon-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 15px;
  }
  
  .success-icon {
    background-color: #2ecc71;
    color: white;
  }
  
  .error-icon {
    background-color: #e74c3c;
    color: white;
  }
  
  .action-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    margin-top: 15px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .action-button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  
  .sending-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
  }
  
  .sending-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 10px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleElement);