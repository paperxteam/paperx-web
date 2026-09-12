import { useState, useEffect } from 'react';

export type LanguageKey = 
  | 'English' 
  | 'Spanish' 
  | 'French' 
  | 'German' 
  | 'Hindi' 
  | 'Japanese' 
  | 'Chinese' 
  | 'Portuguese' 
  | 'Russian' 
  | 'Korean' 
  | 'Italian' 
  | 'Arabic' 
  | 'Bengali'
  | 'Marathi'
  | 'Telugu'
  | 'Tamil'
  | 'Gujarati'
  | 'Urdu';

export interface TranslationDictionary {
  // Navigation & Core
  dashboard: string;
  documents: string;
  myDocuments: string;
  recent: string;
  settings: string;
  preferences: string;
  billing: string;
  support: string;
  search: string;
  searchTools: string;
  upload: string;
  uploadFile: string;
  workspace: string;
  admin: string;
  downloadApp: string;
  logout: string;
  login: string;
  signup: string;
  allTools: string;
  home: string;
  features: string;
  pricing: string;

  // Greetings
  greeting: {
    morning: string;
    afternoon: string;
    evening: string;
  };

  // Actions & Buttons
  actions: {
    save: string;
    cancel: string;
    delete: string;
    download: string;
    preview: string;
    edit: string;
    convert: string;
    compress: string;
    merge: string;
    split: string;
    extract: string;
    rotate: string;
    protect: string;
    unlock: string;
    apply: string;
    process: string;
    processing: string;
    done: string;
    close: string;
    back: string;
    next: string;
    tryAgain: string;
    viewAll: string;
    getStarted: string;
    upgradePlan: string;
    downloadApk: string;
  };

  // Tool Categories
  categories: {
    create: string;
    convert: string;
    edit: string;
    organize: string;
    optimize: string;
    security: string;
    ai: string;
  };

  // Common Tool Names
  tools: {
    compress: string;
    merge: string;
    convert: string;
    split: string;
    pdfToWord: string;
    wordToPdf: string;
    excelToPdf: string;
    powerpointToPdf: string;
    imageToPdf: string;
    pdfToImage: string;
    ocr: string;
    translate: string;
    protect: string;
    unlock: string;
    cameraScanner: string;
    editPdf: string;
    organizePdf: string;
    digitalSign: string;
    summarizePdf: string;
    askAi: string;
    watermark: string;
    flatten: string;
    createPdf: string;
    resumeBuilder: string;
  };

  // Profile & Settings
  profile: {
    title: string;
    account: string;
    planBilling: string;
    preferencesTab: string;
    securityTab: string;
    storageTab: string;
    sessionsTab: string;
    appLanguage: string;
    appLanguageDesc: string;
    twoStepVerification: string;
    twoStepVerificationDesc: string;
    autoRestoreSession: string;
    autoRestoreSessionDesc: string;
    autoDelete: string;
    autoDeleteDesc: string;
    soundEffects: string;
    textScaling: string;
    exportData: string;
    exportDataDesc: string;
    activeSessions: string;
    revokeSessions: string;
    dangerZone: string;
  };

  // Landing & Guest Hero
  landing: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    startFree: string;
    exploreTools: string;
    popularTools: string;
    securityBadge: string;
    securityTitle: string;
    securityDesc: string;
    pricingTitle: string;
    pricingSubtitle: string;
    faqTitle: string;
  };

  // Two-Factor Auth
  twoFactor: {
    title: string;
    subtitle: string;
    enterCode: string;
    useBackup: string;
    useTotp: string;
    verifying: string;
    invalidCode: string;
    validCode: string;
    enableSuccess: string;
    backupCodesTitle: string;
    backupCodesDesc: string;
  };
}

