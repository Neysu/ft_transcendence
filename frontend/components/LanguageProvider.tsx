"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Language Provider & Translation System
 * 
 * This module provides internationalization (i18n) support for the application.
 * It manages language state, provides translation functions, and persists user preferences.
 */

// Type for supported languages
type Language = "en" | "fr" | "es";

// Interface defining the shape of the language context
interface LanguageContextType {
  language: Language;              // Current active language
  toggleLanguage: () => void;      // Function to switch languages
  t: (key: string) => string;      // Translation function
}

/**
 * Translation dictionary
 * Add new translation keys here for both languages
 * Usage: t("key") will return the translated string
 */
const translations = {
  en: {
    welcome: "Welcome to ft_transcendence",
    content: "Your application content goes here.",
    language: "Language",
    hello: "Hello",
    extraInfo: "Extra info",
    signIn: "Sign in",
    signUp: "Sign up",
    username: "Username",
    password: "Password",
    email: "Email",
    confirmPassword: "Confirm Password",
    friendsList: "Friends List",
    playVsBots: "Play vs Bots",
    playVsHumans: "Play vs Humans",
    logout: "Log out",
    settings: "Settings",
    change: "Change",
    changeemailaddress: "Change email address",
    changeusername: "Change username",
    changeprofilepicture: "Change profile picture",
    changepassword: "Change password",
    profilePicture: "Profile Picture",
    rock: "rock",
    paper: "paper",
    scissors: "scissors",
    selected: "Selected",
    botChoice: "Bot's Choice",
    yourChoice: "Your Choice",
    playAgain: "Play Again",
    scoreTrackingComingSoon: "Score tracking coming soon...",
    you: "You",
    bot: "Bot",
    rockPaperScissors: "Rock Paper Scissors",
    createRoom: "Create a room",
    joinRoom: "Join a room",
    makeYourChoice: "Make your choice",
    enterRoomName: "Enter a room name",
    roomNamePlaceholder: "My Room",
    characters: "characters",
    incorrectCredentials: "Incorrect username or password. Please check your credentials and try again.",
    fillAllFields: "Please fill all fields",
    serverUnavailable: "Unable to connect to server. Please check if backend is running.",
    currentPasswordIncorrect: "Current password is incorrect"
  },
  fr: {
    welcome: "Bienvenue à ft_transcendence",
    content: "Le contenu de votre application va ici.",
    language: "Langue",
    hello: "Bonjour",
    extraInfo: "Infos supplémentaires",
    signIn: "Se connecter",
    signUp: "S'inscrire",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    email: "Email",
    confirmPassword: "Confirmer le mot de passe",
    friendsList: "Liste d'amis",
    playVsBots: "Jouer vs des bots",
    playVsHumans: "Jouer vs des humains",
    logout: "Se déconnecter",
    settings: "Paramètres",
    change: "Modifier",
    changeemailaddress: "Changer l'adresse e-mail",
    changeusername: "Changer le nom d'utilisateur",
    changeprofilepicture: "Changer la photo de profil",
    changepassword: "Changer le mot de passe",
    profilePicture: "Photo de profil",
    rock: "pierre",
    paper: "papier",
    scissors: "ciseaux",
    selected: "Sélectionné",
    botChoice: "Choix du bot",
    yourChoice: "Votre choix",
    playAgain: "Rejouer",
    scoreTrackingComingSoon: "Suivi du score bientôt disponible...",
    you: "Vous",
    bot: "Bot",
    rockPaperScissors: "Pierre Papier Ciseaux",
    createRoom: "Créer une salle",
    joinRoom: "Rejoindre une salle",
    makeYourChoice: "Faites votre choix",
    enterRoomName: "Entrez un nom de salle",
    roomNamePlaceholder: "Ma Salle",
    characters: "caractères",
    incorrectCredentials: "Nom d'utilisateur ou mot de passe incorrect. Veuillez vérifier vos identifiants et réessayer.",
    fillAllFields: "Veuillez remplir tous les champs",
    serverUnavailable: "Impossible de se connecter au serveur. Veuillez vérifier si le backend est en cours d'exécution.",
    currentPasswordIncorrect: "Le mot de passe actuel est incorrect"
  },
  es: {
    welcome: "Bienvenido a ft_transcendence",
    content: "El contenido de tu aplicación va aquí.",
    language: "Idioma",
    hello: "Hola",
    extraInfo: "Información extra",
    signIn: "Iniciar sesión",
    signUp: "Registrarse",
    username: "Nombre de usuario",
    password: "Contraseña",
    email: "Correo electrónico",
    confirmPassword: "Confirmar contraseña",
    friendsList: "Lista de amigos",
    playVsBots: "Jugar vs bots",
    playVsHumans: "Jugar vs humanos",
    logout: "Cerrar sesión",
    settings: "Configuración",
    change: "Cambiar",
    changeemailaddress: "Cambiar dirección de correo electrónico",
    changeusername: "Cambiar nombre de usuario",
    changeprofilepicture: "Cambiar foto de perfil",
    changepassword: "Cambiar contraseña",
    profilePicture: "Foto de perfil",
    rock: "piedra",
    paper: "papel",
    scissors: "tijeras",
    selected: "Seleccionado",
    botChoice: "Elección del bot",
    yourChoice: "Tu elección",
    playAgain: "Jugar de nuevo",
    scoreTrackingComingSoon: "Seguimiento de puntuación próximamente...",
    you: "Tú",
    bot: "Bot",
    rockPaperScissors: "Piedra Papel Tijeras",
    createRoom: "Crear una sala",
    joinRoom: "Unirse a una sala",
    makeYourChoice: "Haz tu elección",
    enterRoomName: "Ingresa un nombre de sala",
    roomNamePlaceholder: "Mi Sala",
    characters: "caracteres",
    incorrectCredentials: "Nombre de usuario o contraseña incorrectos. Por favor, verifica tus credenciales e inténtalo de nuevo.",
    fillAllFields: "Por favor, rellena todos los campos",
    serverUnavailable: "No se puede conectar al servidor. Por favor, verifica si el backend está en ejecución.",
    currentPasswordIncorrect: "La contraseña actual es incorrecta"
  },
};

// Create the language context with undefined as initial value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * LanguageProvider Component
 * 
 * Wraps the application and provides language context to all child components.
 * Should be placed high in the component tree (typically in layout.tsx).
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Track current language state, default to English
  const [language, setLanguage] = useState<Language>("en");

  // On component mount, restore saved language preference from localStorage
  useEffect(() => {
    // Check for saved language preference or default to English
    const savedLanguage = localStorage.getItem("language") as Language | null;
    const initialLanguage = savedLanguage || "en";
    // Only update if different from current state to avoid unnecessary re-renders
    if (initialLanguage !== language) {
      setLanguage(initialLanguage);
    }
  }, []);

  /**
   * Toggle between English, French, and Spanish
   * Updates state and persists preference to localStorage
   */
  const toggleLanguage = () => {
    const languageCycle: Record<Language, Language> = { en: "fr", fr: "es", es: "en" };
    const newLanguage = languageCycle[language];
    setLanguage(newLanguage);
    // Persist user preference
    localStorage.setItem("language", newLanguage);
  };

  /**
   * Translation function
   * @param key - The translation key to look up
   * @returns The translated string in the current language, or the key itself if not found
   */
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  // Provide language state and functions to all children
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to access language context
 * 
 * @throws Error if used outside of LanguageProvider
 * @returns Language context containing current language, toggle function, and translation function
 * 
 * Usage:
 *   const { language, toggleLanguage, t } = useLanguage();
 *   <h1>{t("welcome")}</h1>
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
