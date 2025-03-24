
    // Advanced parallax effect for all background elements
    document.addEventListener('mousemove', function(e) {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-speed') || 0.05;
            const x = (window.innerWidth - e.pageX * speed) / 100;
            const y = (window.innerHeight - e.pageY * speed) / 100;
            
            element.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
    });

    // Initialize enhanced floating animations
    document.querySelectorAll('.float').forEach((element, index) => {
        // Randomize animation properties for more natural movement
        const duration = 4 + Math.random() * 8; // Between 4-12s
        const delay = Math.random() * 5;
        const amplitude = 10 + Math.random() * 15; // Different float distances
        
        // Set custom animation properties
        element.style.animationDuration = `${duration}s`;
        element.style.animationDelay = `${delay}s`;
        
        // Create unique animations for each element
        const keyframesName = `float-${index}`;
        
        // Create a custom keyframes animation for each element
        const keyframes = `
            @keyframes ${keyframesName} {
                0% { transform: translateY(0); }
                50% { transform: translateY(-${amplitude}px); }
                100% { transform: translateY(0); }
            }
        `;
        
        // Add the custom animation to the document
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = keyframes;
        document.head.appendChild(styleSheet);
        
        // Apply the custom animation
        element.style.animation = `${keyframesName} ${duration}s ease-in-out infinite`;
        element.style.animationDelay = `${delay}s`;
    });

    // Create new subtle cloud elements periodically
    setInterval(function() {
        // Create a new cloud element
        const cloud = document.createElement('div');
        
        // Randomize position, size and opacity
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const width = 80 + Math.random() * 150;
        const height = 30 + Math.random() * 50;
        const opacity = 0.1 + Math.random() * 0.2;
        
        // Set cloud styles
        cloud.style.position = 'absolute';
        cloud.style.top = `${top}%`;
        cloud.style.left = `${left}%`;
        cloud.style.width = `${width}px`;
        cloud.style.height = `${height}px`;
        cloud.style.background = `rgba(255, 255, 255, ${opacity})`;
        cloud.style.borderRadius = '50%';
        cloud.style.filter = 'blur(20px)';
        cloud.style.pointerEvents = 'none';
        cloud.style.zIndex = '-1';
        
        // Add animation
        cloud.style.animation = 'fadeInOut 15s ease-in-out forwards';
        
        // Append to the background container
        document.querySelector('div[style*="position: fixed"]').appendChild(cloud);
        
        // Remove the cloud after animation completes
        setTimeout(() => {
            cloud.remove();
        }, 15000);
    }, 3000); // Create a new cloud every 3 seconds

    // Add this keyframe animation for the new clouds
    const fadeInOutStyle = document.createElement('style');
    fadeInOutStyle.type = 'text/css';
    fadeInOutStyle.innerHTML = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-20px, 0); }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translate(20px, 0); }
        }
        
        @keyframes wave {
            0% { background-position: 0 0; }
            100% { background-position: 200% 0; }
        }
    `;
    document.head.appendChild(fadeInOutStyle);
    
    // Optional: Create subtle random movement in the background
    setInterval(function() {
        const backgroundElements = document.querySelectorAll('.parallax');
        
        backgroundElements.forEach(element => {
            const currentTransform = element.style.transform || '';
            const randomX = (Math.random() - 0.5) * 5;
            const randomY = (Math.random() - 0.5) * 5;
            
            // Apply subtle random movement
            element.style.transition = 'transform 3s ease-in-out';
            element.style.transform = `${currentTransform} translate(${randomX}px, ${randomY}px)`;
        });
    }, 3000);