export const TRANSLATIONS: Record<string, TranslationDictionary> = {
  'English': {
    dashboard: 'Dashboard',
    documents: 'My Documents',
    myDocuments: 'My Documents',
    recent: 'Recent',
    settings: 'Preferences',
    preferences: 'Preferences',
    billing: 'Billing',
    support: 'Support',
    search: 'Search tools...',
    searchTools: 'Search 30+ PDF tools...',
    upload: 'Upload File',
    uploadFile: 'Upload PDF or Document',
    workspace: 'Workspace',
    admin: 'Admin Console',
    downloadApp: 'Download Android APK',
    logout: 'Log Out',
    login: 'Sign In',
    signup: 'Create Account',
    allTools: 'All Tools',
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',

    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening'
    },

    actions: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      download: 'Download',
      preview: 'Preview',
      edit: 'Edit',
      convert: 'Convert',
      compress: 'Compress',
      merge: 'Merge',
      split: 'Split',
      extract: 'Extract',
      rotate: 'Rotate',
      protect: 'Protect',
      unlock: 'Unlock',
      apply: 'Apply',
      process: 'Process File',
      processing: 'Processing...',
      done: 'Done',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      tryAgain: 'Try Again',
      viewAll: 'View All',
      getStarted: 'Get Started Free',
      upgradePlan: 'Upgrade Plan',
      downloadApk: 'Download APK'
    },

    categories: {
      create: 'Create & Design',
      convert: 'Convert & Transform',
      edit: 'Edit & Markup',
      organize: 'Organize & Pages',
      optimize: 'Optimize & OCR',
      security: 'Security & Sign',
      ai: 'AI & Intelligence'
    },

    tools: {
      compress: 'Compress PDF',
      merge: 'Merge PDF',
      convert: 'Convert PDF',
      split: 'Split PDF',
      pdfToWord: 'PDF to Word',
      wordToPdf: 'Word to PDF',
      excelToPdf: 'Excel to PDF',
      powerpointToPdf: 'PowerPoint to PDF',
      imageToPdf: 'Image to PDF',
      pdfToImage: 'PDF to Image',
      ocr: 'OCR & Extract Text',
      translate: 'Translate Document',
      protect: 'Protect with Password',
      unlock: 'Unlock PDF',
      cameraScanner: 'Camera Scanner',
      editPdf: 'Edit PDF Text',
      organizePdf: 'Organize Pages',
      digitalSign: 'Digital Signatures',
      summarizePdf: 'Summarize Document',
      askAi: 'Ask AI Questions',
      watermark: 'Add Watermark',
      flatten: 'Flatten PDF',
      createPdf: 'Create PDF',
      resumeBuilder: 'Resume Builder'
    },

    profile: {
      title: 'Settings & Preferences',
      account: 'Account Profile',
      planBilling: 'Plan & Billing',
      preferencesTab: 'Preferences',
      securityTab: 'Security & 2FA',
      storageTab: 'Storage & Privacy',
      sessionsTab: 'Active Sessions',
      appLanguage: 'App Language',
      appLanguageDesc: 'Select your preferred user interface locale across the entire app',
      twoStepVerification: 'Two-Step Verification',
      twoStepVerificationDesc: 'Protect account logins with TOTP Authenticator Apps (Google Authenticator, Authy)',
      autoRestoreSession: 'Auto-Restore Session',
      autoRestoreSessionDesc: 'Automatically restore working drafts and active workspace on reopen',
      autoDelete: 'Auto-Delete Processed Files',
      autoDeleteDesc: 'Automatically purge generated outputs from local cache after 24 hours',
      soundEffects: 'Interface Sound Effects',
      textScaling: 'Font Scaling & Text Size',
      exportData: 'Export User Data',
      exportDataDesc: 'Download your personal profile, activity history, and settings as JSON',
      activeSessions: 'Active Devices & Sessions',
      revokeSessions: 'Revoke All Sessions',
      dangerZone: 'Danger Zone'
    },

    landing: {
      badge: 'Professional Cloud PDF Suite',
      heroTitle: 'All-in-One PDF Tools for Fast, Secure Workflows',
      heroSubtitle: 'Merge, split, compress, convert, OCR, translate, and protect PDF documents with bank-grade privacy.',
      startFree: 'Start Free Trial',
      exploreTools: 'Explore All Tools',
      popularTools: 'Popular PDF Tools',
      securityBadge: 'Bank-Grade Security',
      securityTitle: 'Private, Encrypted, and Reliable',
      securityDesc: 'All processing occurs locally in browser memory or encrypted isolated channels.',
      pricingTitle: 'Simple, Transparent Pricing',
      pricingSubtitle: 'Choose the plan that fits your productivity requirements.',
      faqTitle: 'Frequently Asked Questions'
    },

    twoFactor: {
      title: 'Two-Step Verification',
      subtitle: 'Enter the 6-digit verification code from your authenticator app to sign in.',
      enterCode: '6-Digit Security Code',
      useBackup: 'Use Backup Recovery Code',
      useTotp: 'Use Authenticator Code',
      verifying: 'Verifying code...',
      invalidCode: 'Invalid Authenticator code. Please check your app.',
      validCode: 'Code verified! Signing in...',
      enableSuccess: 'Two-Step Verification is now active on your account.',
      backupCodesTitle: 'Save Backup Recovery Codes',
      backupCodesDesc: 'Store these codes safely. Each code can be used once if you lose your phone.'
    }
  },

  'Spanish': {
    dashboard: 'Panel',
    documents: 'Mis Documentos',
    myDocuments: 'Mis Documentos',
    recent: 'Recientes',
    settings: 'Preferencias',
    preferences: 'Preferencias',
    billing: 'Facturación',
    support: 'Soporte',
    search: 'Buscar herramientas...',
    searchTools: 'Buscar más de 30 herramientas PDF...',
    upload: 'Subir Archivo',
    uploadFile: 'Subir PDF o Documento',
    workspace: 'Espacio de Trabajo',
    admin: 'Consola de Administración',
    downloadApp: 'Descargar APK de Android',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    signup: 'Crear Cuenta',
    allTools: 'Todas las Herramientas',
    home: 'Inicio',
    features: 'Características',
    pricing: 'Precios',

    greeting: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches'
    },

    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      download: 'Descargar',
      preview: 'Vista Previa',
      edit: 'Editar',
      convert: 'Convertir',
      compress: 'Comprimir',
      merge: 'Unir',
      split: 'Dividir',
      extract: 'Extraer',
      rotate: 'Rotar',
      protect: 'Proteger',
      unlock: 'Desbloquear',
      apply: 'Aplicar',
      process: 'Procesar Archivo',
      processing: 'Procesando...',
      done: 'Listo',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      tryAgain: 'Intentar de Nuevo',
      viewAll: 'Ver Todo',
      getStarted: 'Comenzar Gratis',
      upgradePlan: 'Mejorar Plan',
      downloadApk: 'Descargar APK'
    },

    categories: {
      create: 'Crear y Diseñar',
      convert: 'Convertir y Transformar',
      edit: 'Editar y Anotar',
      organize: 'Organizar y Páginas',
      optimize: 'Optimizar y OCR',
      security: 'Seguridad y Firma',
      ai: 'IA e Inteligencia'
    },

    tools: {
      compress: 'Comprimir PDF',
      merge: 'Unir PDF',
      convert: 'Convertir PDF',
      split: 'Dividir PDF',
      pdfToWord: 'PDF a Word',
      wordToPdf: 'Word a PDF',
      excelToPdf: 'Excel a PDF',
      powerpointToPdf: 'PowerPoint a PDF',
      imageToPdf: 'Imagen a PDF',
      pdfToImage: 'PDF a Imagen',
      ocr: 'OCR y Extraer Texto',
      translate: 'Traducir Documento',
      protect: 'Proteger con Contraseña',
      unlock: 'Desbloquear PDF',
      cameraScanner: 'Escáner de Cámara',
      editPdf: 'Editar Texto de PDF',
      organizePdf: 'Organizar Páginas',
      digitalSign: 'Firmas Digitales',
      summarizePdf: 'Resumir Documento',
      askAi: 'Preguntar a la IA',
      watermark: 'Añadir Marca de Agua',
      flatten: 'Aplanar PDF',
      createPdf: 'Crear PDF',
      resumeBuilder: 'Creador de Currículum'
    },

    profile: {
      title: 'Ajustes y Preferencias',
      account: 'Perfil de Cuenta',
      planBilling: 'Plan y Facturación',
      preferencesTab: 'Preferencias',
      securityTab: 'Seguridad y 2FA',
      storageTab: 'Almacenamiento y Privacidad',
      sessionsTab: 'Sesiones Activas',
      appLanguage: 'Idioma de la Aplicación',
      appLanguageDesc: 'Seleccione su idioma preferido para toda la aplicación',
      twoStepVerification: 'Verificación en Dos Pasos',
      twoStepVerificationDesc: 'Proteja el inicio de sesión con aplicaciones TOTP (Google Authenticator, Authy)',
      autoRestoreSession: 'Restaurar Sesión Automáticamente',
      autoRestoreSessionDesc: 'Restaure borradores de trabajo y el espacio activo al reabrir la app',
      autoDelete: 'Autoeliminar Archivos Procesados',
      autoDeleteDesc: 'Purgar automáticamente los resultados del almacenamiento local tras 24 horas',
      soundEffects: 'Efectos de Sonido',
      textScaling: 'Escalado de Fuente y Tamaño',
      exportData: 'Exportar Datos de Usuario',
      exportDataDesc: 'Descargue su perfil, historial de actividad y ajustes en formato JSON',
      activeSessions: 'Dispositivos y Sesiones Activas',
      revokeSessions: 'Revocar Todas las Sesiones',
      dangerZone: 'Zona de Peligro'
    },

    landing: {
      badge: 'Suite Profesional de PDF en la Nube',
      heroTitle: 'Herramientas PDF Todo en Uno para Flujos Rápidos y Seguros',
      heroSubtitle: 'Una, divida, comprima, convierta, aplique OCR, traduzca y proteja documentos con privacidad de nivel bancario.',
      startFree: 'Iniciar Prueba Gratuita',
      exploreTools: 'Explorar Herramientas',
      popularTools: 'Herramientas Populares',
      securityBadge: 'Seguridad de Grado Bancario',
      securityTitle: 'Privado, Cifrado y Confiable',
      securityDesc: 'Todo el procesamiento se realiza localmente en la memoria del navegador o canales aislados.',
      pricingTitle: 'Precios Simples y Transparentes',
      pricingSubtitle: 'Elija el plan que se adapte a sus necesidades de productividad.',
      faqTitle: 'Preguntas Frecuentes'
    },

    twoFactor: {
      title: 'Verificación en Dos Pasos',
      subtitle: 'Ingrese el código de 6 dígitos de su aplicación de autenticación para iniciar sesión.',
      enterCode: 'Código de Seguridad de 6 Dígitos',
      useBackup: 'Usar Código de Recuperación',
      useTotp: 'Usar Código de Autenticador',
      verifying: 'Verificando código...',
      invalidCode: 'Código no válido. Revise su aplicación de autenticación.',
      validCode: '¡Código verificado! Iniciando sesión...',
      enableSuccess: 'La verificación en dos pasos está activa en su cuenta.',
      backupCodesTitle: 'Guardar Códigos de Recuperación',
      backupCodesDesc: 'Guarde estos códigos de forma segura. Cada uno puede usarse una vez si pierde el móvil.'
    }
  },

  'Hindi': {
    dashboard: 'डैशबोर्ड',
    documents: 'मेरे दस्तावेज़',
    myDocuments: 'मेरे दस्तावेज़',
    recent: 'हाल के दस्तावेज़',
    settings: 'सेटिंग्स व प्राथमिकताएं',
    preferences: 'प्राथमिकताएं',
    billing: 'बिलिंग व योजनाएं',
    support: 'सहायता व समर्थन',
    search: 'टूल्स खोजें...',
    searchTools: '30+ PDF टूल्स खोजें...',
    upload: 'फ़ाइल अपलोड करें',
    uploadFile: 'PDF या दस्तावेज़ अपलोड करें',
    workspace: 'कार्यक्षेत्र',
    admin: 'व्यवस्थापक कंसोल',
    downloadApp: 'Android APK डाउनलोड करें',
    logout: 'लॉग आउट',
    login: 'साइन इन करें',
    signup: 'खाता बनाएं',
    allTools: 'सभी टूल्स',
    home: 'होम',
    features: 'विशेषताएं',
    pricing: 'मूल्य निर्धारण',

    greeting: {
      morning: 'सुप्रभात',
      afternoon: 'शुभ दोपहर',
      evening: 'शुभ संध्या'
    },

    actions: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      download: 'डाउनलोड करें',
      preview: 'पूर्वावलोकन',
      edit: 'संपादित करें',
      convert: 'परिवर्तित करें',
      compress: 'कंप्रेस करें',
      merge: 'मर्ज करें',
      split: 'विभाजित करें',
      extract: 'निकालें',
      rotate: 'घुमाएं',
      protect: 'सुरक्षित करें',
      unlock: 'अनलॉक करें',
      apply: 'लागू करें',
      process: 'फ़ाइल प्रोसेस करें',
      processing: 'प्रोसेसिंग जारी है...',
      done: 'पूर्ण',
      close: 'बंद करें',
      back: 'पीछे जाएं',
      next: 'आगे बढ़ें',
      tryAgain: 'पुनः प्रयास करें',
      viewAll: 'सभी देखें',
      getStarted: 'मुफ़्त शुरू करें',
      upgradePlan: 'प्लान अपग्रेड करें',
      downloadApk: 'APK डाउनलोड करें'
    },

    categories: {
      create: 'बनाएं और डिज़ाइन करें',
      convert: 'कन्वर्ट और ट्रांसफॉर्म',
      edit: 'संपादित करें और मार्कअप',
      organize: 'व्यवस्थित करें और पेज',
      optimize: 'ऑप्टिमाइज़ और OCR',
      security: 'सुरक्षा और हस्ताक्षर',
      ai: 'AI और इंटेलिजेंस'
    },

    tools: {
      compress: 'PDF कंप्रेस करें',
      merge: 'PDF मर्ज करें',
      convert: 'PDF कन्वर्ट करें',
      split: 'PDF स्प्लिट करें',
      pdfToWord: 'PDF से Word',
      wordToPdf: 'Word से PDF',
      excelToPdf: 'Excel से PDF',
      powerpointToPdf: 'PowerPoint से PDF',
      imageToPdf: 'इमेज से PDF',
      pdfToImage: 'PDF से इमेज',
      ocr: 'OCR और टेक्स्ट निकालें',
      translate: 'दस्तावेज़ अनुवाद करें',
      protect: 'पासवर्ड से सुरक्षित करें',
      unlock: 'PDF अनलॉक करें',
      cameraScanner: 'कैमरा स्कैनर',
      editPdf: 'PDF टेक्स्ट संपादित करें',
      organizePdf: 'पेज व्यवस्थित करें',
      digitalSign: 'डिजिटल हस्ताक्षर',
      summarizePdf: 'दस्तावेज़ का सारांश निकालें',
      askAi: 'AI से प्रश्न पूछें',
      watermark: 'वाटरमार्क जोड़ें',
      flatten: 'PDF फ़्लैटन करें',
      createPdf: 'नया PDF बनाएं',
      resumeBuilder: 'बायोडाटा / CV बिल्डर'
    },

    profile: {
      title: 'सेटिंग्स और प्राथमिकताएं',
      account: 'खाता प्रोफ़ाइल',
      planBilling: 'योजना और बिलिंग',
      preferencesTab: 'प्राथमिकताएं',
      securityTab: 'सुरक्षा और 2FA',
      storageTab: 'स्टोरेज और गोपनीयता',
      sessionsTab: 'सक्रिय सत्र',
      appLanguage: 'ऐप भाषा',
      appLanguageDesc: 'संपूर्ण एप्लिकेशन के लिए अपनी पसंदीदा भाषा चुनें',
      twoStepVerification: 'दो-चरणीय सत्यापन (2FA)',
      twoStepVerificationDesc: 'TOTP ऑथेंटिकेटर ऐप्स (Google Authenticator, Authy) के साथ अपने खाते को सुरक्षित करें',
      autoRestoreSession: 'सत्र स्वतः पुनर्स्थापित करें',
      autoRestoreSessionDesc: 'ऐप दोबारा खोलने पर सक्रिय कार्यक्षेत्र और ड्राफ़्ट स्वतः लोड करें',
      autoDelete: 'प्रोसेस की गई फ़ाइलें स्वतः हटाएं',
      autoDeleteDesc: '24 घंटे के बाद स्थानीय कैश से आउटपुट स्वतः हटा दें',
      soundEffects: 'इंटरफ़ेस ध्वनि प्रभाव',
      textScaling: 'फ़ॉन्ट आकार और स्केलिंग',
      exportData: 'उपयोगकर्ता डेटा निर्यात करें',
      exportDataDesc: 'अपनी प्रोफ़ाइल, गतिविधि इतिहास और सेटिंग्स को JSON में डाउनलोड करें',
      activeSessions: 'सक्रिय उपकरण और सत्र',
      revokeSessions: 'सभी सत्र समाप्त करें',
      dangerZone: 'डेंजर ज़ोन'
    },

    landing: {
      badge: 'व्यावसायिक क्लाउड PDF सुइट',
      heroTitle: 'तेज़ और सुरक्षित वर्कफ़्लो के लिए ऑल-इन-वन PDF टूल्स',
      heroSubtitle: 'बैंक-स्तरीय गोपनीयता के साथ PDF दस्तावेज़ों को मर्ज, स्प्लिट, कंप्रेस, कन्वर्ट, OCR और सुरक्षित करें।',
      startFree: 'मुफ़्त परीक्षण शुरू करें',
      exploreTools: 'सभी टूल्स देखें',
      popularTools: 'लोकप्रिय PDF टूल्स',
      securityBadge: 'बैंक-स्तरीय सुरक्षा',
      securityTitle: 'निजी, एन्क्रिप्टेड और विश्वसनीय',
      securityDesc: 'सभी प्रोसेसिंग ब्राउज़र मेमोरी या पृथक एन्क्रिप्टेड चैनलों में सुरक्षित रूप से होती है।',
      pricingTitle: 'सरल और पारदर्शी मूल्य निर्धारण',
      pricingSubtitle: 'अपनी उत्पादकता के अनुसार सही योजना चुनें।',
      faqTitle: 'अक्सर पूछे जाने वाले प्रश्न'
    },

    twoFactor: {
      title: 'दो-चरणीय सत्यापन',
      subtitle: 'साइन इन करने के लिए अपने ऑथेंटिकेटर ऐप से 6-अंकीय कोड दर्ज करें।',
      enterCode: '6-अंकीय सुरक्षा कोड',
      useBackup: 'बैकअप रिकवरी कोड का उपयोग करें',
      useTotp: 'ऑथेंटिकेटर कोड का उपयोग करें',
      verifying: 'कोड सत्यापित किया जा रहा है...',
      invalidCode: 'अमान्य कोड। कृपया अपना ऑथेंटिकेटर ऐप जांचें।',
      validCode: 'कोड सत्यापित! साइन इन किया जा रहा है...',
      enableSuccess: 'आपके खाते पर दो-चरणीय सत्यापन सक्रिय हो गया है।',
      backupCodesTitle: 'बैकअप रिकवरी कोड सुरक्षित रखें',
      backupCodesDesc: 'इन कोडों को सुरक्षित रखें। फ़ोन खो जाने पर प्रत्येक कोड का उपयोग एक बार किया जा सकता है।'
    }
  },

  'French': {
    dashboard: 'Tableau de bord',
    documents: 'Mes Documents',
    myDocuments: 'Mes Documents',
    recent: 'Récents',
    settings: 'Préférences',
    preferences: 'Préférences',
    billing: 'Facturation',
    support: 'Support',
    search: 'Rechercher des outils...',
    searchTools: 'Rechercher plus de 30 outils PDF...',
    upload: 'Téléverser un fichier',
    uploadFile: 'Téléverser un PDF ou Document',
    workspace: 'Espace de travail',
    admin: 'Console Administrateur',
    downloadApp: 'Télécharger APK Android',
    logout: 'Déconnexion',
    login: 'Connexion',
    signup: 'Créer un compte',
    allTools: 'Tous les Outils',
    home: 'Accueil',
    features: 'Fonctionnalités',
    pricing: 'Tarifs',

    greeting: {
      morning: 'Bonjour',
      afternoon: 'Bon après-midi',
      evening: 'Bonsoir'
    },

    actions: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      download: 'Télécharger',
      preview: 'Aperçu',
      edit: 'Modifier',
      convert: 'Convertir',
      compress: 'Compresser',
      merge: 'Fusionner',
      split: 'Diviser',
      extract: 'Extraire',
      rotate: 'Faire pivoter',
      protect: 'Protéger',
      unlock: 'Déverrouiller',
      apply: 'Appliquer',
      process: 'Traiter le fichier',
      processing: 'Traitement en cours...',
      done: 'Terminé',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      tryAgain: 'Réessayer',
      viewAll: 'Voir tout',
      getStarted: 'Commencer gratuitement',
      upgradePlan: 'Changer de forfait',
      downloadApk: 'Télécharger APK'
    },

    categories: {
      create: 'Créer et Concevoir',
      convert: 'Convertir et Transformer',
      edit: 'Modifier et Annoter',
      organize: 'Organiser et Pages',
      optimize: 'Optimiser et OCR',
      security: 'Sécurité et Signature',
      ai: 'IA et Intelligence'
    },

    tools: {
      compress: 'Compresser PDF',
      merge: 'Fusionner PDF',
      convert: 'Convertir PDF',
      split: 'Diviser PDF',
      pdfToWord: 'PDF vers Word',
      wordToPdf: 'Word vers PDF',
      excelToPdf: 'Excel vers PDF',
      powerpointToPdf: 'PowerPoint vers PDF',
      imageToPdf: 'Image vers PDF',
      pdfToImage: 'PDF vers Image',
      ocr: 'OCR et Extraire Texte',
      translate: 'Traduire Document',
      protect: 'Protéger par Mot de Passe',
      unlock: 'Déverrouiller PDF',
      cameraScanner: 'Scanner Caméra',
      editPdf: 'Modifier Texte PDF',
      organizePdf: 'Organiser Pages',
      digitalSign: 'Signatures Numériques',
      summarizePdf: 'Résumer Document',
      askAi: 'Poser des Questions à l’IA',
      watermark: 'Ajouter Filigrane',
      flatten: 'Aplatir PDF',
      createPdf: 'Créer PDF',
      resumeBuilder: 'Générateur de CV'
    },

    profile: {
      title: 'Paramètres et Préférences',
      account: 'Profil du Compte',
      planBilling: 'Forfait et Facturation',
      preferencesTab: 'Préférences',
      securityTab: 'Sécurité et 2FA',
      storageTab: 'Stockage et Confidentialité',
      sessionsTab: 'Sessions Actives',
      appLanguage: 'Langue de l’application',
      appLanguageDesc: 'Choisissez votre langue pour l’ensemble de l’application',
      twoStepVerification: 'Validation en deux étapes',
      twoStepVerificationDesc: 'Protégez vos connexions avec des applications TOTP (Google Authenticator, Authy)',
      autoRestoreSession: 'Restaurer la session automatiquement',
      autoRestoreSessionDesc: 'Restaurez vos brouillons et votre espace de travail à la réouverture',
      autoDelete: 'Suppression automatique des fichiers',
      autoDeleteDesc: 'Supprimer automatiquement les résultats du cache local après 24 heures',
      soundEffects: 'Effets sonores',
      textScaling: 'Taille du texte et police',
      exportData: 'Exporter les données',
      exportDataDesc: 'Téléchargez votre profil, historique et paramètres au format JSON',
      activeSessions: 'Appareils et sessions actives',
      revokeSessions: 'Révoquer toutes les sessions',
      dangerZone: 'Zone dangereuse'
    },

    landing: {
      badge: 'Suite PDF Cloud Professionnelle',
      heroTitle: 'Outils PDF tout-en-un pour des flux de travail rapides et sécurisés',
      heroSubtitle: 'Fusionnez, divisez, compressez, convertissez, appliquez l’OCR et protégez vos documents en toute confidentialité.',
      startFree: 'Essai Gratuit',
      exploreTools: 'Explorer les Outils',
      popularTools: 'Outils Populaires',
      securityBadge: 'Sécurité de Niveau Bancaire',
      securityTitle: 'Privé, Chiffré et Fiable',
      securityDesc: 'Tout le traitement est exécuté localement dans la mémoire du navigateur ou sur des canaux chiffrés.',
      pricingTitle: 'Tarification Simple et Transparente',
      pricingSubtitle: 'Choisissez le forfait adapté à votre productivité.',
      faqTitle: 'Questions Fréquemment Posées'
    },

    twoFactor: {
      title: 'Validation en deux étapes',
      subtitle: 'Entrez le code à 6 chiffres généré par votre application d’authentification pour vous connecter.',
      enterCode: 'Code de sécurité à 6 chiffres',
      useBackup: 'Utiliser un code de secours',
      useTotp: 'Utiliser le code Authenticator',
      verifying: 'Vérification en cours...',
      invalidCode: 'Code invalide. Veuillez vérifier votre application.',
      validCode: 'Code vérifié ! Connexion en cours...',
      enableSuccess: 'La validation en deux étapes est maintenant active.',
      backupCodesTitle: 'Enregistrer les codes de secours',
      backupCodesDesc: 'Conservez ces codes en lieu sûr. Chaque code est utilisable une seule fois.'
    }
  },

  'German': {
    dashboard: 'Dashboard',
    documents: 'Meine Dokumente',
    myDocuments: 'Meine Dokumente',
    recent: 'Zuletzt verwendet',
    settings: 'Einstellungen',
    preferences: 'Einstellungen',
    billing: 'Abrechnung',
    support: 'Support',
    search: 'Werkzeuge suchen...',
    searchTools: 'Über 30 PDF-Tools durchsuchen...',
    upload: 'Datei hochladen',
    uploadFile: 'PDF oder Dokument hochladen',
    workspace: 'Arbeitsbereich',
    admin: 'Admin-Konsole',
    downloadApp: 'Android-APK herunterladen',
    logout: 'Abmelden',
    login: 'Anmelden',
    signup: 'Konto erstellen',
    allTools: 'Alle Tools',
    home: 'Startseite',
    features: 'Funktionen',
    pricing: 'Preise',

    greeting: {
      morning: 'Guten Morgen',
      afternoon: 'Guten Tag',
      evening: 'Guten Abend'
    },

    actions: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      download: 'Herunterladen',
      preview: 'Vorschau',
      edit: 'Bearbeiten',
      convert: 'Konvertieren',
      compress: 'Komprimieren',
      merge: 'Zusammenfügen',
      split: 'Teilen',
      extract: 'Extrahieren',
      rotate: 'Drehen',
      protect: 'Schützen',
      unlock: 'Entsperren',
      apply: 'Anwenden',
      process: 'Datei verarbeiten',
      processing: 'Verarbeitung läuft...',
      done: 'Fertig',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      tryAgain: 'Erneut versuchen',
      viewAll: 'Alle anzeigen',
      getStarted: 'Kostenlos starten',
      upgradePlan: 'Plan upgraden',
      downloadApk: 'APK herunterladen'
    },

    categories: {
      create: 'Erstellen & Gestalten',
      convert: 'Konvertieren & Umwandeln',
      edit: 'Bearbeiten & Markieren',
      organize: 'Organisieren & Seiten',
      optimize: 'Optimieren & OCR',
      security: 'Sicherheit & Signatur',
      ai: 'KI & Intelligenz'
    },

    tools: {
      compress: 'PDF komprimieren',
      merge: 'PDF zusammenfügen',
      convert: 'PDF konvertieren',
      split: 'PDF teilen',
      pdfToWord: 'PDF zu Word',
      wordToPdf: 'Word zu PDF',
      excelToPdf: 'Excel zu PDF',
      powerpointToPdf: 'PowerPoint zu PDF',
      imageToPdf: 'Bild zu PDF',
      pdfToImage: 'PDF zu Bild',
      ocr: 'OCR & Text extrahieren',
      translate: 'Dokument übersetzen',
      protect: 'Mit Passwort schützen',
      unlock: 'PDF entsperren',
      cameraScanner: 'Kamera-Scanner',
      editPdf: 'PDF-Text bearbeiten',
      organizePdf: 'Seiten organisieren',
      digitalSign: 'Digitale Signaturen',
      summarizePdf: 'Dokument zusammenfassen',
      askAi: 'Fragen an KI stellen',
      watermark: 'Wasserzeichen hinzufügen',
      flatten: 'PDF abflachen',
      createPdf: 'PDF erstellen',
      resumeBuilder: 'Lebenslauf-Generator'
    },

    profile: {
      title: 'Einstellungen & Präferenzen',
      account: 'Kontoprofil',
      planBilling: 'Plan & Abrechnung',
      preferencesTab: 'Einstellungen',
      securityTab: 'Sicherheit & 2FA',
      storageTab: 'Speicher & Datenschutz',
      sessionsTab: 'Aktive Sitzungen',
      appLanguage: 'App-Sprache',
      appLanguageDesc: 'Wählen Sie Ihre bevorzugte Sprache für die gesamte Anwendung',
      twoStepVerification: 'Zweistufige Verifizierung',
      twoStepVerificationDesc: 'Schützen Sie Ihr Konto mit TOTP-Authenticator-Apps (Google Authenticator, Authy)',
      autoRestoreSession: 'Sitzung automatisch wiederherstellen',
      autoRestoreSessionDesc: 'Stellen Sie Entwürfe und den aktiven Arbeitsbereich beim erneuten Öffnen wieder her',
      autoDelete: 'Verarbeitete Dateien automatisch löschen',
      autoDeleteDesc: 'Dateien nach 24 Stunden automatisch aus dem lokalen Cache bereinigen',
      soundEffects: 'Soundeffekte',
      textScaling: 'Schriftgröße & Skalierung',
      exportData: 'Benutzerdaten exportieren',
      exportDataDesc: 'Laden Sie Profil, Verlauf und Einstellungen als JSON herunter',
      activeSessions: 'Aktive Geräte & Sitzungen',
      revokeSessions: 'Alle Sitzungen abmelden',
      dangerZone: 'Gefahrenzone'
    },

    landing: {
      badge: 'Professionelle Cloud-PDF-Suite',
      heroTitle: 'All-in-One PDF-Tools für schnelle, sichere Arbeitsabläufe',
      heroSubtitle: 'Fügen Sie PDFs zusammen, teilen, komprimieren, konvertieren, nutzen Sie OCR und schützen Sie Dokumente sicher.',
      startFree: 'Kostenlos testen',
      exploreTools: 'Alle Tools entdecken',
      popularTools: 'Beliebte PDF-Tools',
      securityBadge: 'Sicherheit auf Bankenniveau',
      securityTitle: 'Privat, verschlüsselt und zuverlässig',
      securityDesc: 'Die Verarbeitung erfolgt lokal im Browserspeicher oder über isolierte, verschlüsselte Kanäle.',
      pricingTitle: 'Einfache, transparente Preise',
      pricingSubtitle: 'Wählen Sie den Plan, der zu Ihrer Produktivität passt.',
      faqTitle: 'Häufig gestellte Fragen'
    },

    twoFactor: {
      title: 'Zweistufige Verifizierung',
      subtitle: 'Geben Sie den 6-stelligen Code aus Ihrer Authentifikator-App ein.',
      enterCode: '6-stelliger Sicherheitscode',
      useBackup: 'Wiederherstellungscode verwenden',
      useTotp: 'Authenticator-Code verwenden',
      verifying: 'Code wird überprüft...',
      invalidCode: 'Ungültiger Code. Bitte prüfen Sie Ihre App.',
      validCode: 'Code bestätigt! Anmeldung erfolgt...',
      enableSuccess: 'Zweistufige Verifizierung ist jetzt aktiv.',
      backupCodesTitle: 'Wiederherstellungscodes speichern',
      backupCodesDesc: 'Bewahren Sie diese Codes sicher auf. Jeder Code kann einmal verwendet werden.'
    }
  },

  'Japanese': {
    dashboard: 'ダッシュボード',
    documents: 'マイドキュメント',
    myDocuments: 'マイドキュメント',
    recent: '最近のファイル',
    settings: '設定と環境設定',
    preferences: '環境設定',
    billing: 'プランと請求',
    support: 'サポート',
    search: 'ツールを検索...',
    searchTools: '30以上のPDFツールを検索...',
    upload: 'ファイルをアップロード',
    uploadFile: 'PDFまたはドキュメントをアップロード',
    workspace: 'ワークスペース',
    admin: '管理者コンソール',
    downloadApp: 'Android APKをダウンロード',
    logout: 'ログアウト',
    login: 'ログイン',
    signup: 'アカウント作成',
    allTools: 'すべてのツール',
    home: 'ホーム',
    features: '機能一覧',
    pricing: '料金プラン',

    greeting: {
      morning: 'おはようございます',
      afternoon: 'こんにちは',
      evening: 'こんばんは'
    },

    actions: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      download: 'ダウンロード',
      preview: 'プレビュー',
      edit: '編集',
      convert: '変換',
      compress: '圧縮',
      merge: '結合',
      split: '分割',
      extract: '抽出',
      rotate: '回転',
      protect: '保護',
      unlock: 'ロック解除',
      apply: '適用',
      process: '処理を開始',
      processing: '処理中...',
      done: '完了',
      close: '閉じる',
      back: '戻る',
      next: '次へ',
      tryAgain: '再試行',
      viewAll: 'すべて表示',
      getStarted: '無料で始める',
      upgradePlan: 'プランをアップグレード',
      downloadApk: 'APKをダウンロード'
    },

    categories: {
      create: '作成・デザイン',
      convert: '変換・エクスポート',
      edit: '編集・注釈',
      organize: '整理・ページ管理',
      optimize: '最適化・OCR',
      security: 'セキュリティ・署名',
      ai: 'AI・インテリジェンス'
    },

    tools: {
      compress: 'PDFを圧縮',
      merge: 'PDFを結合',
      convert: 'PDFを変換',
      split: 'PDFを分割',
      pdfToWord: 'PDFからWordへ',
      wordToPdf: 'WordからPDFへ',
      excelToPdf: 'ExcelからPDFへ',
      powerpointToPdf: 'PowerPointからPDFへ',
      imageToPdf: '画像からPDFへ',
      pdfToImage: 'PDFから画像へ',
      ocr: 'OCR・テキスト抽出',
      translate: 'ドキュメント翻訳',
      protect: 'パスワードで保護',
      unlock: 'PDFのロック解除',
      cameraScanner: 'カメラスキャナー',
      editPdf: 'PDFテキスト編集',
      organizePdf: 'ページ整理',
      digitalSign: '電子署名',
      summarizePdf: 'ドキュメント要約',
      askAi: 'AIに質問する',
      watermark: '透かしを追加',
      flatten: 'PDFをフラット化',
      createPdf: 'PDFを新規作成',
      resumeBuilder: '履歴書・CV作成'
    },

    profile: {
      title: '設定・環境設定',
      account: 'アカウント情報',
      planBilling: 'プランと請求',
      preferencesTab: '環境設定',
      securityTab: 'セキュリティと2FA',
      storageTab: 'ストレージとプライバシー',
      sessionsTab: 'アクティブなセッション',
      appLanguage: 'アプリの言語',
      appLanguageDesc: 'アプリ全体で使用する言語を選択します',
      twoStepVerification: '2段階認証 (2FA)',
      twoStepVerificationDesc: '認証アプリ (Google Authenticator、Authy等) でログインを保護します',
      autoRestoreSession: 'セッションの自動復元',
      autoRestoreSessionDesc: 'アプリを再度開いたときに作業中の下書きを自動復元します',
      autoDelete: '処理済みファイルの自動削除',
      autoDeleteDesc: '24時間後にローカルストレージから一時ファイルを自動消去します',
      soundEffects: '効果音',
      textScaling: 'フォントサイズ調整',
      exportData: 'ユーザーデータのエクスポート',
      exportDataDesc: 'プロフィール、履歴、設定をJSON形式でダウンロードします',
      activeSessions: '接続中の端末・セッション',
      revokeSessions: 'すべてのセッションを切断',
      dangerZone: '危険な設定'
    },

    landing: {
      badge: 'プロフェッショナル クラウド PDF スイート',
      heroTitle: '迅速で安全な作業のためのオールインワンPDFツール',
      heroSubtitle: 'PDFの結合、分割、圧縮、変換、OCR、翻訳、パスワード保護を最高レベルのプライバシーで実現します。',
      startFree: '無料トライアルを開始',
      exploreTools: 'ツール一覧を見る',
      popularTools: '人気のPDFツール',
      securityBadge: '銀行基準のセキュリティ',
      securityTitle: 'プライベート、暗号化、高信頼性',
      securityDesc: 'すべての処理はブラウザメモリまたは安全に暗号化された環境内で行われます。',
      pricingTitle: 'シンプルで明瞭な料金体系',
      pricingSubtitle: 'あなたのニーズに合わせた最適なプランをお選びください。',
      faqTitle: 'よくあるご質問'
    },

    twoFactor: {
      title: '2段階認証',
      subtitle: '認証アプリに表示されている6桁のコードを入力してログインしてください。',
      enterCode: '6桁のセキュリティコード',
      useBackup: 'バックアップ復旧コードを使用',
      useTotp: '認証アプリコードを使用',
      verifying: 'コードを検証中...',
      invalidCode: '無効なコードです。認証アプリをご確認ください。',
      validCode: '認証に成功しました！ログイン中...',
      enableSuccess: 'アカウントで2段階認証が有効になりました。',
      backupCodesTitle: 'バックアップ復旧コードの保存',
      backupCodesDesc: 'これらのコードを安全な場所に保存してください。端末を紛失した際に1回ずつ使用できます。'
    }
  },

  'Chinese': {
    dashboard: '仪表板',
    documents: '我的文档',
    myDocuments: '我的文档',
    recent: '最近文件',
    settings: '偏好设置',
    preferences: '偏好设置',
    billing: '套餐与账单',
    support: '客户支持',
    search: '搜索工具...',
    searchTools: '搜索 30+ 款 PDF 工具...',
    upload: '上传文件',
    uploadFile: '上传 PDF 或其他文档',
    workspace: '工作区',
    admin: '管理控制台',
    downloadApp: '下载安卓 APK',
    logout: '退出登录',
    login: '登录',
    signup: '注册账号',
    allTools: '全部工具',
    home: '首页',
    features: '功能特点',
    pricing: '价格方案',

    greeting: {
      morning: '早上好',
      afternoon: '下午好',
      evening: '晚上好'
    },

    actions: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      download: '下载',
      preview: '预览',
      edit: '编辑',
      convert: '转换',
      compress: '压缩',
      merge: '合并',
      split: '拆分',
      extract: '提取',
      rotate: '旋转',
      protect: '加密保护',
      unlock: '解除密码',
      apply: '应用',
      process: '开始处理',
      processing: '处理中...',
      done: '完成',
      close: '关闭',
      back: '返回',
      next: '下一步',
      tryAgain: '重试',
      viewAll: '查看全部',
      getStarted: '免费开始使用',
      upgradePlan: '升级套餐',
      downloadApk: '下载 APK'
    },

    categories: {
      create: '创建与设计',
      convert: '格式转换',
      edit: '编辑与标注',
      organize: '页面管理',
      optimize: '优化与 OCR',
      security: '安全与签名',
      ai: 'AI 智能辅助'
    },

    tools: {
      compress: '压缩 PDF',
      merge: '合并 PDF',
      convert: '转换 PDF',
      split: '拆分 PDF',
      pdfToWord: 'PDF 转 Word',
      wordToPdf: 'Word 转 PDF',
      excelToPdf: 'Excel 转 PDF',
      powerpointToPdf: 'PowerPoint 转 PDF',
      imageToPdf: '图片转 PDF',
      pdfToImage: 'PDF 转图片',
      ocr: 'OCR 提取文本',
      translate: '翻译文档',
      protect: '设置密码保护',
      unlock: '解除 PDF 限制',
      cameraScanner: '相机扫描仪',
      editPdf: '编辑 PDF 文本',
      organizePdf: '整理页面顺序',
      digitalSign: '电子签名',
      summarizePdf: '文档智能总结',
      askAi: '向 AI 提问',
      watermark: '添加水印',
      flatten: '拼合 PDF 图层',
      createPdf: '新建 PDF',
      resumeBuilder: '简历制作器'
    },

    profile: {
      title: '设置与偏好',
      account: '账户信息',
      planBilling: '方案与账单',
      preferencesTab: '偏好设置',
      securityTab: '安全与两步验证',
      storageTab: '存储与隐私',
      sessionsTab: '活跃会话',
      appLanguage: '应用语言',
      appLanguageDesc: '选择全站界面的显示语言',
      twoStepVerification: '两步验证 (2FA)',
      twoStepVerificationDesc: '使用 TOTP 身份验证器（如 Google Authenticator、Authy）保护账户安全',
      autoRestoreSession: '自动恢复会话',
      autoRestoreSessionDesc: '重新打开应用时自动恢复正在编辑的工作区草稿',
      autoDelete: '自动清理已处理文件',
      autoDeleteDesc: '24 小时后自动清除本地缓存中的生成文件',
      soundEffects: '界面音效',
      textScaling: '字体大小缩放',
      exportData: '导出用户数据',
      exportDataDesc: '以 JSON 格式下载个人资料、操作记录和设置',
      activeSessions: '当前活跃设备与会话',
      revokeSessions: '下线所有设备',
      dangerZone: '危险操作'
    },

    landing: {
      badge: '专业级云端 PDF 工具套件',
      heroTitle: '一站式 PDF 工具，打造高效安全的办公流程',
      heroSubtitle: '合并、拆分、压缩、格式转换、OCR 识别、多语言翻译及文档加密，尽享银行级安全隐私。',
      startFree: '立即免费体验',
      exploreTools: '浏览所有工具',
      popularTools: '热门 PDF 工具',
      securityBadge: '银行级安全保障',
      securityTitle: '私密、加密、极速可靠',
      securityDesc: '所有处理均在浏览器本地内存或严格隔离的加密通道中进行。',
      pricingTitle: '简单透明的定价方案',
      pricingSubtitle: '选择最符合您生产力需求的套餐。',
      faqTitle: '常见问题解答'
    },

    twoFactor: {
      title: '两步身份验证',
      subtitle: '请输入身份验证器应用中显示的 6 位动态验证码。',
      enterCode: '6 位安全验证码',
      useBackup: '使用备用恢复码',
      useTotp: '使用验证器动态码',
      verifying: '正在验证...',
      invalidCode: '验证码无效，请检查身份验证器应用。',
      validCode: '验证成功！正在登录...',
      enableSuccess: '您的账号已成功开启两步验证。',
      backupCodesTitle: '妥善保存备用恢复码',
      backupCodesDesc: '请安全保管这些备用码。若手机丢失，每个备用码均可单次使用。'
    }
  },

  'Portuguese': {
    dashboard: 'Painel',
    documents: 'Meus Documentos',
    myDocuments: 'Meus Documentos',
    recent: 'Recentes',
    settings: 'Preferências',
    preferences: 'Preferências',
    billing: 'Faturamento',
    support: 'Suporte',
    search: 'Pesquisar ferramentas...',
    searchTools: 'Pesquisar mais de 30 ferramentas PDF...',
    upload: 'Enviar Arquivo',
    uploadFile: 'Enviar PDF ou Documento',
    workspace: 'Espaço de Trabalho',
    admin: 'Console de Administração',
    downloadApp: 'Baixar APK Android',
    logout: 'Sair da Conta',
    login: 'Entrar',
    signup: 'Criar Conta',
    allTools: 'Todas as Ferramentas',
    home: 'Início',
    features: 'Recursos',
    pricing: 'Planos e Preços',

    greeting: {
      morning: 'Bom dia',
      afternoon: 'Boa tarde',
      evening: 'Boa noite'
    },

    actions: {
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      download: 'Baixar',
      preview: 'Visualizar',
      edit: 'Editar',
      convert: 'Converter',
      compress: 'Comprimir',
      merge: 'Mesclar',
      split: 'Dividir',
      extract: 'Extrair',
      rotate: 'Girar',
      protect: 'Proteger',
      unlock: 'Desbloquear',
      apply: 'Aplicar',
      process: 'Processar Arquivo',
      processing: 'Processando...',
      done: 'Concluído',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Avançar',
      tryAgain: 'Tentar Novamente',
      viewAll: 'Ver Tudo',
      getStarted: 'Começar Grátis',
      upgradePlan: 'Atualizar Plano',
      downloadApk: 'Baixar APK'
    },

    categories: {
      create: 'Criar e Projetar',
      convert: 'Converter e Transformar',
      edit: 'Editar e Anotar',
      organize: 'Organizar e Páginas',
      optimize: 'Otimizar e OCR',
      security: 'Segurança e Assinatura',
      ai: 'IA e Inteligência'
    },

    tools: {
      compress: 'Comprimir PDF',
      merge: 'Mesclar PDF',
      convert: 'Converter PDF',
      split: 'Dividir PDF',
      pdfToWord: 'PDF para Word',
      wordToPdf: 'Word para PDF',
      excelToPdf: 'Excel para PDF',
      powerpointToPdf: 'PowerPoint para PDF',
      imageToPdf: 'Imagem para PDF',
      pdfToImage: 'PDF para Imagem',
      ocr: 'OCR e Extrair Texto',
      translate: 'Traduzir Documento',
      protect: 'Proteger com Senha',
      unlock: 'Desbloquear PDF',
      cameraScanner: 'Scanner de Câmera',
      editPdf: 'Editar Texto do PDF',
      organizePdf: 'Organizar Páginas',
      digitalSign: 'Assinaturas Digitais',
      summarizePdf: 'Resumir Documento',
      askAi: 'Fazer Perguntas à IA',
      watermark: 'Adicionar Marca d’Água',
      flatten: 'Mesclar Camadas do PDF',
      createPdf: 'Criar PDF',
      resumeBuilder: 'Criador de Currículos'
    },

    profile: {
      title: 'Configurações e Preferências',
      account: 'Perfil da Conta',
      planBilling: 'Plano e Cobrança',
      preferencesTab: 'Preferências',
      securityTab: 'Segurança e 2FA',
      storageTab: 'Armazenamento e Privacidade',
      sessionsTab: 'Sessões Ativas',
      appLanguage: 'Idioma do Aplicativo',
      appLanguageDesc: 'Selecione o idioma da interface para todo o aplicativo',
      twoStepVerification: 'Verificação em Duas Etapas',
      twoStepVerificationDesc: 'Proteja logins com aplicativos TOTP (Google Authenticator, Authy)',
      autoRestoreSession: 'Restaurar Sessão Automaticamente',
      autoRestoreSessionDesc: 'Restaure rascunhos de trabalho e espaço ativo ao reabrir',
      autoDelete: 'Exclusão Automática de Arquivos',
      autoDeleteDesc: 'Limpar automaticamente arquivos gerados do cache local após 24h',
      soundEffects: 'Efeitos Sonoros',
      textScaling: 'Escala e Tamanho da Fonte',
      exportData: 'Exportar Dados do Usuário',
      exportDataDesc: 'Baixe perfil, histórico e configurações em JSON',
      activeSessions: 'Dispositivos e Sessões Ativas',
      revokeSessions: 'Revogar Todas as Sessões',
      dangerZone: 'Zona de Perigo'
    },

    landing: {
      badge: 'Suite Profissional de PDF em Nuvem',
      heroTitle: 'Ferramentas PDF Completas para Fluxos Ágeis e Seguros',
      heroSubtitle: 'Mescle, divida, comprima, converta, faça OCR e proteja documentos com segurança de padrão bancário.',
      startFree: 'Começar Teste Grátis',
      exploreTools: 'Explorar Ferramentas',
      popularTools: 'Ferramentas Populares',
      securityBadge: 'Segurança Padrão Bancário',
      securityTitle: 'Privado, Criptografado e Confiável',
      securityDesc: 'Todo o processamento ocorre na memória local do navegador ou em canais isolados.',
      pricingTitle: 'Preços Simples e Transparentes',
      pricingSubtitle: 'Escolha o plano ideal para suas tarefas diárias.',
      faqTitle: 'Perguntas Frequentes'
    },

    twoFactor: {
      title: 'Verificação em Duas Etapas',
      subtitle: 'Digite o código de 6 dígitos gerado pelo seu app autenticador.',
      enterCode: 'Código de Segurança de 6 Dígitos',
      useBackup: 'Usar Código de Recuperação',
      useTotp: 'Usar Código do Autenticador',
      verifying: 'Verificando código...',
      invalidCode: 'Código inválido. Verifique seu app autenticador.',
      validCode: 'Código verificado! Conectando...',
      enableSuccess: 'A verificação em duas etapas agora está ativa.',
      backupCodesTitle: 'Salvar Códigos de Recuperação',
      backupCodesDesc: 'Guarde estes códigos em segurança. Cada um pode ser usado uma vez.'
    }
  },

  'Russian': {
    dashboard: 'Панель управления',
    documents: 'Мои документы',
    myDocuments: 'Мои документы',
    recent: 'Недавние',
    settings: 'Настройки',
    preferences: 'Настройки',
    billing: 'Тарифы и оплата',
    support: 'Поддержка',
    search: 'Поиск инструментов...',
    searchTools: 'Поиск среди 30+ инструментов PDF...',
    upload: 'Загрузить файл',
    uploadFile: 'Загрузить PDF или документ',
    workspace: 'Рабочая область',
    admin: 'Панель администратора',
    downloadApp: 'Скачать Android APK',
    logout: 'Выйти',
    login: 'Вход',
    signup: 'Регистрация',
    allTools: 'Все инструменты',
    home: 'Главная',
    features: 'Возможности',
    pricing: 'Тарифы',

    greeting: {
      morning: 'Доброе утро',
      afternoon: 'Добрый день',
      evening: 'Добрый вечер'
    },

    actions: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      download: 'Скачать',
      preview: 'Просмотр',
      edit: 'Редактировать',
      convert: 'Конвертировать',
      compress: 'Сжать',
      merge: 'Объединить',
      split: 'Разделить',
      extract: 'Извлечь',
      rotate: 'Повернуть',
      protect: 'Защитить',
      unlock: 'Разблокировать',
      apply: 'Применить',
      process: 'Обработать файл',
      processing: 'Обработка...',
      done: 'Готово',
      close: 'Закрыть',
      back: 'Назад',
      next: 'Далее',
      tryAgain: 'Попробовать снова',
      viewAll: 'Смотреть все',
      getStarted: 'Начать бесплатно',
      upgradePlan: 'Улучшить тариф',
      downloadApk: 'Скачать APK'
    },

    categories: {
      create: 'Создание и дизайн',
      convert: 'Конвертация',
      edit: 'Редактирование и разметка',
      organize: 'Страницы и структура',
      optimize: 'Оптимизация и OCR',
      security: 'Безопасность и подпись',
      ai: 'ИИ и аналитика'
    },

    tools: {
      compress: 'Сжать PDF',
      merge: 'Объединить PDF',
      convert: 'Конвертировать PDF',
      split: 'Разделить PDF',
      pdfToWord: 'PDF в Word',
      wordToPdf: 'Word в PDF',
      excelToPdf: 'Excel в PDF',
      powerpointToPdf: 'PowerPoint в PDF',
      imageToPdf: 'Изображение в PDF',
      pdfToImage: 'PDF в изображение',
      ocr: 'OCR и извлечение текста',
      translate: 'Перевод документа',
      protect: 'Защита паролем',
      unlock: 'Снять пароль с PDF',
      cameraScanner: 'Сканер с камеры',
      editPdf: 'Редактировать текст PDF',
      organizePdf: 'Организация страниц',
      digitalSign: 'Электронная подпись',
      summarizePdf: 'Краткое содержание ИИ',
      askAi: 'Задать вопрос документу',
      watermark: 'Добавить водяной знак',
      flatten: 'Объединить слои PDF',
      createPdf: 'Создать PDF',
      resumeBuilder: 'Конструктор резюме'
    },

    profile: {
      title: 'Параметры и настройки',
      account: 'Профиль аккаунта',
      planBilling: 'Тариф и оплата',
      preferencesTab: 'Настройки',
      securityTab: 'Безопасность и 2FA',
      storageTab: 'Хранилище и приватность',
      sessionsTab: 'Активные сессии',
      appLanguage: 'Язык приложения',
      appLanguageDesc: 'Выберите предпочтительный язык для всего приложения',
      twoStepVerification: 'Двухэтапная проверка (2FA)',
      twoStepVerificationDesc: 'Защитите вход кодами TOTP (Google Authenticator, Authy)',
      autoRestoreSession: 'Автовосстановление сессии',
      autoRestoreSessionDesc: 'Автоматически восстанавливать открытые черновики при входе',
      autoDelete: 'Автоудаление обработанных файлов',
      autoDeleteDesc: 'Очищать временные файлы из кэша через 24 часа',
      soundEffects: 'Звуковые эффекты',
      textScaling: 'Масштабирование шрифта',
      exportData: 'Экспорт данных',
      exportDataDesc: 'Скачать профиль, историю и настройки в JSON',
      activeSessions: 'Активные устройства и сессии',
      revokeSessions: 'Завершить все сессии',
      dangerZone: 'Опасная зона'
    },

    landing: {
      badge: 'Профессиональный облачный PDF-комплекс',
      heroTitle: 'Все PDF-инструменты в одном месте для быстрой работы',
      heroSubtitle: 'Объединяйте, разделяйте, сжимайте, конвертируйте, распознавайте текст и защищайте файлы с максимальной конфиденциальностью.',
      startFree: 'Попробовать бесплатно',
      exploreTools: 'Все инструменты',
      popularTools: 'Популярные инструменты',
      securityBadge: 'Банковский уровень защиты',
      securityTitle: 'Приватно, зашифровано и надежно',
      securityDesc: 'Вся обработка происходит локально в браузере или по защищенным каналам.',
      pricingTitle: 'Прозрачные тарифные планы',
      pricingSubtitle: 'Выберите тариф, подходящий для ваших задач.',
      faqTitle: 'Часто задаваемые вопросы'
    },

    twoFactor: {
      title: 'Двухэтапная проверка',
      subtitle: 'Введите 6-значный код из приложения аутентификации для входа.',
      enterCode: '6-значный код безопасности',
      useBackup: 'Использовать резервный код',
      useTotp: 'Использовать код аутентификатора',
      verifying: 'Проверка кода...',
      invalidCode: 'Неверный код. Пожалуйста, проверьте приложение.',
      validCode: 'Код подтвержден! Выполняется вход...',
      enableSuccess: 'Двухэтапная проверка успешно включена.',
      backupCodesTitle: 'Сохраните резервные коды',
      backupCodesDesc: 'Сохраните эти коды. Каждый можно использовать один раз при утере телефона.'
    }
  },

  'Italian': {
    dashboard: 'Cruscotto',
    documents: 'I Miei Documenti',
    myDocuments: 'I Miei Documenti',
    recent: 'Recenti',
    settings: 'Impostazioni',
    preferences: 'Impostazioni',
    billing: 'Fatturazione',
    support: 'Supporto',
    search: 'Cerca strumenti...',
    searchTools: 'Cerca tra oltre 30 strumenti PDF...',
    upload: 'Carica File',
    uploadFile: 'Carica PDF o Documento',
    workspace: 'Area di Lavoro',
    admin: 'Pannello Amministratore',
    downloadApp: 'Scarica APK Android',
    logout: 'Disconnetti',
    login: 'Accedi',
    signup: 'Registrati',
    allTools: 'Tutti gli Strumenti',
    home: 'Home',
    features: 'Funzionalità',
    pricing: 'Piani e Prezzi',

    greeting: {
      morning: 'Buongiorno',
      afternoon: 'Buon pomeriggio',
      evening: 'Buonasera'
    },

    actions: {
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      download: 'Scarica',
      preview: 'Anteprima',
      edit: 'Modifica',
      convert: 'Converti',
      compress: 'Comprimi',
      merge: 'Unisci',
      split: 'Dividi',
      extract: 'Estrai',
      rotate: 'Ruota',
      protect: 'Proteggi',
      unlock: 'Sblocca',
      apply: 'Applica',
      process: 'Elabora File',
      processing: 'Elaborazione...',
      done: 'Fatto',
      close: 'Chiudi',
      back: 'Indietro',
      next: 'Avanti',
      tryAgain: 'Riprova',
      viewAll: 'Mostra Tutto',
      getStarted: 'Inizia Gratis',
      upgradePlan: 'Aggiorna Piano',
      downloadApk: 'Scarica APK'
    },

    categories: {
      create: 'Crea e Progetta',
      convert: 'Converti e Trasforma',
      edit: 'Modifica e Annota',
      organize: 'Organizza e Pagine',
      optimize: 'Ottimizza e OCR',
      security: 'Sicurezza e Firma',
      ai: 'IA e Intelligenza'
    },

    tools: {
      compress: 'Comprimi PDF',
      merge: 'Unisci PDF',
      convert: 'Converti PDF',
      split: 'Dividi PDF',
      pdfToWord: 'PDF in Word',
      wordToPdf: 'Word in PDF',
      excelToPdf: 'Excel in PDF',
      powerpointToPdf: 'PowerPoint in PDF',
      imageToPdf: 'Immagine in PDF',
      pdfToImage: 'PDF in Immagine',
      ocr: 'OCR ed Estrazione Testo',
      translate: 'Traduci Documento',
      protect: 'Proteggi con Password',
      unlock: 'Sblocca PDF',
      cameraScanner: 'Scanner Fotocamera',
      editPdf: 'Modifica Testo PDF',
      organizePdf: 'Organizza Pagine',
      digitalSign: 'Firme Digitali',
      summarizePdf: 'Riassumi Documento',
      askAi: 'Fai Domande all’IA',
      watermark: 'Aggiungi Filigrana',
      flatten: 'Appiattisci PDF',
      createPdf: 'Crea PDF',
      resumeBuilder: 'Crea Curriculum'
    },

    profile: {
      title: 'Impostazioni e Preferenze',
      account: 'Profilo Account',
      planBilling: 'Piano e Fatturazione',
      preferencesTab: 'Preferenze',
      securityTab: 'Sicurezza e 2FA',
      storageTab: 'Archiviazione e Privacy',
      sessionsTab: 'Sessioni Attive',
      appLanguage: 'Lingua dell’App',
      appLanguageDesc: 'Seleziona la lingua da applicare a tutta l’applicazione',
      twoStepVerification: 'Verifica in Due Passaggi',
      twoStepVerificationDesc: 'Proteggi il tuo account con app TOTP (Google Authenticator, Authy)',
      autoRestoreSession: 'Ripristino Automatico Sessione',
      autoRestoreSessionDesc: 'Ripristina automaticamente i documenti e l’area di lavoro aperta',
      autoDelete: 'Eliminazione Automatica File',
      autoDeleteDesc: 'Elimina automaticamente i file elaborati dalla cache locale dopo 24 ore',
      soundEffects: 'Effetti Sonori',
      textScaling: 'Dimensione Testo e Carattere',
      exportData: 'Esporta Dati Utente',
      exportDataDesc: 'Scarica profilo, cronologia e impostazioni in formato JSON',
      activeSessions: 'Dispositivi e Sessioni Attive',
      revokeSessions: 'Disconnetti Tutte le Sessioni',
      dangerZone: 'Zona di Pericolo'
    },

    landing: {
      badge: 'Suite PDF Cloud Professionale',
      heroTitle: 'Strumenti PDF All-in-One per Flussi di Lavoro Rapidi e Sicuri',
      heroSubtitle: 'Unisci, dividi, comprimi, converti, applica OCR e proteggi documenti con privacy di livello bancario.',
      startFree: 'Inizia Prova Gratuita',
      exploreTools: 'Esplora Strumenti',
      popularTools: 'Strumenti Più Usati',
      securityBadge: 'Sicurezza di Livello Bancario',
      securityTitle: 'Privato, Crittografato e Affidabile',
      securityDesc: 'Tutta l’elaborazione avviene localmente nella memoria del browser o su canali protetti.',
      pricingTitle: 'Prezzi Semplici e Trasparenti',
      pricingSubtitle: 'Scegli il piano ideale per la tua produttività.',
      faqTitle: 'Domande Frequenti'
    },

    twoFactor: {
      title: 'Verifica in Due Passaggi',
      subtitle: 'Inserisci il codice a 6 cifre dalla tua app di autenticazione.',
      enterCode: 'Codice di Sicurezza a 6 Cifre',
      useBackup: 'Usa Codice di Recupero',
      useTotp: 'Usa Codice Authenticator',
      verifying: 'Verifica codice...',
      invalidCode: 'Codice non valido. Controlla l’app autenticatore.',
      validCode: 'Codice verificato! Accesso in corso...',
      enableSuccess: 'La verifica in due passaggi è ora attiva.',
      backupCodesTitle: 'Salva Codici di Recupero',
      backupCodesDesc: 'Conserva questi codici. Ognuno può essere usato una volta.'
    }
  },

  'Arabic': {
    dashboard: 'لوحة التحكم',
    documents: 'مستنداتي',
    myDocuments: 'مستنداتي',
    recent: 'الأخيرة',
    settings: 'الإعدادات والتفضيلات',
    preferences: 'التفضيلات',
    billing: 'الاشتراكات والفواتير',
    support: 'الدعم والمساعدة',
    search: 'البحث عن الأدوات...',
    searchTools: 'البحث في أكثر من 30 أداة PDF...',
    upload: 'رفع ملف',
    uploadFile: 'رفع ملف PDF أو مستند',
    workspace: 'مساحة العمل',
    admin: 'لوحة الإدارة',
    downloadApp: 'تحميل تطبيق Android APK',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    allTools: 'جميع الأدوات',
    home: 'الرئيسية',
    features: 'المميزات',
    pricing: 'الأسعار والخطط',

    greeting: {
      morning: 'صباح الخير',
      afternoon: 'مساء الخير',
      evening: 'مساء الخير'
    },

    actions: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      download: 'تحميل',
      preview: 'معاينة',
      edit: 'تعديل',
      convert: 'تحويل',
      compress: 'ضغط',
      merge: 'دمج',
      split: 'تقسيم',
      extract: 'استخراج',
      rotate: 'تدوير',
      protect: 'حماية',
      unlock: 'إلغاء القفل',
      apply: 'تطبيق',
      process: 'معالجة الملف',
      processing: 'جار المعالجة...',
      done: 'تم',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      tryAgain: 'إعادة المحاولة',
      viewAll: 'عرض الكل',
      getStarted: 'ابدأ مجاناً',
      upgradePlan: 'ترقية الخطة',
      downloadApk: 'تحميل APK'
    },

    categories: {
      create: 'إنشاء وتصميم',
      convert: 'تحويل وتغيير الصيغ',
      edit: 'تعديل وتعليقات',
      organize: 'تنظيم الصفحات',
      optimize: 'تحسين و OCR',
      security: 'أمان وتوقيع',
      ai: 'ذكاء اصطناعي'
    },

    tools: {
      compress: 'ضغط PDF',
      merge: 'دمج PDF',
      convert: 'تحويل PDF',
      split: 'تقسيم PDF',
      pdfToWord: 'تحويل PDF إلى Word',
      wordToPdf: 'تحويل Word إلى PDF',
      excelToPdf: 'تحويل Excel إلى PDF',
      powerpointToPdf: 'تحويل PowerPoint إلى PDF',
      imageToPdf: 'تحويل الصور إلى PDF',
      pdfToImage: 'تحويل PDF إلى صور',
      ocr: 'التعرف الضوئي واستخراج النص',
      translate: 'ترجمة المستند',
      protect: 'حماية بكلمة مرور',
      unlock: 'إلغاء قفل PDF',
      cameraScanner: 'ماسح الكاميرا',
      editPdf: 'تعديل نص PDF',
      organizePdf: 'تنظيم الصفحات',
      digitalSign: 'التوقيعات الرقمية',
      summarizePdf: 'تلخيص المستند بالذكاء الاصطناعي',
      askAi: 'سؤال الذكاء الاصطناعي',
      watermark: 'إضافة علامة مائية',
      flatten: 'تسطيح طبقات PDF',
      createPdf: 'إنشاء PDF جديد',
      resumeBuilder: 'صانع السيرة الذاتية'
    },

    profile: {
      title: 'الإعدادات والتفضيلات',
      account: 'الملف الشخصي',
      planBilling: 'الخطة والفواتير',
      preferencesTab: 'التفضيلات',
      securityTab: 'الأمان والتحقق المزدوج',
      storageTab: 'التخزين والخصوصية',
      sessionsTab: 'الجلسات النشطة',
      appLanguage: 'لغة التطبيق',
      appLanguageDesc: 'اختر لغة واجهة المستخدم لكافة أجزاء التطبيق',
      twoStepVerification: 'التحقق بخطوتين (2FA)',
      twoStepVerificationDesc: 'احمِ تسجيل دخولك بتطبيقات التوثيق (Google Authenticator, Authy)',
      autoRestoreSession: 'استعادة الجلسة تلقائياً',
      autoRestoreSessionDesc: 'استرجاع مسودة العمل ومساحة العمل المفتوحة عند إعادة الفتح',
      autoDelete: 'حذف الملفات المعالجة تلقائياً',
      autoDeleteDesc: 'مسح الملفات المؤقتة من الذاكرة المحلية بعد 24 ساعة',
      soundEffects: 'المؤثرات الصوتية',
      textScaling: 'حجم الخط والتكبير',
      exportData: 'تصدير بيانات المستخدم',
      exportDataDesc: 'تحميل ملفك الشخصي وسجل العمليات بتنسيق JSON',
      activeSessions: 'الأجهزة والجلسات النشطة',
      revokeSessions: 'إنهاء جميع الجلسات',
      dangerZone: 'منطقة الحظر والخطر'
    },

    landing: {
      badge: 'مجموعة أدوات PDF السحابية الاحترافية',
      heroTitle: 'جميع أدوات PDF في مكان واحد لإنجاز سريع وآمن',
      heroSubtitle: 'دمج، تقسيم، ضغط، تحويل، وتعرف على النصوص وترجمة وحماية المستندات بخصوصية وأمان بنكي.',
      startFree: 'ابدأ التجربة المجانية',
      exploreTools: 'استكشاف جميع الأدوات',
      popularTools: 'الأدوات الشائعة',
      securityBadge: 'أمان بمستوى مصرفي',
      securityTitle: 'خاص، مشفر وموثوق بالكامل',
      securityDesc: 'تتم كافة المعالجات بأمان داخل ذاكرة المتصفح أو عبر قنوات مشفرة.',
      pricingTitle: 'أسعار بسيطة وشفافة',
      pricingSubtitle: 'اختر الخطة المناسبة لاحتياجاتك وإنتاجيتك.',
      faqTitle: 'الأسئلة الشائعة'
    },

    twoFactor: {
      title: 'التحقق بخطوتين',
      subtitle: 'أدخل الرمز المكون من 6 أرقام من تطبيق التوثيق الخاص بك لتسجيل الدخول.',
      enterCode: 'رمز الأمان (6 أرقام)',
      useBackup: 'استخدام رمز الاسترداد الاحتياطي',
      useTotp: 'استخدام رمز تطبيق التوثيق',
      verifying: 'جار التحقق من الرمز...',
      invalidCode: 'الرمز غير صحيح. يرجى التحقق من التطبيق.',
      validCode: 'تم التحقق بنجاح! جار تسجيل الدخول...',
      enableSuccess: 'تم تفعيل التحقق بخطوتين بنجاح لحسابك.',
      backupCodesTitle: 'حفظ رموز الاسترداد الاحتياطية',
      backupCodesDesc: 'احتفظ بهذه الرموز بأمان. يمكن استخدام كل رمز لمرة واحدة عند فقدان الهاتف.'
    }
  },

  'Bengali': {
    dashboard: 'ড্যাশবোর্ড',
    documents: 'আমার নথি',
    myDocuments: 'আমার নথি',
    recent: 'সাম্প্রতিক নথি',
    settings: 'পছন্দ ও সেটিংস',
    preferences: 'পছন্দসমূহ',
    billing: 'বিলিং ও প্ল্যান',
    support: 'সহায়তা ও সাপোর্ট',
    search: 'টুলস খুঁজুন...',
    searchTools: '৩০+ PDF টুলস অনুসন্ধান করুন...',
    upload: 'ফাইল আপলোড',
    uploadFile: 'PDF বা নথি আপলোড করুন',
    workspace: 'ওয়ার্কস্পেস',
    admin: 'অ্যাডমিন কনসোল',
    downloadApp: 'Android APK ডাউনলোড করুন',
    logout: 'লগ আউট',
    login: 'লগ ইন করুন',
    signup: 'অ্যাকাউন্ট তৈরি করুন',
    allTools: 'সকল টুলস',
    home: 'হোম',
    features: 'বৈশিষ্ট্যসমূহ',
    pricing: 'মূল্য নির্ধারণ',

    greeting: {
      morning: 'সুপ্রভাত',
      afternoon: 'শুভ অপরাহ্ন',
      evening: 'শুভ সন্ধ্যা'
    },

    actions: {
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল',
      delete: 'মুছে ফেলুন',
      download: 'ডাউনলোড',
      preview: 'প্রিভিউ',
      edit: 'সম্পাদনা',
      convert: 'রূপান্তর',
      compress: 'কম্প্রেস',
      merge: 'একত্রিত',
      split: 'বিভক্ত',
      extract: 'নিষ্কাশন',
      rotate: 'ঘোরান',
      protect: 'সুরক্ষিত করুন',
      unlock: 'আনলক করুন',
      apply: 'প্রয়োগ করুন',
      process: 'ফাইল প্রক্রিয়া করুন',
      processing: 'প্রক্রিয়াধীন...',
      done: 'সম্পন্ন',
      close: 'বন্ধ করুন',
      back: 'পেছনে',
      next: 'পরবর্তী',
      tryAgain: 'আবার চেষ্টা করুন',
      viewAll: 'সব দেখুন',
      getStarted: 'বিনামূল্যে শুরু করুন',
      upgradePlan: 'প্ল্যান আপগ্রেড করুন',
      downloadApk: 'APK ডাউনলোড করুন'
    },

    categories: {
      create: 'তৈরি ও ডিজাইন',
      convert: 'রূপান্তর ও পরিবর্তন',
      edit: 'সম্পাদনা ও মার্কআপ',
      organize: 'পৃষ্ঠা সাজানো',
      optimize: 'অপ্টিমাইজ ও OCR',
      security: 'নিরাপত্তা ও স্বাক্ষর',
      ai: 'কৃত্রিম বুদ্ধিমত্তা (AI)'
    },

    tools: {
      compress: 'PDF কম্প্রেস করুন',
      merge: 'PDF একত্রিত করুন',
      convert: 'PDF রূপান্তর করুন',
      split: 'PDF বিভক্ত করুন',
      pdfToWord: 'PDF থেকে Word',
      wordToPdf: 'Word থেকে PDF',
      excelToPdf: 'Excel থেকে PDF',
      powerpointToPdf: 'PowerPoint থেকে PDF',
      imageToPdf: 'ছবি থেকে PDF',
      pdfToImage: 'PDF থেকে ছবি',
      ocr: 'OCR ও টেক্সট নিষ্কাশন',
      translate: 'নথি অনুবাদ করুন',
      protect: 'পাসওয়ার্ড দিয়ে সুরক্ষিত করুন',
      unlock: 'PDF আনলক করুন',
      cameraScanner: 'ক্যামেরা স্ক্যানার',
      editPdf: 'PDF টেক্সট সম্পাদনা',
      organizePdf: 'পৃষ্ঠা সাজান',
      digitalSign: 'ডিজিটাল স্বাক্ষর',
      summarizePdf: 'নথির সারাংশ তৈরি করুন',
      askAi: 'AI-কে প্রশ্ন করুন',
      watermark: 'জলছাপ যুক্ত করুন',
      flatten: 'PDF ফ্ল্যাটেন করুন',
      createPdf: 'নতুন PDF তৈরি করুন',
      resumeBuilder: 'জীবনবৃত্তান্ত / CV তৈরি'
    },

    profile: {
      title: 'সেটিংস ও পছন্দসমূহ',
      account: 'অ্যাকাউন্ট প্রোফাইল',
      planBilling: 'প্ল্যান ও বিলিং',
      preferencesTab: 'পছন্দসমূহ',
      securityTab: 'নিরাপত্তা ও 2FA',
      storageTab: 'স্টোরেজ ও গোপনীয়তা',
      sessionsTab: 'সক্রিয় সেশন',
      appLanguage: 'অ্যাপের ভাষা',
      appLanguageDesc: 'সম্পূর্ণ অ্যাপের জন্য পছন্দের ভাষা নির্বাচন করুন',
      twoStepVerification: 'দ্বি-পদক্ষেপ যাচাইকরণ (2FA)',
      twoStepVerificationDesc: 'TOTP প্রমাণীকরণকারী অ্যাপ দিয়ে অ্যাকাউন্ট সুরক্ষিত করুন',
      autoRestoreSession: 'স্বয়ংক্রিয় সেশন পুনরুদ্ধার',
      autoRestoreSessionDesc: 'অ্যাপ খোলার সময় খসড়া ও খোলা ফাইল স্বয়ংক্রিয়ভাবে পুনরুদ্ধার করুন',
      autoDelete: 'ফাইল স্বয়ংক্রিয় মুছে ফেলা',
      autoDeleteDesc: '২৪ ঘণ্টা পর স্থানীয় ক্যাশ থেকে ফাইল পরিষ্কার করুন',
      soundEffects: 'সাউন্ড ইফেক্ট',
      textScaling: 'ফন্ট সাইজ স্কেলিং',
      exportData: 'ব্যবহারকারীর ডেটা রপ্তানি',
      exportDataDesc: 'প্রোফাইল, ইতিহাস ও সেটিংস JSON হিসাবে ডাউনলোড করুন',
      activeSessions: 'সক্রিয় ডিভাইস ও সেশন',
      revokeSessions: 'সব সেশন বন্ধ করুন',
      dangerZone: 'বিপজ্জনক এলাকা'
    },

    landing: {
      badge: 'পেশাদার ক্লাউড PDF স্যুট',
      heroTitle: 'দ্রুত ও নিরাপদ কাজের জন্য অল-ইন-ওয়ান PDF টুলস',
      heroSubtitle: 'ব্যাংক-গ্রেড নিরাপত্তার সাথে PDF একত্রিত, বিভক্ত, কম্প্রেস, রূপান্তর ও সুরক্ষিত করুন।',
      startFree: 'বিনামূল্যে শুরু করুন',
      exploreTools: 'সব টুলস দেখুন',
      popularTools: 'জনপ্রিয় PDF টুলস',
      securityBadge: 'ব্যাংক স্তরের নিরাপত্তা',
      securityTitle: 'ব্যক্তিগত, এনক্রিপ্ট করা ও নির্ভরযোগ্য',
      securityDesc: 'সমস্ত প্রসেসিং ব্রাউজার মেমোরিতে নিরাপদভাবে সম্পন্ন হয়।',
      pricingTitle: 'সহজ ও স্পষ্ট মূল্য তালিকা',
      pricingSubtitle: 'আপনার প্রয়োজনীয়তা অনুযায়ী সঠিক প্ল্যান বেছে নিন।',
      faqTitle: 'সাধারণ প্রশ্নাবলী'
    },

    twoFactor: {
      title: 'দ্বি-পদক্ষেপ যাচাইকরণ',
      subtitle: 'লগ ইন করতে আপনার প্রমাণীকরণকারী অ্যাপ থেকে ৬-সংখ্যার কোড লিখুন।',
      enterCode: '৬-সংখ্যার নিরাপত্তা কোড',
      useBackup: 'ব্যাকআপ রিকভারি কোড ব্যবহার করুন',
      useTotp: 'প্রমাণীকরণ কোড ব্যবহার করুন',
      verifying: 'কোড যাচাই করা হচ্ছে...',
      invalidCode: 'অবৈধ কোড। অনুগ্রহ করে অ্যাপটি চেক করুন।',
      validCode: 'কোড যাচাই হয়েছে! লগ ইন হচ্ছে...',
      enableSuccess: 'আপনার অ্যাকাউন্টে দ্বি-পদক্ষেপ যাচাইকরণ সক্রিয় হয়েছে।',
      backupCodesTitle: 'ব্যাকআপ রিকভারি কোড সংরক্ষণ করুন',
      backupCodesDesc: 'এই কোডগুলো নিরাপদে রাখুন। ফোন হারালে প্রতিটি কোড একবার ব্যবহার করা যাবে।'
    }
  }
};

