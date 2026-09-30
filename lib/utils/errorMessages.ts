/**
 * Traduction centralisée des messages d'erreur
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'Invalid email or password': 'Email ou mot de passe invalide',
  'Invalid credentials': 'Identifiants invalides',
  'User not found': 'Utilisateur non trouvé',
  'Email already exists': 'Cet email est déjà utilisé',
  'Account locked': 'Compte verrouillé. Contactez l\'administrateur',
  'Account not verified': 'Compte non vérifié. Vérifiez votre email',
  'Unauthorized': 'Accès non autorisé',
  'Forbidden': 'Accès interdit',
  'Token expired': 'Session expirée. Veuillez vous reconnecter',
  'Invalid token': 'Token invalide',

  // Validation errors
  'Email is required': 'L\'email est requis',
  'Password is required': 'Le mot de passe est requis',
  'Password too weak': 'Le mot de passe est trop faible',
  'Passwords do not match': 'Les mots de passe ne correspondent pas',
  'Invalid email format': 'Format d\'email invalide',

  // Network errors
  'Network Error': 'Erreur de connexion. Vérifiez votre connexion internet',
  'Request timeout': 'La requête a expiré. Veuillez réessayer',
  'Server error': 'Erreur serveur. Veuillez réessayer plus tard',

  // Generic errors
  'Something went wrong': 'Une erreur est survenue',
  'An error occurred': 'Une erreur est survenue',
};

/**
 * Traduit un message d'erreur en français
 */
export function translateError(errorMessage: string): string {
  // Cherche une traduction exacte
  if (ERROR_MESSAGES[errorMessage]) {
    return ERROR_MESSAGES[errorMessage];
  }

  // Cherche une traduction partielle (case insensitive)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Si aucune traduction trouvée, retourne le message original
  // s'il est déjà en français, sinon un message générique
  if (errorMessage && errorMessage.length > 0) {
    return errorMessage;
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
}

/**
 * Formate un message d'erreur pour l'affichage
 */
export function formatErrorMessage(error: any): string {
  // Si c'est un objet Error
  if (error instanceof Error) {
    return translateError(error.message);
  }

  // Si c'est une réponse API
  if (error?.response?.data?.message) {
    return translateError(error.response.data.message);
  }

  // Si c'est un message string
  if (typeof error === 'string') {
    return translateError(error);
  }

  // Par défaut
  return 'Une erreur est survenue. Veuillez réessayer.';
}
