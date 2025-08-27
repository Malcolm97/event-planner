export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEventData = (eventData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!eventData.name || eventData.name.trim().length === 0) {
    errors.push('Event name is required');
  }
  
  if (!eventData.location || eventData.location.trim().length === 0) {
    errors.push('Event location is required');
  }
  
  if (!eventData.date) {
    errors.push('Event date is required');
  } else {
    const eventDate = new Date(eventData.date);
    const now = new Date();
    if (eventDate < now) {
      errors.push('Event date cannot be in the past');
    }
  }
  
  if (!eventData.category || eventData.category.trim().length === 0) {
    errors.push('Event category is required');
  }
  
  if (eventData.presale_price && eventData.presale_price < 0) {
    errors.push('Presale price cannot be negative');
  }
  
  if (eventData.gate_price && eventData.gate_price < 0) {
    errors.push('Gate price cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};