/**
 * Normalizes language name to a supported key
 */
export const normalizeLanguage = (lang?: string): string => {
  if (!lang) return 'English';
  const clean = lang.trim().toLowerCase();
  
  if (clean.includes('span') || clean.includes('espa')) return 'Spanish';
  if (clean.includes('fren') || clean.includes('fran')) return 'French';
  if (clean.includes('germ') || clean.includes('deut')) return 'German';
  if (clean.includes('hind')) return 'Hindi';
  if (clean.includes('japan') || clean.includes('nihon')) return 'Japanese';
  if (clean.includes('chin') || clean.includes('zhong')) return 'Chinese';
  if (clean.includes('port')) return 'Portuguese';
  if (clean.includes('russ')) return 'Russian';
  if (clean.includes('ital')) return 'Italian';
  if (clean.includes('arab')) return 'Arabic';
  if (clean.includes('beng') || clean.includes('bang')) return 'Bengali';
  if (clean.includes('kore') || clean.includes('hang')) return 'Korean';
  
  return 'English';
};

/**
 * Get translation for given key path
 */
export const getTranslation = (lang: string | undefined, keyPath: string, fallback?: string): string => {
  const normalized = normalizeLanguage(lang);
  const dict = TRANSLATIONS[normalized] || TRANSLATIONS['English'];
  const englishDict = TRANSLATIONS['English'];

  const getFromDict = (d: any, path: string): string | undefined => {
    const parts = path.split('.');
    let cur = d;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return typeof cur === 'string' ? cur : undefined;
  };

  const val = getFromDict(dict, keyPath);
  if (val) return val;

  const engVal = getFromDict(englishDict, keyPath);
  if (engVal) return engVal;

  return fallback || keyPath.split('.').pop() || keyPath;
};

/**
 * Translates a tool object dynamically according to the selected language
 */
export function translateTool<T extends { id: string; name: string; description: string }>(tool: T, lang?: string): T {
  const normalized = normalizeLanguage(lang);
  const dict = TRANSLATIONS[normalized] || TRANSLATIONS['English'];

  const toolNameMap: Record<string, string> = {
    'compress-pdf': dict.tools?.compress,
    'merge-pdf': dict.tools?.merge,
    'split-pdf': dict.tools?.split,
    'pdf-to-word': dict.tools?.pdfToWord,
    'word-to-pdf': dict.tools?.wordToPdf,
    'excel-to-pdf': dict.tools?.excelToPdf,
    'powerpoint-to-pdf': dict.tools?.powerpointToPdf,
    'image-to-pdf': dict.tools?.imageToPdf,
    'pdf-to-image': dict.tools?.pdfToImage,
    'ocr-pdf': dict.tools?.ocr,
    'translate-document': dict.tools?.translate,
    'protect-pdf': dict.tools?.protect,
    'remove-password': dict.tools?.unlock,
    'camera-scanner': dict.tools?.cameraScanner,
    'edit-pdf-text': dict.tools?.editPdf,
    'pdf-organizer': dict.tools?.organizePdf,
    'digital-signatures': dict.tools?.digitalSign,
    'summarize-pdf': dict.tools?.summarizePdf,
    'ask-questions': dict.tools?.askAi,
    'create-pdf': dict.tools?.createPdf,
    'resume-builder': dict.tools?.resumeBuilder,
    'flatten-pdf': dict.tools?.flatten,
  };

  const localizedName = toolNameMap[tool.id] || tool.name;

  return {
    ...tool,
    name: localizedName,
  };
}

/**
 * Reactive React hook that listens to language changes and provides dynamic translation function
 */
export function useAppTranslation(userLang?: string) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return userLang || (typeof window !== 'undefined' ? localStorage.getItem('pref_language') || 'English' : 'English');
  });

  useEffect(() => {
    if (userLang) {
      setCurrentLanguage(userLang);
    }
  }, [userLang]);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e.detail || localStorage.getItem('pref_language') || 'English';
      setCurrentLanguage(newLang);
    };

    window.addEventListener('paperx_language_changed', handleLangChange);
    window.addEventListener('storage', handleLangChange);

    return () => {
      window.removeEventListener('paperx_language_changed', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, []);

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const changeLanguage = (newLang: string) => {
    setCurrentLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pref_language', newLang);
      window.dispatchEvent(new CustomEvent('paperx_language_changed', { detail: newLang }));
    }
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    translateTool: (tool: any) => translateTool(tool, currentLanguage)
  };
}
