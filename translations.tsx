import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

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
    userTrust?: string;
    popularAutomated?: string;
    featuresTitle?: string;
    featuresSubtitle?: string;
    feat1Title?: string;
    feat1Desc?: string;
    feat2Title?: string;
    feat2Desc?: string;
    feat3Title?: string;
    feat3Desc?: string;
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
  features?: Record<string, { name: string; desc: string }>;
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
    downloadApp: 'Download App',
    logout: 'Log Out',
    login: 'Sign In',
    signup: 'Create Account',
    allTools: 'All Tools',
    home: 'Home',
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
      faqTitle: 'Frequently Asked Questions',
      userTrust: 'Loved by 10k+ users every week',
      popularAutomated: 'Popular Automated Tools',
      featuresTitle: 'Everything you need',
      featuresSubtitle: 'Powerful tools designed for modern document workflows.',
      feat1Title: 'Automated Tools',
      feat1Desc: 'Summarize and rewrite documents instantly with our automated system.',
      feat2Title: 'Secure by Default',
      feat2Desc: 'Enterprise-grade encryption for all your sensitive files.',
      feat3Title: 'Lightning Fast',
      feat3Desc: 'Convert and compress large files in seconds, not minutes.'
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
    },
    features: {
      annotations: { name: 'Annotations', desc: 'Highlight, underline, and add digital sticky notes.' },
      autoCrop: { name: 'Auto-Crop', desc: 'Smart edge detection that snaps to document borders during scanning.' },
      archive: { name: 'Archive', desc: 'Compress files into ZIP formats for easier storage.' },
      batch: { name: 'Batch Processing', desc: 'Convert or scan multiple documents simultaneously.' },
      biometric: { name: 'Biometric Lock', desc: 'Secure files using Fingerprint or Face ID.' },
      cloud: { name: 'Cloud Sync', desc: 'Automatic backup to Google Drive or Dropbox.' },
      comments: { name: 'Comments', desc: 'Tag collaborators and hold discussions within the document.' },
      darkMode: { name: 'Dark Mode', desc: 'A low-light interface to reduce eye strain.' },
      dictation: { name: 'Dictation', desc: 'Convert your spoken voice into written text (Voice-to-Text).' },
      digitalSignature: { name: 'Digital Signature', desc: 'Draw or upload your signature to legalise forms.' },
      encryption: { name: 'Encryption', desc: 'Password-protect files with high-level security.' },
      export: { name: 'Export', desc: 'Save files in various formats (PDF, DOCX, JPG, TXT).' },
      fileCompression: { name: 'File Compression', desc: 'Reduce file size without losing visual quality.' },
      fontCustomization: { name: 'Font Customization', desc: 'Access to hundreds of professional typefaces.' },
      grammarCheck: { name: 'Grammar Check', desc: 'Real-time AI correction for spelling and syntax.' },
      grayscale: { name: 'Grayscale Filter', desc: 'Convert colour scans to black and white for clarity.' },
      headersFooters: { name: 'Headers & Footers', desc: 'Add page numbers, dates, or titles to every page.' },
      hyperlinks: { name: 'Hyperlinks', desc: 'Insert clickable web links or internal document bookmarks.' },
      idCard: { name: 'ID Card Mode', desc: 'Scan both sides of an ID and place them on a single page.' },
      imageEnhancement: { name: 'Image Enhancement', desc: 'AI-powered cleanup of blurry or faded scans.' },
      imageToText: { name: 'Image-to-Text', desc: 'Extract editable text from any photo.' },
      layoutTemplates: { name: 'Layout Templates', desc: 'Pre-designed formats for resumes, invoices, and letters.' },
      lineSpacing: { name: 'Line Spacing', desc: 'Adjust the vertical gap between sentences.' },
      mergeFiles: { name: 'Merge Files', desc: 'Combine several PDFs or images into one document.' },
      multiLanguage: { name: 'Multi-language Support', desc: 'Interface and OCR support for dozens of languages.' },
      nightMode: { name: 'Night Mode Scanning', desc: 'Uses the flash to capture clear docs in the dark.' },
      ocr: { name: 'OCR', desc: 'Technology that makes scanned text searchable.' },
      offlineAccess: { name: 'Offline Access', desc: 'Edit and view files without an internet connection.' },
      pageReordering: { name: 'Page Reordering', desc: 'Drag and drop pages to change their sequence.' },
      pdfSplitting: { name: 'PDF Splitting', desc: 'Cut a large PDF into multiple smaller files.' },
      qrScanner: { name: 'QR Code Scanner', desc: 'Built-in tool to read links and barcodes.' },
      readMode: { name: 'Read Mode', desc: 'A distraction-free view for reading eBooks or long reports.' },
      redaction: { name: 'Redaction', desc: 'Permanently black out sensitive or private information.' },
      smartSummaries: { name: 'Smart Summaries', desc: 'AI-generated bullet points of long documents.' },
      suggestionMode: { name: 'Suggestion Mode', desc: 'Track changes without permanently editing the text.' },
      tableExtraction: { name: 'Table Extraction', desc: 'Scan a printed table and turn it into an Excel sheet.' },
      translation: { name: 'Translation', desc: 'Instantly translate document content into another language.' },
      versionHistory: { name: 'Version History', desc: 'See and restore every edit made to a file.' },
      watermarking: { name: 'Watermarking', desc: 'Overlay "Draft" or "Confidential" stamps on pages.' },
      webToPdf: { name: 'Web-to-PDF', desc: 'Save a live website as a document for offline use.' },
      wirelessPrinting: { name: 'Wireless Printing', desc: 'Send documents directly to a Wi-Fi printer.' },
      zOrdering: { name: 'Z-Ordering', desc: 'Layer images and text boxes on top of each other.' }
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
    downloadApp: 'Descargar App APK',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    signup: 'Crear Cuenta',
    allTools: 'Todas las Herramientas',
    home: 'Inicio',
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
      faqTitle: 'Preguntas Frecuentes',
      userTrust: 'Amado por más de 10k usuarios cada semana',
      popularAutomated: 'Herramientas Automatizadas Populares',
      featuresTitle: 'Todo lo que necesitas',
      featuresSubtitle: 'Potentes herramientas diseñadas para flujos de trabajo de documentos modernos.',
      feat1Title: 'Herramientas Automatizadas',
      feat1Desc: 'Resuma y reescriba documentos al instante con nuestro sistema automatizado.',
      feat2Title: 'Seguro por Defecto',
      feat2Desc: 'Cifrado de nivel empresarial para todos sus archivos sensibles.',
      feat3Title: 'Velocidad Rayo',
      feat3Desc: 'Convierta y comprima archivos grandes en segundos, no minutos.'
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
    },
    features: {
      annotations: { name: 'Anotaciones', desc: 'Resalte, subraye y agregue notas adhesivas digitales.' },
      autoCrop: { name: 'Recorte automático', desc: 'Detección inteligente de bordes que se ajusta a los bordes del documento.' },
      archive: { name: 'Archivo', desc: 'Comprima archivos en formatos ZIP para un almacenamiento más sencillo.' },
      batch: { name: 'Procesamiento por lotes', desc: 'Convierta o escanee múltiples documentos simultáneamente.' },
      biometric: { name: 'Bloqueo biométrico', desc: 'Asegure archivos usando huella digital o Face ID.' },
      cloud: { name: 'Sincronización en la nube', desc: 'Copia de seguridad automática en Google Drive o Dropbox.' },
      comments: { name: 'Comentarios', desc: 'Etiquete a colaboradores y mantenga discusiones dentro del documento.' },
      darkMode: { name: 'Modo oscuro', desc: 'Una interfaz de poca luz para reducir la fatiga visual.' },
      dictation: { name: 'Dictado', desc: 'Convierta su voz hablada en texto escrito (Voz a texto).' },
      digitalSignature: { name: 'Firma digital', desc: 'Dibuje o cargue su firma para legalizar formularios.' },
      encryption: { name: 'Cifrado', desc: 'Proteja archivos con contraseña con seguridad de alto nivel.' },
      export: { name: 'Exportar', desc: 'Guarde archivos en varios formatos (PDF, DOCX, JPG, TXT).' },
      fileCompression: { name: 'Compresión de archivos', desc: 'Reduzca el tamaño del archivo sin perder calidad visual.' },
      fontCustomization: { name: 'Personalización de fuentes', desc: 'Acceso a cientos de tipografías profesionales.' },
      grammarCheck: { name: 'Corrección gramatical', desc: 'Corrección de IA en tiempo real para ortografía y sintaxis.' },
      grayscale: { name: 'Filtro de escala de grises', desc: 'Convierta escaneos a color a blanco y negro para mayor claridad.' },
      headersFooters: { name: 'Encabezados y pies de página', desc: 'Agregue números de página, fechas o títulos a cada página.' },
      hyperlinks: { name: 'Hipervínculos', desc: 'Inserte enlaces web seleccionables o marcadores internos.' },
      idCard: { name: 'Modo tarjeta de identificación', desc: 'Escanee ambos lados de una identificación en una sola página.' },
      imageEnhancement: { name: 'Mejora de imagen', desc: 'Limpieza impulsada por IA de escaneos borrosos.' },
      imageToText: { name: 'Imagen a texto', desc: 'Extraiga texto editable de cualquier foto.' },
      layoutTemplates: { name: 'Plantillas de diseño', desc: 'Formatos prediseñados para currículums, facturas y cartas.' },
      lineSpacing: { name: 'Espaciado de líneas', desc: 'Ajustे el espacio vertical entre oraciones.' },
      mergeFiles: { name: 'Combinar archivos', desc: 'Combine varios PDF o imágenes en un solo documento.' },
      multiLanguage: { name: 'Soporte multilingüe', desc: 'Interfaz y soporte OCR para docenas de idiomas.' },
      nightMode: { name: 'Escaneo en modo nocturno', desc: 'Usa el flash para capturar documentos en la oscuridad.' },
      ocr: { name: 'OCR', desc: 'Tecnología que permite buscar texto en documentos escaneados.' },
      offlineAccess: { name: 'Acceso sin conexión', desc: 'Edite y vea archivos sin conexión a Internet.' },
      pageReordering: { name: 'Reordenación de páginas', desc: 'Arrastre y suelte páginas para cambiar su secuencia.' },
      pdfSplitting: { name: 'División de PDF', desc: 'Divida un PDF grande en varios archivos más pequeños.' },
      qrScanner: { name: 'Escáner de código QR', desc: 'Herramienta integrada para leer enlaces y códigos de barras.' },
      readMode: { name: 'Modo de lectura', desc: 'Una vista sin distracciones para leer libros electrónicos o informes.' },
      redaction: { name: 'Redacción', desc: 'Oculte permanentemente información sensible o privada.' },
      smartSummaries: { name: 'Resúmenes inteligentes', desc: 'Puntos clave generados por IA de documentos largos.' },
      suggestionMode: { name: 'Modo de sugerencias', desc: 'Siga los cambios sin editar permanentemente el texto.' },
      tableExtraction: { name: 'Extracción de tablas', desc: 'Escanee una tabla impresa y conviértala en una hoja de Excel.' },
      translation: { name: 'Traducción', desc: 'Traduzca instantáneamente el contenido del documento a otro idioma.' },
      versionHistory: { name: 'Historial de versiones', desc: 'Vea y restaure cada edición realizada en un archivo.' },
      watermarking: { name: 'Marcas de agua', desc: 'Superponga sellos de "Borrador" o "Confidencial" en las páginas.' },
      webToPdf: { name: 'Web a PDF', desc: 'Guarde un sitio web en vivo como un documento para uso sin conexión.' },
      wirelessPrinting: { name: 'Impresión inalámbrica', desc: 'Envíe documentos directamente a una impresora Wi-Fi.' },
      zOrdering: { name: 'Orden Z', desc: 'Capas de imágenes y cuadros de texto uno encima del otro.' }
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
    downloadApp: 'ऐप APK डाउनलोड करें',
    logout: 'लॉग आउट',
    login: 'साइन इन करें',
    signup: 'खाता बनाएं',
    allTools: 'सभी टूल्स',
    home: 'होम',
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
      faqTitle: 'अक्सर पूछे जाने वाले प्रश्न',
      userTrust: 'हर हफ्ते 10k+ उपयोगकर्ताओं द्वारा पसंद किया गया',
      popularAutomated: 'लोकप्रिय स्वचालित उपकरण',
      featuresTitle: 'वह सब कुछ जिसकी आपको आवश्यकता है',
      featuresSubtitle: 'आधुनिक दस्तावेज़ वर्कफ़्लो के लिए डिज़ाइन किए गए शक्तिशाली उपकरण।',
      feat1Title: 'स्वचालित उपकरण',
      feat1Desc: 'हमारे स्वचालित सिस्टम के साथ दस्तावेजों का तुरंत सारांश और पुनर्लेखन करें।',
      feat2Title: 'डिफ़ॉल्ट रूप से सुरक्षित',
      feat2Desc: 'आपकी सभी संवेदनशील फाइलों के लिए एंटरप्राइज़-ग्रेड एन्क्रिप्शन।',
      feat3Title: 'बिजली की तरह तेज़',
      feat3Desc: 'बड़ी फाइलों को मिनटों में नहीं, सेकंडों में कन्वर्ट और कंप्रेस करें।'
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
    },
    features: {
      annotations: { name: 'एनोटेशन', desc: 'हाइलाइट, अंडरलाइन और डिजिटल स्टिकी नोट्स जोड़ें।' },
      autoCrop: { name: 'ऑटो-क्रॉप', desc: 'स्कैनिंग के दौरान किनारों की पहचान कर उन्हें सही करें।' },
      archive: { name: 'आर्काइव', desc: 'आसान स्टोरेज के लिए फाइलों को ZIP फॉर्मेट में कंप्रेस करें।' },
      batch: { name: 'बैच प्रोसेसिंग', desc: 'एक साथ कई दस्तावेजों को स्कैन या कन्वर्ट करें।' },
      biometric: { name: 'बायोमेट्रिक लॉक', desc: 'फिंगरप्रिंट या फेस आईडी का उपयोग करके फाइलों को सुरक्षित करें।' },
      cloud: { name: 'क्लाउड सिंक', desc: 'Google Drive या Dropbox पर ऑटोमैटिक बैकअप।' },
      comments: { name: 'टिप्पणियाँ', desc: 'सहयोगियों को टैग करें और दस्तावेज के अंदर चर्चा करें।' },
      darkMode: { name: 'डार्क मोड', desc: 'आंखों के तनाव को कम करने के लिए डार्क इंटरफेस।' },
      dictation: { name: 'डिक्टेशन', desc: 'अपनी आवाज को लिखित टेक्स्ट में बदलें (Voice-to-Text)।' },
      digitalSignature: { name: 'डिजिटल सिग्नेचर', desc: 'फॉर्म कानूनी बनाने के लिए अपने हस्ताक्षर जोड़ें।' },
      encryption: { name: 'एन्क्रिप्शन', desc: 'उच्च-स्तरीय सुरक्षा के साथ फाइलों को पासवर्ड से सुरक्षित करें।' },
      export: { name: 'एक्सपोर्ट', desc: 'विभिन्न फॉर्मेट (PDF, DOCX, JPG, TXT) में फाइलें सेव करें।' },
      fileCompression: { name: 'फ़ाइल कम्प्रेशन', desc: 'क्वालिटी खोए बिना फाइल का साइज कम करें।' },
      fontCustomization: { name: 'फ़ॉन्ट कस्टमाइजेशन', desc: 'सैकड़ों प्रोफेशनल फ़ॉन्ट्स तक पहुंच।' },
      grammarCheck: { name: 'व्याकरण सुधार', desc: 'स्पेलिंग और व्याकरण के लिए रियल-टाइम AI सुधार।' },
      grayscale: { name: 'ग्रेस्केल फ़िल्टर', desc: 'स्पष्टता के लिए रंगीन स्कैन को ब्लैक एंड व्हाइट में बदलें।' },
      headersFooters: { name: 'हेडर और फुटर', desc: 'हर पेज पर पेज नंबर, तारीख या टाइटल जोड़ें।' },
      hyperlinks: { name: 'हाइपरलिंक', desc: 'क्लिक करने योग्य वेब लिंक या इंटरनल बुकमार्क जोड़ें।' },
      idCard: { name: 'आईडी कार्ड मोड', desc: 'आईडी के दोनों तरफ स्कैन करें और उन्हें एक ही पेज पर रखें।' },
      imageEnhancement: { name: 'इमेज एन्हांसमेंट', desc: 'धुंधले स्कैन को साफ करने के लिए AI का उपयोग।' },
      imageToText: { name: 'इमेज से टेक्स्ट', desc: 'किसी भी फोटो से टेक्स्ट निकालें और एडिट करें।' },
      layoutTemplates: { name: 'लेआउट टेम्प्लेट्स', desc: 'रिज्यूमे, इनवॉइस और लेटर के लिए बने-बनाए फॉर्मेट।' },
      lineSpacing: { name: 'लाइन स्पेसिंग', desc: 'वाक्यों के बीच लंबवत अंतर को एडजस्ट करें।' },
      mergeFiles: { name: 'फ़ाइलें मर्ज करें', desc: 'कई पीडीएफ या इमेज को एक दस्तावेज में जोड़ें।' },
      multiLanguage: { name: 'बहु-भाषा समर्थन', desc: 'दर्जनों भाषाओं के लिए इंटरफेस और ओसीआर समर्थन।' },
      nightMode: { name: 'नाइट मोड स्कैनिंग', desc: 'अंधेरे में स्पष्ट फोटो लेने के लिए फ्लैश का उपयोग।' },
      ocr: { name: 'ओसीआर', desc: 'स्कैन किए गए टेक्स्ट को खोजने योग्य बनाने वाली तकनीक।' },
      offlineAccess: { name: 'ऑफलाइन एक्सेस', desc: 'इंटरनेट के बिना फाइलें एडिट करें और देखें।' },
      pageReordering: { name: 'पेज रीऑर्डरिंग', desc: 'पेज का क्रम बदलने के लिए ड्रैग एंड ड्रॉप करें।' },
      pdfSplitting: { name: 'पीडीएफ स्प्लिटिंग', desc: 'एक बड़ी पीडीएफ को छोटी फाइलों में काटें।' },
      qrScanner: { name: 'क्यूआर कोड स्कैनर', desc: 'लिंक और बारकोड पढ़ने के लिए इन-बिल्ट टूल।' },
      readMode: { name: 'रीड मोड', desc: 'ई-बुक्स या लंबी रिपोर्ट पढ़ने के लिए व्याकुलता-मुक्त दृश्य।' },
      redaction: { name: 'रेडाक्शन', desc: 'संवेदनशील जानकारी को स्थायी रूप से छिपाएं।' },
      smartSummaries: { name: 'स्मार्ट सारांश', desc: 'लंबे दस्तावेजों के AI-जनरेटेड बुलेट पॉइंट्स।' },
      suggestionMode: { name: 'सुझाव मोड', desc: 'टेक्स्ट को स्थायी रूप से बदले बिना बदलावों को ट्रैक करें।' },
      tableExtraction: { name: 'टेबल एक्सट्रैक्शन', desc: 'प्रिंटेड टेबल को स्कैन करें और एक्सेल शीट में बदलें।' },
      translation: { name: 'अनुवाद', desc: 'दस्तावेज की सामग्री को तुरंत दूसरी भाषा में अनुवाद करें।' },
      versionHistory: { name: 'वर्जन हिस्ट्री', desc: 'फाइल में किए गए हर एडिट को देखें और रिस्टोर करें।' },
      watermarking: { name: 'वॉटरमार्किंग', desc: 'पेजों पर "ड्राफ्ट" या "कॉन्फिडेंशियल" स्टैम्प लगाएं।' },
      webToPdf: { name: 'वेब से पीडीएफ', desc: 'ऑफलाइन उपयोग के लिए वेबसाइट को दस्तावेज के रूप में सेव करें।' },
      wirelessPrinting: { name: 'वायरलेस प्रिंटिंग', desc: 'सीधे वाई-फाई प्रिंटर पर दस्तावेज भेजें।' },
      zOrdering: { name: 'जेड-ऑर्डरिंग', desc: 'इमेज और टेक्स्ट बॉक्स को एक-दूसरे के ऊपर लेयर करें।' }
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
    downloadApp: 'Télécharger APK',
    logout: 'Déconnexion',
    login: 'Connexion',
    signup: 'Créer un compte',
    allTools: 'Tous les Outils',
    home: 'Accueil',
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
      faqTitle: 'Questions Fréquemment Posées',
      userTrust: 'Apprécié par plus de 10 000 utilisateurs chaque semaine',
      popularAutomated: 'Outils Automatisés Populaires',
      featuresTitle: 'Tout ce dont vous avez besoin',
      featuresSubtitle: 'Des outils puissants conçus pour les flux de travail documentaires modernes.',
      feat1Title: 'Outils Automatisés',
      feat1Desc: 'Résumez et réécrivez des documents instantanément avec notre système automatisé.',
      feat2Title: 'Sécurisé par Défaut',
      feat2Desc: 'Chiffrement de niveau entreprise pour tous vos fichiers sensibles.',
      feat3Title: 'Ultra Rapide',
      feat3Desc: 'Convertissez et compressez des fichiers volumineux en quelques secondes.'
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
    },
    features: {
      annotations: { name: 'Annotations', desc: 'Surlignez, soulignez et ajoutez des notes numériques.' },
      autoCrop: { name: 'Recadrage automatique', desc: 'Détection intelligente des bords pour un scan parfait.' },
      archive: { name: 'Archivage', desc: 'Compressez vos fichiers au format ZIP pour un stockage facile.' },
      batch: { name: 'Traitement par lots', desc: 'Convertissez ou scannez plusieurs documents à la fois.' },
      biometric: { name: 'Verrouillage biométrique', desc: 'Sécurisez vos fichiers avec Touch ID ou Face ID.' },
      cloud: { name: 'Synchronisation Cloud', desc: 'Sauvegarde automatique sur Google Drive ou Dropbox.' },
      comments: { name: 'Commentaires', desc: 'Collaborez et discutez directement dans le document.' },
      darkMode: { name: 'Mode sombre', desc: 'Une interface sombre pour réduire la fatigue oculaire.' },
      dictation: { name: 'Dictée', desc: 'Transformez votre voix en texte écrit (Vocal vers Texte).' },
      digitalSignature: { name: 'Signature numérique', desc: 'Signez vos documents numériquement.' },
      encryption: { name: 'Chiffrement', desc: 'Protégez vos fichiers par mot de passe haute sécurité.' },
      export: { name: 'Exporter', desc: 'Enregistrez en plusieurs formats (PDF, DOCX, JPG, TXT).' },
      fileCompression: { name: 'Compression de fichiers', desc: 'Réduisez la taille sans perte de qualité visuelle.' },
      fontCustomization: { name: 'Personnalisation des polices', desc: 'Accédez à des centaines de polices professionnelles.' },
      grammarCheck: { name: 'Correction grammaticale', desc: 'Correction AI en temps réel de l\'orthographe et syntaxe.' },
      grayscale: { name: 'Filtre niveaux de gris', desc: 'Convertissez vos scans en noir et blanc pour plus de clarté.' },
      headersFooters: { name: 'En-têtes et pieds de page', desc: 'Ajoutez numéros de page, dates ou titres partout.' },
      hyperlinks: { name: 'Hyperliens', desc: 'Insérez des liens web ou des signets internes.' },
      idCard: { name: 'Mode carte d\'identité', desc: 'Scannez les deux faces d\'une carte sur une seule page.' },
      imageEnhancement: { name: 'Amélioration d\'image', desc: 'Nettoyage AI des scans flous ou décolorés.' },
      imageToText: { name: 'Image vers texte', desc: 'Extrayez le texte modifiable de n\'importe quelle photo.' },
      layoutTemplates: { name: 'Modèles de mise en page', desc: 'Modèles pour CV, factures et lettres.' },
      lineSpacing: { name: 'Espacement des lignes', desc: 'Ajustez l\'écart vertical entre les phrases.' },
      mergeFiles: { name: 'Fusionner des fichiers', desc: 'Combinez plusieurs PDF ou images en un seul fichier.' },
      multiLanguage: { name: 'Support multilingue', desc: 'Interface et OCR disponibles en des dizaines de langues.' },
      nightMode: { name: 'Numérisation mode nuit', desc: 'Utilise le flash pour capturer des documents dans le noir.' },
      ocr: { name: 'OCR', desc: 'Technologie permettant de rechercher du texte dans les scans.' },
      offlineAccess: { name: 'Accès hors ligne', desc: 'Modifiez vos fichiers sans connexion Internet.' },
      pageReordering: { name: 'Réorganiser les pages', desc: 'Glissez-déposez les pages pour changer l\'ordre.' },
      pdfSplitting: { name: 'Division de PDF', desc: 'Divisez un PDF volumineux en plusieurs fichiers.' },
      qrScanner: { name: 'Scanner de code QR', desc: 'Outil intégré pour lire les liens et codes-barres.' },
      readMode: { name: 'Mode lecture', desc: 'Vue sans distraction pour lire des eBooks ou rapports.' },
      redaction: { name: 'Masquage', desc: 'Masquez définitivement les informations sensibles.' },
      smartSummaries: { name: 'Résumés intelligents', desc: 'Points clés AI générés à partir de longs documents.' },
      suggestionMode: { name: 'Mode suggestion', desc: 'Suivez les modifications sans modifier le texte final.' },
      tableExtraction: { name: 'Extraction de tableaux', desc: 'Scannez un tableau et transformez-le en feuille Excel.' },
      translation: { name: 'Traduction', desc: 'Traduisez instantanément vos documents dans une autre langue.' },
      versionHistory: { name: 'Historique des versions', desc: 'Consultez et restaurez chaque modification effectuée.' },
      watermarking: { name: 'Filigranes', desc: 'Ajoutez des tampons "Brouillon" ou "Confidentiel" sur vos pages.' },
      webToPdf: { name: 'Web vers PDF', desc: 'Enregistrez un site web en PDF pour une lecture hors ligne.' },
      wirelessPrinting: { name: 'Impression sans fil', desc: 'Envoyez vos documents vers une imprimante Wi-Fi.' },
      zOrdering: { name: 'Ordre Z', desc: 'Superposez images et zones de texte les unes sur les autres.' }
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
    downloadApp: 'App-APK herunterladen',
    logout: 'Abmelden',
    login: 'Anmelden',
    signup: 'Konto erstellen',
    allTools: 'Alle Tools',
    home: 'Startseite',
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
    downloadApp: 'アプリAPKをダウンロード',
    logout: 'ログアウト',
    login: 'ログイン',
    signup: 'アカウント作成',
    allTools: 'すべてのツール',
    home: 'ホーム',
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
    downloadApp: '下载应用 APK',
    logout: '退出登录',
    login: '登录',
    signup: '注册账号',
    allTools: '全部工具',
    home: '首页',
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
    downloadApp: 'Baixar APK',
    logout: 'Sair da Conta',
    login: 'Entrar',
    signup: 'Criar Conta',
    allTools: 'Todas as Ferramentas',
    home: 'Início',
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
    downloadApp: 'Скачать APK',
    logout: 'Выйти',
    login: 'Вход',
    signup: 'Регистрация',
    allTools: 'Все инструменты',
    home: 'Главная',
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
    downloadApp: 'Scarica APK',
    logout: 'Disconnetti',
    login: 'Accedi',
    signup: 'Registrati',
    allTools: 'Tutti gli Strumenti',
    home: 'Home',
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
    downloadApp: 'تحميل تطبيق APK',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    allTools: 'جميع الأدوات',
    home: 'الرئيسية',
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

  'Marathi': {
    dashboard: 'डॅशबोर्ड',
    documents: 'माझी कागदपत्रे',
    myDocuments: 'माझी कागदपत्रे',
    recent: 'अलीकडील',
    settings: 'पसंती',
    preferences: 'पसंती',
    billing: 'बिलिंग आणि प्लॅन',
    support: 'मदत व सपोर्ट',
    search: 'साधने शोधा...',
    searchTools: '३०+ PDF साधने शोधा...',
    upload: 'फाईल अपलोड करा',
    uploadFile: 'PDF किंवा दस्तऐवज अपलोड करा',
    workspace: 'वर्कस्पेस',
    admin: 'ॲडमिन कन्सोल',
    downloadApp: 'ॲप APK डाउनलोड करा',
    logout: 'लॉग आउट',
    login: 'साइन इन करा',
    signup: 'खाते तयार करा',
    allTools: 'सर्व साधने',
    home: 'मुख्यपृष्ठ',
    pricing: 'किंमत',

    greeting: {
      morning: 'शुभ प्रभात',
      afternoon: 'शुभ दुपार',
      evening: 'शुभ संध्या'
    },

    actions: {
      save: 'जतन करा',
      cancel: 'रद्द करा',
      delete: 'हटवा',
      download: 'डाउनलोड करा',
      preview: 'पूर्वावलोकन',
      edit: 'संपादित करा',
      convert: 'रूपांतरित करा',
      compress: 'कॉंप्रेस करा',
      merge: 'एकत्र करा',
      split: 'विभाजित करा',
      extract: 'काढा',
      rotate: 'फिरवा',
      protect: 'सुरक्षित करा',
      unlock: 'अनलॉक करा',
      apply: 'लागू करा',
      process: 'प्रक्रिया करा',
      processing: 'प्रक्रिया सुरू आहे...',
      done: 'पूर्ण झाले',
      close: 'बंद करा',
      back: 'मागे',
      next: 'पुढील',
      tryAgain: 'पुन्हा प्रयत्न करा',
      viewAll: 'सर्व पहा',
      getStarted: 'विनामूल्य सुरू करा',
      upgradePlan: 'प्लॅन अपग्रेड करा',
      downloadApk: 'APK डाउनलोड करा'
    },

    categories: {
      create: 'तयार करा आणि डिझाइन',
      convert: 'रूपांतरण',
      edit: 'संपादन',
      organize: 'पृष्ठे व्यवस्थित करा',
      optimize: 'ऑप्टिमाइझ आणि OCR',
      security: 'सुरक्षा आणि स्वाक्षरी',
      ai: 'कृत्रिम बुद्धिमत्ता (AI)'
    },

    tools: {
      compress: 'PDF कॉंप्रेस करा',
      merge: 'PDF एकत्र करा',
      convert: 'PDF रूपांतरित करा',
      split: 'PDF विभाजित करा',
      pdfToWord: 'PDF ते Word',
      wordToPdf: 'Word ते PDF',
      excelToPdf: 'Excel ते PDF',
      powerpointToPdf: 'PowerPoint ते PDF',
      imageToPdf: 'चित्र ते PDF',
      pdfToImage: 'PDF ते चित्र',
      ocr: 'OCR आणि मजकूर',
      translate: 'दस्तऐवज भाषांतर करा',
      protect: 'पासवर्डने सुरक्षित करा',
      unlock: 'PDF अनलॉक करा',
      cameraScanner: 'कॅमेरा स्कॅनर',
      editPdf: 'PDF मजकूर संपादन',
      organizePdf: 'पृष्ठे क्रमवारी लावा',
      digitalSign: 'डिजिटल स्वाक्षरी',
      summarizePdf: 'सारांश तयार करा',
      askAi: 'AI ला प्रश्न विचारा',
      watermark: 'वॉटरमार्क जोडा',
      flatten: 'PDF फ्लॅटन करा',
      createPdf: 'नवीन PDF तयार करा',
      resumeBuilder: 'बायोडाटा / CV बनवा'
    },

    profile: {
      title: 'सेटिंग्ज आणि पसंती',
      account: 'खाते प्रोफाइल',
      planBilling: 'प्लॅन आणि बिलिंग',
      preferencesTab: 'पसंती',
      securityTab: 'सुरक्षा आणि 2FA',
      storageTab: 'स्टोरेज आणि गोपनीयता',
      sessionsTab: 'सक्रिय सत्रे',
      appLanguage: 'ॲपची भाषा',
      appLanguageDesc: 'संपूर्ण ॲपसाठी तुमची आवडती भाषा निवडा',
      twoStepVerification: 'दोन-टप्प्यांची पडताळणी',
      twoStepVerificationDesc: 'TOTP ॲपसह खाते सुरक्षित करा',
      autoRestoreSession: 'ऑटो-रीस्टोअर सत्र',
      autoRestoreSessionDesc: 'पुन्हा उघडल्यावर मसुदे आपोआप पूर्ववत करा',
      autoDelete: 'फाइली आपोआप हटवा',
      autoDeleteDesc: '२४ तासांनंतर कॅश साफ करा',
      soundEffects: 'साउंड इफेक्ट्स',
      textScaling: 'फॉन्ट स्केल',
      exportData: 'वापरकर्ता डेटा निर्यात करा',
      exportDataDesc: 'प्रोफाइल व इतिहास JSON मध्ये डाउनलोड करा',
      activeSessions: 'सक्रिय उपकरणे',
      revokeSessions: 'सर्व सत्रे रद्द करा',
      dangerZone: 'धोकादायक क्षेत्र'
    },

    landing: {
      badge: 'व्यावसायिक क्लाउड PDF सूट',
      heroTitle: 'जलद आणि सुरक्षित कामासाठी सर्व-इन-एक PDF साधने',
      heroSubtitle: 'बँक-स्तरीय सुरक्षेसह PDF एकत्र करा, विभाजित करा आणि रूपांतरित करा.',
      startFree: 'विनामूल्य सुरू करा',
      exploreTools: 'सर्व साधने पहा',
      popularTools: 'लोकप्रिय PDF साधने',
      securityBadge: 'बँक-स्तरीय सुरक्षा',
      securityTitle: 'खाजगी आणि सुरक्षित',
      securityDesc: 'सर्व प्रक्रिया ब्र라우झर मेमरीमध्ये सुरक्षितपणे होते.',
      pricingTitle: 'पारदर्शक किंमत',
      pricingSubtitle: 'तुमच्या गरजेनुसार प्लॅन निवडा.',
      faqTitle: 'सतत विचारले जाणारे प्रश्न'
    },

    twoFactor: {
      title: 'दोन-टप्प्यांची पडताळणी',
      subtitle: 'साइन इन करण्यासाठी प्रमाणीकरण ॲपमधून ६-अंकी कोड प्रविष्ट करा.',
      enterCode: '६-अंकी सुरक्षा कोड',
      useBackup: 'बैकअप कोड वापरा',
      useTotp: 'ॲप कोड वापरा',
      verifying: 'कोड तपासत आहे...',
      invalidCode: 'अवैध कोड.',
      validCode: 'कोड स्वीकारला! साइन इन होत आहे...',
      enableSuccess: 'दोन-टप्प्यांची पडताळणी सक्रिय झाली आहे.',
      backupCodesTitle: 'बैकअप कोड जतन करा',
      backupCodesDesc: 'फोन हरवल्यास हे कोड सुरक्षित ठेवा.'
    }
  },

  'Telugu': {
    dashboard: 'డాష్‌బోర్డ్',
    documents: 'నా పత్రాలు',
    myDocuments: 'నా పత్రాలు',
    recent: 'ఇటీవలి',
    settings: 'అభిరుచులు',
    preferences: 'అభిరుచులు',
    billing: 'బిల్లింగ్ & ప్లాన్',
    support: 'సహాయం & మద్దతు',
    search: 'పరికరాలు శోధించండి...',
    searchTools: '30+ PDF పరికరాలను శోధించండి...',
    upload: 'ఫైల్ అప్‌లోడ్ చేయండి',
    uploadFile: 'PDF లేదా డాక్యుమెంట్ అప్‌లోడ్ చేయండి',
    workspace: 'వర్క్‌స్పేస్',
    admin: 'అడ్మిన్ కన్సోల్',
    downloadApp: 'యాప్ APK డౌన్‌లోడ్ చేయండి',
    logout: 'లాగ్ అవుట్',
    login: 'సైన్ ఇన్ చేయండి',
    signup: 'ఖాతా సృష్టించండి',
    allTools: 'అన్ని పరికరాలు',
    home: 'హోమ్',
    pricing: 'ధరలు',

    greeting: {
      morning: 'శుభోదయం',
      afternoon: 'శుభ మధ్యాహ్నం',
      evening: 'శుభ సాయంత్రం'
    },

    actions: {
      save: 'సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి',
      delete: 'తొలగించండి',
      download: 'డౌన్‌లోడ్ చేయండి',
      preview: 'ప్రివ్యూ',
      edit: 'సవరించండి',
      convert: 'మార్చండి',
      compress: 'పరిమాణం తగ్గించండి',
      merge: 'కలపండి',
      split: 'విభజించండి',
      extract: 'వేరు చేయండి',
      rotate: 'తిప్పండి',
      protect: 'రక్షించండి',
      unlock: 'అన్‌లాక్ చేయండి',
      apply: 'వర్తించండి',
      process: 'ప్రక్రియ చేయండి',
      processing: 'ప్రక్రియ జరుగుతోంది...',
      done: 'పూర్తయింది',
      close: 'మూసివేయండి',
      back: 'వెనుకకు',
      next: 'తరువాత',
      tryAgain: 'మళ్ళీ ప్రయత్నించండి',
      viewAll: 'అన్నీ చూడండి',
      getStarted: 'ఉచితంగా ప్రారంభించండి',
      upgradePlan: 'ప్లాన్ అప్‌గ్రేడ్ చేయండి',
      downloadApk: 'APK డౌన్‌లోడ్ చేయండి'
    },

    categories: {
      create: 'సృష్టించండి & డిజైన్',
      convert: 'రూపాంతరం',
      edit: 'సవరణలు',
      organize: 'పేజీలు నిర్వహించండి',
      optimize: 'ఆప్టిమైజ్ & OCR',
      security: 'భద్రత & సంతకం',
      ai: 'ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (AI)'
    },

    tools: {
      compress: 'PDF సైజ్ తగ్గించండి',
      merge: 'PDF ఫైళ్లను కలపండి',
      convert: 'PDF మార్చండి',
      split: 'PDF విభజించండి',
      pdfToWord: 'PDF నుండి Word',
      wordToPdf: 'Word నుండి PDF',
      excelToPdf: 'Excel నుండి PDF',
      powerpointToPdf: 'PowerPoint నుండి PDF',
      imageToPdf: 'ఫోటో నుండి PDF',
      pdfToImage: 'PDF నుండి ఫోటో',
      ocr: 'OCR మరియు టెక్స్ట్',
      translate: 'డాక్యుమెంట్ అనువాదం',
      protect: 'పాస్‌వర్డ్‌తో రక్షించండి',
      unlock: 'PDF అన్‌లాక్ చేయండి',
      cameraScanner: 'కెమెరా స్కానర్',
      editPdf: 'PDF టెక్స్ట్ సవరణ',
      organizePdf: 'పేజీల క్రమం',
      digitalSign: 'డిజిటల్ సంతకం',
      summarizePdf: 'సారాంశం సృష్టించండి',
      askAi: 'AI ని ప్రశ్నించండి',
      watermark: 'వాటర్‌మార్క్ జోడించండి',
      flatten: 'PDF ఫ్లాటెన్ చేయండి',
      createPdf: 'కొత్త PDF సృష్టించండి',
      resumeBuilder: 'రెజ్యూమే / CV సృష్టించండి'
    },

    profile: {
      title: 'సెట్టింగ్‌లు & అభిరుచులు',
      account: 'ఖాతా ప్రొఫైల్',
      planBilling: 'ప్లాన్ & బిల్లింగ్',
      preferencesTab: 'అభిరుచులు',
      securityTab: 'భద్రత & 2FA',
      storageTab: 'స్టోరేజ్ & గోప్యత',
      sessionsTab: 'యాక్టివ్ సెషన్‌లు',
      appLanguage: 'యాప్ భాష',
      appLanguageDesc: 'మొత్తం యాప్ కోసం మీ భాషను ఎంచుకోండి',
      twoStepVerification: 'రెండు-దశల ధృవీకరణ',
      twoStepVerificationDesc: 'TOTP యాప్‌తో ఖాతాను రక్షించండి',
      autoRestoreSession: 'ఆటో-రీస్టోర్ సెషన్',
      autoRestoreSessionDesc: 'మళ్ళీ తెరిచినప్పుడు డ్రాఫ్ట్‌లను ఆటోమేటిక్‌గా పునరుద్ధరించండి',
      autoDelete: 'ఆటోమేటిక్ డిలీట్',
      autoDeleteDesc: '24 గంటల తర్వాత కాష్ క్లియర్ చేయండి',
      soundEffects: 'సౌండ్ ఎఫెక్ట్స్',
      textScaling: 'ఫాంట్ పరిమాణం',
      exportData: 'డేటా ఎగుమతి',
      exportDataDesc: 'ప్రొఫైల్ వివరాలను JSON గా డౌన్‌లోడ్ చేయండి',
      activeSessions: 'యాక్టివ్ పరికరాలు',
      revokeSessions: 'అన్ని సెషన్‌లను రద్దు చేయండి',
      dangerZone: 'డేంజర్ జోన్'
    },

    landing: {
      badge: 'ప్రొఫెషనల్ క్లౌడ్ PDF సూట్',
      heroTitle: 'వేగవంతమైన మరియు సురక్షితమైన పని కోసం PDF పరికరాలు',
      heroSubtitle: 'బ్యాంక్-స్థాయి భద్రతతో PDF లను కలపండి, విభజించండి మరియు మార్చండి.',
      startFree: 'ఉచితంగా ప్రారంభించండి',
      exploreTools: 'అన్ని పరికరాలను చూడండి',
      popularTools: 'ప్రజాదరణ పొందిన PDF పరికరాలు',
      securityBadge: 'బ్యాంక్-స్థాయి భద్రత',
      securityTitle: 'ప్రైవేట్ మరియు సురక్షితం',
      securityDesc: 'అన్ని ప్రక్రియలు బ్రౌజర్ మెమరీలో సురక్షితంగా జరుగుతాయి.',
      pricingTitle: 'సులభమైన ధరలు',
      pricingSubtitle: 'మీ అవసరాలకు తగిన ప్లాన్ ఎంచుకోండి.',
      faqTitle: 'తరచుగా అడిగే ప్రశ్నలు'
    },

    twoFactor: {
      title: 'రెండు-దశల ధృవీకరణ',
      subtitle: 'సైన్ ఇన్ చేయడానికి 6-అంకెల కోడ్‌ను నమోదు చేయండి.',
      enterCode: '6-అంకెల సెక్యూరిటీ కోడ్',
      useBackup: 'బ్యాకప్ కోడ్ ఉపయోగించండి',
      useTotp: 'యాప్ కోడ్ ఉపయోగించండి',
      verifying: 'పరిశీలిస్తోంది...',
      invalidCode: 'చెల్లని కోడ్.',
      validCode: 'కోడ్ ధృవీకరించబడింది!',
      enableSuccess: 'రెండు-దశల ధృవీకరణ యాక్టివేట్ చేయబడింది.',
      backupCodesTitle: 'బ్యాకప్ కోడ్‌లను సేవ్ చేయండి',
      backupCodesDesc: 'ఫోన్ పోయినప్పుడు ఇవి ఉపయోగపడతాయి.'
    }
  },

  'Tamil': {
    dashboard: 'டாஷ்போர்டு',
    documents: 'என் ஆவணங்கள்',
    myDocuments: 'என் ஆவணங்கள்',
    recent: 'சமீபத்தியவை',
    settings: 'விருப்பங்கள்',
    preferences: 'விருப்பங்கள்',
    billing: 'கட்டணம் & திட்டம்',
    support: 'உதவி & ஆதரவு',
    search: 'கருவிகளைத் தேடுக...',
    searchTools: '30+ PDF கருவிகளைத் தேடுக...',
    upload: 'கோப்பை பதிவேற்று',
    uploadFile: 'PDF அல்லது ஆவணத்தைப் பதிவேற்று',
    workspace: 'வேலைப்பகுதி',
    admin: 'நிர்வாகி கன்சோல்',
    downloadApp: 'ஆப் APK பதிவிறக்குக',
    logout: 'வெளியேறு',
    login: 'உள்நுழைக',
    signup: 'கணக்கை உருவாக்கு',
    allTools: 'அனைத்து கருவிகள்',
    home: 'முகப்பு',
    pricing: 'விலை பட்டியல்',

    greeting: {
      morning: 'காலை வணக்கம்',
      afternoon: 'மதிய வணக்கம்',
      evening: 'மாலை வணக்கம்'
    },

    actions: {
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      delete: 'நீக்கு',
      download: 'பதிவிறக்கு',
      preview: 'முன்னோட்டம்',
      edit: 'திருத்து',
      convert: 'மாற்று',
      compress: 'அளவைக்குறை',
      merge: 'ஒன்றுசேர்',
      split: 'பிரி',
      extract: 'பிரித்தெடு',
      rotate: 'சுழற்று',
      protect: 'பாதுகாக்கவும்',
      unlock: 'பூட்டைத் திற',
      apply: 'பயன்படுத்து',
      process: 'செயலாக்கு',
      processing: 'செயலாக்கப்படுகிறது...',
      done: 'முடிந்தது',
      close: 'மூடு',
      back: 'பின்னால்',
      next: 'அடுத்து',
      tryAgain: 'மீண்டும் முயல்க',
      viewAll: 'அனைத்தையும் பார்',
      getStarted: 'இலவசமாகத் தொடங்கு',
      upgradePlan: 'திட்டத்தை உயர்த்துக',
      downloadApk: 'APK பதிவிறக்கு'
    },

    categories: {
      create: 'உருவாக்கு & வடிவமைப்பு',
      convert: 'மாற்றம்',
      edit: 'திருத்தம்',
      organize: 'பக்கங்களை ஒழுங்கமை',
      optimize: 'மேம்படுத்து & OCR',
      security: 'பாதுகாப்பு & கையொப்பம்',
      ai: 'செயற்கை நுண்ணறிவு (AI)'
    },

    tools: {
      compress: 'PDF அளவைக்குறை',
      merge: 'PDF-களை ஒன்றுசேர்',
      convert: 'PDF மாற்று',
      split: 'PDF-ஐ பிரி',
      pdfToWord: 'PDF முதல் Word வரை',
      wordToPdf: 'Word முதல் PDF வரை',
      excelToPdf: 'Excel முதல் PDF வரை',
      powerpointToPdf: 'PowerPoint முதல் PDF வரை',
      imageToPdf: 'படம் முதல் PDF வரை',
      pdfToImage: 'PDF முதல் படம் வரை',
      ocr: 'OCR & உரை பிரித்தெடுத்தல்',
      translate: 'ஆவண மொழிபெயர்ப்பு',
      protect: 'கடவுச்சொல் பாதுகாப்பு',
      unlock: 'PDF பூட்டைத் திற',
      cameraScanner: 'கேமரா ஸ்கேனர்',
      editPdf: 'PDF உரை திருத்தம்',
      organizePdf: 'பக்க வரிசைமைப்பு',
      digitalSign: 'டிஜிட்டல் கையொப்பம்',
      summarizePdf: 'சுருக்கம் உருவாக்கு',
      askAi: 'AI இடம் கேளுங்கள்',
      watermark: 'வாட்டர்மார்க் சேர்',
      flatten: 'PDF தட்டையாக்கு',
      createPdf: 'புதிய PDF உருவாக்கு',
      resumeBuilder: 'சுயவிவரம் (CV) உருவாக்கு'
    },

    profile: {
      title: 'அமைப்புகள் & விருப்பங்கள்',
      account: 'கணக்கு சுயவிவரம்',
      planBilling: 'திட்டம் & கட்டணம்',
      preferencesTab: 'விருப்பங்கள்',
      securityTab: 'பாதுகாப்பு & 2FA',
      storageTab: 'சேமிப்பகம் & தனியுரிமை',
      sessionsTab: 'செயலில் உள்ள அமர்வுகள்',
      appLanguage: 'செயலி மொழி',
      appLanguageDesc: 'செயலிக்கான மொழியைத் தேர்ந்தெடுக்கவும்',
      twoStepVerification: 'இருபடி சரிபார்ப்பு',
      twoStepVerificationDesc: 'TOTP செயலி மூலம் கணக்கைப் பாதுகாக்கவும்',
      autoRestoreSession: 'தானியங்கி மீட்பு',
      autoRestoreSessionDesc: 'திறக்கும் போது வரைவுகளைத் தானாக மீட்கவும்',
      autoDelete: 'தானாக நீக்குதல்',
      autoDeleteDesc: '24 மணி நேரத்திற்குப் பின் நீக்கவும்',
      soundEffects: 'ஒலி விளைவுகள்',
      textScaling: 'எழுத்து அளவு',
      exportData: 'தரவு ஏற்றுமதி',
      exportDataDesc: 'சுயவிவரத்தை JSON கோப்பாகப் பதிவிறக்குக',
      activeSessions: 'செயலில் உள்ள சாதனங்கள்',
      revokeSessions: 'அனைத்து அமர்வுகளையும் ரத்துசெய்',
      dangerZone: 'அபாய பகுதி'
    },

    landing: {
      badge: 'தொழில்முறை கிளவுட் PDF தொகுப்பு',
      heroTitle: 'வேகமான மற்றும் பாதுகாப்பான பணிக்கான PDF கருவிகள்',
      heroSubtitle: 'வங்கி தர பாதுகாப்பில் PDF-களை ஒன்றுசேர்க்கவும், பிரிக்கவும் மற்றும் மாற்றவும்.',
      startFree: 'இலவசமாகத் தொடங்கு',
      exploreTools: 'அனைத்து கருவிகளையும் பார்',
      popularTools: 'பிரபலமான PDF கருவிகள்',
      securityBadge: 'வங்கி தர பாதுகாப்பு',
      securityTitle: 'தனியுரிமை மற்றும் பாதுகாப்பு',
      securityDesc: 'அனைத்து செயல்பாடுகளும் உலாவி நினைவகத்தில் பாதுகாப்பாக நடக்கும்.',
      pricingTitle: 'எளிமையான கட்டணம்',
      pricingSubtitle: 'உங்கள் தேவைக்கேற்ப திட்டத்தைத் தேர்ந்தெடுக்கவும்.',
      faqTitle: 'அடிக்கடி கேட்கப்படும் கேள்விகள்'
    },

    twoFactor: {
      title: 'இருபடி சரிபார்ப்பு',
      subtitle: 'உள்நுழைய 6 இலக்கக் குறியீட்டை உள்ளிடவும்.',
      enterCode: '6 இலக்க பாதுகாப்பு குறியீடு',
      useBackup: 'காப்பு குறியீட்டைப் பயன்படுத்து',
      useTotp: 'செயலி குறியீட்டைப் பயன்படுத்து',
      verifying: 'சரிபார்க்கிறது...',
      invalidCode: 'தவறான குறியீடு.',
      validCode: 'குறியீடு சரிபார்க்கப்பட்டது!',
      enableSuccess: 'இருபடி சரிபார்ப்பு இயக்கப்பட்டது.',
      backupCodesTitle: 'காப்பு குறியீடுகளைச் சேமிக்கவும்',
      backupCodesDesc: 'தொலைபேசியை இழந்தால் இவை உதவும்.'
    }
  },

  'Gujarati': {
    dashboard: 'ડેશબોર્ડ',
    documents: 'મારા દસ્તાવેજો',
    myDocuments: 'મારા દસ્તાવેજો',
    recent: 'તાજેતરના',
    settings: 'પ્રાથમિકતાઓ',
    preferences: 'પ્રાથમિકતાઓ',
    billing: 'બિલિંગ અને પ્લાન',
    support: 'મદદ અને સપોર્ટ',
    search: 'સાધનો શોધો...',
    searchTools: '30+ PDF સાધનો શોધો...',
    upload: 'ફાઇલ અપલોડ કરો',
    uploadFile: 'PDF અથવા દસ્તાવેજ અપલોડ કરો',
    workspace: 'વર્કસ્પેસ',
    admin: 'એડમિન કન્સોલ',
    downloadApp: 'એપ APK ડાઉનલોડ કરો',
    logout: 'લોગ આઉટ',
    login: 'સાઇન ઇન કરો',
    signup: 'ખાતું બનાવો',
    allTools: 'બધા સાધનો',
    home: 'હોમ',
    pricing: 'કિંમતો',

    greeting: {
      morning: 'સુપ્રભાત',
      afternoon: 'શુભ બપોર',
      evening: 'શુભ સંધ્યા'
    },

    actions: {
      save: 'સાચવો',
      cancel: 'રદ કરો',
      delete: 'કાઢી નાખો',
      download: 'ડાઉનલોડ કરો',
      preview: 'પૂર્વાવલોકન',
      edit: 'સંપાદિત કરો',
      convert: 'રૂપાંતરિત કરો',
      compress: 'સંકુચિત કરો',
      merge: 'એકત્રિત કરો',
      split: 'વિભાજિત કરો',
      extract: 'કાઢો',
      rotate: 'ફેરવો',
      protect: 'સુરક્ષિત કરો',
      unlock: 'અનલોક કરો',
      apply: 'લાગુ કરો',
      process: 'પ્રક્રિયા કરો',
      processing: 'પ્રક્રિયા થઈ રહી છે...',
      done: 'પૂર્ણ થયું',
      close: 'બંધ કરો',
      back: 'પાછા',
      next: 'આગળ',
      tryAgain: 'ફરી પ્રયાસ કરો',
      viewAll: 'બધું જુઓ',
      getStarted: 'મફતમાં શરૂ કરો',
      upgradePlan: 'પ્લાન અપગ્રેડ કરો',
      downloadApk: 'APK ડાઉનલોડ કરો'
    },

    categories: {
      create: 'બનાવો અને ડિઝાઇન',
      convert: 'રૂપાંતર',
      edit: 'સંપાદન',
      organize: 'પૃષ્ઠો વ્યવસ્થિત કરો',
      optimize: 'ઓપ્ટિમાઇઝ અને OCR',
      security: 'સુરક્ષા અને સહી',
      ai: 'આર્ટિફિશિયલ ઇન્ટેલિજન્સ (AI)'
    },

    tools: {
      compress: 'PDF સાઇઝ ઘટાડો',
      merge: 'PDF ભેગી કરો',
      convert: 'PDF રૂપાંતરિત કરો',
      split: 'PDF અલગ કરો',
      pdfToWord: 'PDF થી Word',
      wordToPdf: 'Word થી PDF',
      excelToPdf: 'Excel થી PDF',
      powerpointToPdf: 'PowerPoint થી PDF',
      imageToPdf: 'ફોટો થી PDF',
      pdfToImage: 'PDF થી ફોટો',
      ocr: 'OCR અને ટેક્સ્ટ',
      translate: 'દસ્તાવેજ અનુવાદ',
      protect: 'પાસવર્ડથી સુરક્ષિત કરો',
      unlock: 'PDF અનલોક કરો',
      cameraScanner: 'કેમેરા સ્કેનર',
      editPdf: 'PDF ટેક્સ્ટ સંપાદન',
      organizePdf: 'પૃષ્ઠો ક્રમબદ્ધ કરો',
      digitalSign: 'ડિજિટલ સહી',
      summarizePdf: 'સારાંશ બનાવો',
      askAi: 'AI ને પૂછો',
      watermark: 'વોટરમાર્ક ઉમેરો',
      flatten: 'PDF ફ્લેટન કરો',
      createPdf: 'નવી PDF બનાવો',
      resumeBuilder: 'રેઝ્યૂમે / CV બનાવો'
    },

    profile: {
      title: 'સેટિંગ્સ અને પ્રાથમિકતાઓ',
      account: 'ખાતાની પ્રોફાઇલ',
      planBilling: 'પ્લાન અને બિલિંગ',
      preferencesTab: 'પ્રાથમિકતાઓ',
      securityTab: 'સુરક્ષા અને 2FA',
      storageTab: 'સ્ટોરેજ અને ગોપનીયતા',
      sessionsTab: 'સક્રિય સત્રો',
      appLanguage: 'એપ્લિકેશન ભાષા',
      appLanguageDesc: 'આખી એપ્લિકેશન માટે ભાષા પસંદ કરો',
      twoStepVerification: 'બે-તબક્કાની ચકાસણી',
      twoStepVerificationDesc: 'TOTP એપ્લિકેશનથી ખાતું સુરક્ષિત કરો',
      autoRestoreSession: 'ઓટો-રિસ્ટોર સત્ર',
      autoRestoreSessionDesc: 'ફરી ખોલવા પર ડ્રાફ્ટ્સ સ્વચાલિત પુનઃસ્થાપિત કરો',
      autoDelete: 'ઓટો-ડિલીટ ફાઇલો',
      autoDeleteDesc: '24 કલાક પછી કેશ સાફ કરો',
      soundEffects: 'સાઉન્ડ અસરો',
      textScaling: 'ફોન્ટ કદ',
      exportData: 'ડેટા નિકાસ કરો',
      exportDataDesc: 'પ્રોફાઇલ વિગતો JSON માં ડાઉનલોડ કરો',
      activeSessions: 'સક્રિય ઉપકરણો',
      revokeSessions: 'બધા સત્રો રદ કરો',
      dangerZone: 'ડેન્જર ઝોન'
    },

    landing: {
      badge: 'પ્રોફેશનલ ક્લાઉડ PDF સૂટ',
      heroTitle: 'ઝડપી અને સુરક્ષિત કામ માટે PDF સાધનો',
      heroSubtitle: 'બેંક-સ્તરની સુરક્ષા સાથે PDF ભેગી કરો, અલગ કરો અને રૂપાંતરિત કરો.',
      startFree: 'મફતમાં શરૂ કરો',
      exploreTools: 'બધા સાધનો જુઓ',
      popularTools: 'લોકપ્રિય PDF સાધનો',
      securityBadge: 'બેંક-સ્તરની સુરક્ષા',
      securityTitle: 'ખાનગી અને સુરક્ષિત',
      securityDesc: 'બધી પ્રક્રિયા બ્રાઉઝર મેમરીમાં સુરક્ષિત રીતે થાય છે.',
      pricingTitle: 'સરળ કિંમતો',
      pricingSubtitle: 'તમારી જરૂરિયાત મુજબ પ્લાન પસંદ કરો.',
      faqTitle: 'વારંવાર પૂછાતા પ્રશ્નો'
    },

    twoFactor: {
      title: 'બે-તબક્કાની ચકાસણી',
      subtitle: 'સાઇન ઇન કરવા માટે 6-અંકનો કોડ દાખલ કરો.',
      enterCode: '6-અંકનો સુરક્ષા કોડ',
      useBackup: 'બેકઅપ કોડ વાપરો',
      useTotp: 'એપ કોડ વાપરો',
      verifying: 'ચકાસણી થઈ રહી છે...',
      invalidCode: 'અમાન્ય કોડ.',
      validCode: 'કોડ ચકાસાયો!',
      enableSuccess: 'બે-તબક્કાની ચકાસણી સક્રિય થઈ.',
      backupCodesTitle: 'બેકઅપ કોડ સાચવો',
      backupCodesDesc: 'ફોન ખોવાઈ જાય ત્યારે આ ઉપયોગી થશે.'
    }
  },

  'Urdu': {
    dashboard: 'ڈیش بورڈ',
    documents: 'میری دستاویزات',
    myDocuments: 'میری دستاویزات',
    recent: 'حالیہ',
    settings: 'ترجیحات',
    preferences: 'ترجیحات',
    billing: 'بلنگ اور پلان',
    support: 'مدد و سپورٹ',
    search: 'ٹولز تلاش کریں...',
    searchTools: '30+ پی ڈی ایف ٹولز تلاش کریں...',
    upload: 'فائل اپ لوڈ کریں',
    uploadFile: 'PDF یا دستاویز اپ لوڈ کریں',
    workspace: 'ورک اسپیس',
    admin: 'ایڈمن کونسول',
    downloadApp: 'ایپ APK ڈاؤن لوڈ کریں',
    logout: 'لاگ آؤٹ',
    login: 'سائن ان کریں',
    signup: 'اکاؤنٹ بنائیں',
    allTools: 'تمام ٹولز',
    home: 'ہوم',
    pricing: 'قیمتیں',

    greeting: {
      morning: 'صبح بخیر',
      afternoon: 'سہ پہر بخیر',
      evening: 'شام بخیر'
    },

    actions: {
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      delete: 'حذف کریں',
      download: 'ڈاؤن لوڈ کریں',
      preview: 'پیش نظارہ',
      edit: 'ترمیم کریں',
      convert: 'تبدیل کریں',
      compress: 'سائز کم کریں',
      merge: 'یکجا کریں',
      split: 'تقسیم کریں',
      extract: 'نکالیں',
      rotate: 'گھمائیں',
      protect: 'محفوظ کریں',
      unlock: 'ان لاک کریں',
      apply: 'لاگو کریں',
      process: 'پروسیس کریں',
      processing: 'پروسیسنگ جاری ہے...',
      done: 'مکمل ہو گیا',
      close: 'بند کریں',
      back: 'پیچھے',
      next: 'آگے',
      tryAgain: 'دوبارہ کوشش کریں',
      viewAll: 'سب دیکھیں',
      getStarted: 'مفت شروع کریں',
      upgradePlan: 'پلان اپ گریڈ کریں',
      downloadApk: 'APK ڈاؤن لوڈ کریں'
    },

    categories: {
      create: 'تخلیق اور ڈیزائن',
      convert: 'تبدیلی',
      edit: 'ترمیم',
      organize: 'صفحات ترتیب دیں',
      optimize: 'آپٹمائز اور OCR',
      security: 'سیکیورٹی اور دستخط',
      ai: 'مصنوعی ذہانت (AI)'
    },

    tools: {
      compress: 'PDF سائز کم کریں',
      merge: 'PDF یکجا کریں',
      convert: 'PDF تبدیل کریں',
      split: 'PDF الگ کریں',
      pdfToWord: 'PDF سے Word',
      wordToPdf: 'Word سے PDF',
      excelToPdf: 'Excel سے PDF',
      powerpointToPdf: 'PowerPoint سے PDF',
      imageToPdf: 'تصویر سے PDF',
      pdfToImage: 'PDF سے تصویر',
      ocr: 'OCR اور متن',
      translate: 'دستاویز کا ترجمہ',
      protect: 'پاس ورڈ سے محفوظ کریں',
      unlock: 'PDF ان لاک کریں',
      cameraScanner: 'کیمرہ اسکینر',
      editPdf: 'PDF متن کی ترمیم',
      organizePdf: 'صفحات کی ترتیب',
      digitalSign: 'ڈیجیٹل دستخط',
      summarizePdf: 'خلاصہ بنائیں',
      askAi: 'AI سے پوچھیں',
      watermark: 'واٹر مارک لگائیں',
      flatten: 'PDF فلیٹن کریں',
      createPdf: 'نئی PDF بنائیں',
      resumeBuilder: 'سی وی / ریسیوم بنائیں'
    },

    profile: {
      title: 'سیٹنگز اور ترجیحات',
      account: 'اکاؤنٹ پروفائل',
      planBilling: 'پلان اور بلنگ',
      preferencesTab: 'ترجیحات',
      securityTab: 'سیکیورٹی اور 2FA',
      storageTab: 'اسٹوریج اور پرائیویسی',
      sessionsTab: 'فعال سیشنز',
      appLanguage: 'ایپ کی زبان',
      appLanguageDesc: 'پوری ایپ کے لیے اپنی زبان منتخب کریں',
      twoStepVerification: 'دو مرحلہ وار تصدیق',
      twoStepVerificationDesc: 'TOTP ایپ سے اکاؤنٹ محفوظ کریں',
      autoRestoreSession: 'خودکار بحالی',
      autoRestoreSessionDesc: 'دوبارہ کھولنے پر ڈرافٹس خودکار بحال کریں',
      autoDelete: 'خودکار حذف',
      autoDeleteDesc: '24 گھنٹے بعد کیش صاف کریں',
      soundEffects: 'صوتی اثرات',
      textScaling: 'فونٹ کا سائز',
      exportData: 'ڈیٹا ایکسپورٹ کریں',
      exportDataDesc: 'پروفائل کی تفصیلات JSON میں ڈاؤن لوڈ کریں',
      activeSessions: 'فعال ڈیوائسز',
      revokeSessions: 'تمام سیشنز منسوخ کریں',
      dangerZone: 'خطرناک زون'
    },

    landing: {
      badge: 'پیشہ ورانہ کلاؤڈ PDF سوٹ',
      heroTitle: 'تیز اور محفوظ کام کے لیے PDF ٹولز',
      heroSubtitle: 'بینک گریڈ سیکیورٹی کے ساتھ PDF یکجا، تقسیم اور تبدیل کریں۔',
      startFree: 'مفت شروع کریں',
      exploreTools: 'تمام ٹولز دیکھیں',
      popularTools: 'مقبول PDF ٹولز',
      securityBadge: 'بینک گریڈ سیکیورٹی',
      securityTitle: 'نجی اور محفوظ',
      securityDesc: 'تمام پروسیسنگ براؤزر میموری میں محفوظ طریقے سے ہوتی ہے۔',
      pricingTitle: 'آسان قیمتیں',
      pricingSubtitle: 'اپنی ضرورت کے مطابق پلان منتخب کریں۔',
      faqTitle: 'بار بار پوچھے گئے سوالات'
    },

    twoFactor: {
      title: 'دو مرحلہ وار تصدیق',
      subtitle: 'سائن ان کرنے کے لیے 6 ہندسوں کا کوڈ درج کریں۔',
      enterCode: '6 ہندسوں کا سیکیورٹی کوڈ',
      useBackup: 'بیک اپ کوڈ استعمال کریں',
      useTotp: 'ایپ کوڈ استعمال کریں',
      verifying: 'تصدیق ہو رہی ہے...',
      invalidCode: 'ناقابل قبول کوڈ۔',
      validCode: 'کوڈ کی تصدیق ہو گئی!',
      enableSuccess: 'دو مرحلہ وار تصدیق فعال ہو گئی۔',
      backupCodesTitle: 'بیک اپ کوڈز محفوظ کریں',
      backupCodesDesc: 'فون گم ہونے کی صورت میں یہ کام آئیں گے۔'
    }
  },

  'Korean': {
    dashboard: '대시보드',
    documents: '내 문서',
    myDocuments: '내 문서',
    recent: '최근',
    settings: '설정',
    preferences: '기본 설정',
    billing: '요금제 및 결제',
    support: '지원 센터',
    search: '도구 검색...',
    searchTools: '30개 이상의 PDF 도구 검색...',
    upload: '파일 업로드',
    uploadFile: 'PDF 또는 문서 업로드',
    workspace: '작업 공간',
    admin: '관리자 콘솔',
    downloadApp: '앱 APK 다운로드',
    logout: '로그아웃',
    login: '로그인',
    signup: '회원가입',
    allTools: '모든 도구',
    home: '홈',
    pricing: '요금제',

    greeting: {
      morning: '좋은 아침입니다',
      afternoon: '좋은 오후입니다',
      evening: '좋은 저녁입니다'
    },

    actions: {
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      download: '다운로드',
      preview: '미리보기',
      edit: '편집',
      convert: '변환',
      compress: '압축',
      merge: '병합',
      split: '분할',
      extract: '추출',
      rotate: '회전',
      protect: '보호',
      unlock: '잠금 해제',
      apply: '적용',
      process: '처리',
      processing: '처리 중...',
      done: '완료',
      close: '닫기',
      back: '뒤로',
      next: '다음',
      tryAgain: '다시 시도',
      viewAll: '모두 보기',
      getStarted: '무료 시작하기',
      upgradePlan: '요금제 업그레이드',
      downloadApk: 'APK 다운로드'
    },

    categories: {
      create: '생성 및 디자인',
      convert: '변환',
      edit: '편집',
      organize: '페이지 정리',
      optimize: '최적화 및 OCR',
      security: '보안 및 서명',
      ai: '인공지능(AI)'
    },

    tools: {
      compress: 'PDF 압축',
      merge: 'PDF 병합',
      convert: 'PDF 변환',
      split: 'PDF 분할',
      pdfToWord: 'PDF를 Word로',
      wordToPdf: 'Word를 PDF로',
      excelToPdf: 'Excel을 PDF로',
      powerpointToPdf: 'PowerPoint를 PDF로',
      imageToPdf: '이미지를 PDF로',
      pdfToImage: 'PDF를 이미지로',
      ocr: 'OCR 및 텍스트',
      translate: '문서 번역',
      protect: '비밀번호 보호',
      unlock: 'PDF 잠금 해제',
      cameraScanner: '카메라 스캐너',
      editPdf: 'PDF 텍스트 편집',
      organizePdf: '페이지 구성',
      digitalSign: '디지털 서명',
      summarizePdf: 'PDF 요약',
      askAi: 'AI에게 질문',
      watermark: '워터마크 추가',
      flatten: 'PDF 평탄화',
      createPdf: '새 PDF 생성',
      resumeBuilder: '이력서 작성기'
    },

    profile: {
      title: '설정 및 환경설정',
      account: '계정 프로필',
      planBilling: '요금제 및 결제',
      preferencesTab: '기본 설정',
      securityTab: '보안 및 2단계 인증',
      storageTab: '저장소 및 개인정보',
      sessionsTab: '활성 세션',
      appLanguage: '앱 언어',
      appLanguageDesc: '전체 앱 인터페이스 언어 선택',
      twoStepVerification: '2단계 인증',
      twoStepVerificationDesc: 'TOTP 앱으로 계정 보호',
      autoRestoreSession: '자동 세션 복구',
      autoRestoreSessionDesc: '재접속 시 초안 자동 복구',
      autoDelete: '자동 삭제',
      autoDeleteDesc: '24시간 후 캐시 삭제',
      soundEffects: '효과음',
      textScaling: '텍스트 크기',
      exportData: '데이터 내보내기',
      exportDataDesc: '프로필 데이터를 JSON으로 다운로드',
      activeSessions: '활성 기기',
      revokeSessions: '모든 세션 해제',
      dangerZone: '위험 구역'
    },

    landing: {
      badge: '전문가용 클라우드 PDF 스위트',
      heroTitle: '더 빠르고 안전한 문서 작업을 위한 PDF 도구',
      heroSubtitle: '엔터프라이즈급 보안으로 PDF를 병합, 분할, 변환하세요.',
      startFree: '무료로 시작',
      exploreTools: '모든 도구 탐색',
      popularTools: '인기 PDF 도구',
      securityBadge: '엔터프라이즈 보안',
      securityTitle: '프라이빗 및 보안',
      securityDesc: '모든 처리는 브라우저 메모리에서 안전하게 이루어집니다.',
      pricingTitle: '간단한 요금제',
      pricingSubtitle: '필요에 맞는 요금제를 선택하세요.',
      faqTitle: '자주 묻는 질문',
      userTrust: '매주 1만 명 이상의 사용자가 신뢰합니다',
      popularAutomated: '인기 자동화 도구',
      featuresTitle: '필요한 모든 것',
      featuresSubtitle: '현대적인 문서 워크플로우를 위해 설계된 강력한 도구.',
      feat1Title: '자동화된 도구',
      feat1Desc: '자동화 시스템으로 문서를 즉시 요약하고 변환하세요.',
      feat2Title: '기본 보안',
      feat2Desc: '모든 민감한 파일을 위한 기업 수준의 암호화.',
      feat3Title: '초고속',
      feat3Desc: '몇 분이 아닌 몇 초 만에 대용량 파일을 변환하고 압축하세요.'
    },

    twoFactor: {
      title: '2단계 인증',
      subtitle: '로그인하려면 인증 앱의 6자리 코드를 입력하세요.',
      enterCode: '6자리 보안 코드',
      useBackup: '백업 코드 사용',
      useTotp: '인증 앱 코드 사용',
      verifying: '확인 중...',
      invalidCode: '잘못된 코드입니다.',
      validCode: '코드가 확인되었습니다!',
      enableSuccess: '2단계 인증이 활성화되었습니다.',
      backupCodesTitle: '백업 코드 저장',
      backupCodesDesc: '휴대폰을 분실했을 때 유용합니다.'
    }
  }
};

/**
 * Normalizes language name to a supported key
 */
export const normalizeLanguage = (lang?: string): string => {
  if (!lang) return 'English';
  const clean = lang.trim().toLowerCase();
  
  // Exact name and ISO code matches first to avoid false substring collisions (e.g. 'bengali' containing 'eng')
  if (clean === 'english' || clean === 'en' || clean === 'en-us' || clean === 'en-gb') return 'English';
  if (clean === 'spanish' || clean === 'es' || clean === 'es-es' || clean === 'es-mx') return 'Spanish';
  if (clean === 'french' || clean === 'fr' || clean === 'fr-fr' || clean === 'fr-ca') return 'French';
  if (clean === 'german' || clean === 'de' || clean === 'de-de' || clean === 'de-at') return 'German';
  if (clean === 'hindi' || clean === 'hi' || clean === 'hi-in') return 'Hindi';
  if (clean === 'japanese' || clean === 'ja' || clean === 'ja-jp') return 'Japanese';
  if (clean === 'chinese' || clean === 'zh' || clean === 'zh-cn' || clean === 'zh-tw') return 'Chinese';
  if (clean === 'portuguese' || clean === 'pt' || clean === 'pt-br' || clean === 'pt-pt') return 'Portuguese';
  if (clean === 'russian' || clean === 'ru' || clean === 'ru-ru') return 'Russian';
  if (clean === 'italian' || clean === 'it' || clean === 'it-it') return 'Italian';
  if (clean === 'arabic' || clean === 'ar' || clean === 'ar-sa') return 'Arabic';
  if (clean === 'korean' || clean === 'ko' || clean === 'ko-kr') return 'Korean';
  if (clean === 'marathi' || clean === 'mr' || clean === 'mr-in') return 'Marathi';
  if (clean === 'telugu' || clean === 'te' || clean === 'te-in') return 'Telugu';
  if (clean === 'tamil' || clean === 'ta' || clean === 'ta-in') return 'Tamil';
  if (clean === 'gujarati' || clean === 'gu' || clean === 'gu-in') return 'Gujarati';
  if (clean === 'urdu' || clean === 'ur' || clean === 'ur-pk') return 'Urdu';

  // Substring checks in priority order
  if (clean.includes('span') || clean.includes('espa') || clean.startsWith('es')) return 'Spanish';
  if (clean.includes('fren') || clean.includes('fran') || clean.startsWith('fr')) return 'French';
  if (clean.includes('germ') || clean.includes('deut') || clean.startsWith('de')) return 'German';
  if (clean.includes('hind') || clean.startsWith('hi')) return 'Hindi';
  if (clean.includes('japan') || clean.includes('nihon') || clean.startsWith('ja')) return 'Japanese';
  if (clean.includes('chin') || clean.includes('zhong') || clean.startsWith('zh')) return 'Chinese';
  if (clean.includes('port') || clean.startsWith('pt')) return 'Portuguese';
  if (clean.includes('russ') || clean.startsWith('ru')) return 'Russian';
  if (clean.includes('ital') || clean.startsWith('it')) return 'Italian';
  if (clean.includes('arab') || clean.startsWith('ar')) return 'Arabic';
  if (clean.includes('kore') || clean.includes('hang') || clean.startsWith('ko')) return 'Korean';
  if (clean.includes('mara') || clean.startsWith('mr')) return 'Marathi';
  if (clean.includes('telu') || clean.startsWith('te')) return 'Telugu';
  if (clean.includes('tami') || clean.startsWith('ta')) return 'Tamil';
  if (clean.includes('guja') || clean.startsWith('gu')) return 'Gujarati';
  if (clean.includes('urdu') || clean.startsWith('ur')) return 'Urdu';
  if (clean.includes('eng') || clean.startsWith('en')) return 'English';

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
 * Extended localized definitions for tool names and descriptions across languages
 */
const TOOL_NAME_TRANSLATIONS: Record<string, Record<string, { name?: string; description?: string }>> = {
  Spanish: {
    'create-document': { name: 'Crear Documento', description: 'Crear un nuevo documento desde cero o texto plano.' },
    'create-pdf': { name: 'Crear PDF', description: 'Generar un nuevo documento PDF.' },
    'resume-builder': { name: 'Creador de CV', description: 'Crea currículums profesionales fácilmente.' },
    'letter-templates': { name: 'Plantillas de Cartas', description: 'Usa plantillas predefinidas para cartas.' },
    'invoice-creator': { name: 'Creador de Facturas', description: 'Genera facturas profesionales.' },
    'certificate-creator': { name: 'Creador de Certificados', description: 'Diseña y crea certificados personalizados.' },
    'form-creator': { name: 'Creador de Formularios', description: 'Construye formularios PDF interactivos.' },
    'camera-scanner': { name: 'Escáner de Cámara', description: 'Escanea documentos directamente con tu cámara.' },
    'batch-scanner': { name: 'Escáner por Lotes', description: 'Escanea múltiples páginas a la vez.' },
    'text-to-pdf': { name: 'Texto → PDF', description: 'Convierte texto plano a formato PDF.' },
    'word-to-pdf': { name: 'Word → PDF', description: 'Convierte archivos DOCX a PDF.' },
    'excel-to-pdf': { name: 'Excel → PDF', description: 'Convierte hojas de cálculo a PDF.' },
    'powerpoint-to-pdf': { name: 'PowerPoint → PDF', description: 'Convierte presentaciones PPTX a PDF.' },
    'image-to-pdf': { name: 'Imagen → PDF', description: 'Convierte imágenes JPG o PNG a PDF.' },
    'pdf-to-word': { name: 'PDF → Word', description: 'Convierte PDF a Word editable.' },
    'pdf-to-excel': { name: 'PDF → Excel', description: 'Convierte tablas PDF a hojas de Excel.' },
    'pdf-to-powerpoint': { name: 'PDF → PowerPoint', description: 'Convierte PDF a presentaciones PowerPoint.' },
    'pdf-to-text': { name: 'PDF → Texto', description: 'Extrae texto plano de documentos PDF.' },
    'pdf-to-image': { name: 'PDF → Imagen', description: 'Convierte páginas de PDF en imágenes.' },
    'edit-pdf-text': { name: 'Editar Texto PDF', description: 'Edita el texto existente dentro de tu PDF.' },
    'merge-pdf': { name: 'Unir PDF', description: 'Combina múltiples archivos PDF en uno solo.' },
    'split-pdf': { name: 'Dividir PDF', description: 'Separa páginas o rangos de un archivo PDF.' },
    'extract-pages': { name: 'Extraer Páginas', description: 'Extrae páginas específicas de un PDF.' },
    'delete-pages': { name: 'Eliminar Páginas', description: 'Elimina páginas innecesarias del documento.' },
    'rotate-pages': { name: 'Rotar Páginas', description: 'Gira las páginas a la orientación correcta.' },
    'ocr-pdf': { name: 'OCR Básico', description: 'Convierte PDFs escaneados en texto buscable.' },
    'summarize-pdf': { name: 'Resumir PDF con IA', description: 'Obtén un resumen automático del documento.' },
    'ask-questions': { name: 'Preguntar al PDF', description: 'Chatea con tu documento usando IA.' },
    'compress-pdf': { name: 'Compresión PDF', description: 'Reduce el tamaño manteniendo alta calidad.' },
    'protect-pdf': { name: 'Proteger con Contraseña', description: 'Añade una contraseña para proteger tu PDF.' },
    'remove-password': { name: 'Quitar Contraseña', description: 'Elimina la protección por contraseña.' },
    'digital-signatures': { name: 'Firmas Digitales', description: 'Firma tus documentos digitalmente.' }
  },
  French: {
    'create-document': { name: 'Créer un Document', description: 'Créer un nouveau document à partir de zéro.' },
    'create-pdf': { name: 'Créer un PDF', description: 'Générer un nouveau document PDF.' },
    'resume-builder': { name: 'Créateur de CV', description: 'Créez des CV professionnels rapidement.' },
    'camera-scanner': { name: 'Scanner Appareil Photo', description: 'Numérisez des documents directement via la caméra.' },
    'text-to-pdf': { name: 'Texte → PDF', description: 'Convertir du texte brut au format PDF.' },
    'word-to-pdf': { name: 'Word → PDF', description: 'Convertir des fichiers DOCX en PDF.' },
    'excel-to-pdf': { name: 'Excel → PDF', description: 'Convertir des feuilles de calcul en PDF.' },
    'image-to-pdf': { name: 'Image → PDF', description: 'Convertir des images JPG ou PNG en PDF.' },
    'pdf-to-word': { name: 'PDF → Word', description: 'Convertir des fichiers PDF en Word modifiable.' },
    'pdf-to-image': { name: 'PDF → Image', description: 'Convertir des pages PDF en images.' },
    'edit-pdf-text': { name: 'Modifier le Texte PDF', description: 'Modifiez le texte dans vos documents PDF.' },
    'merge-pdf': { name: 'Fusionner PDF', description: 'Combinez plusieurs fichiers PDF en un seul.' },
    'split-pdf': { name: 'Diviser PDF', description: 'Séparez ou extrayez des pages d’un PDF.' },
    'delete-pages': { name: 'Supprimer des Pages', description: 'Supprimez les pages inutiles de votre PDF.' },
    'rotate-pages': { name: 'Pivoter des Pages', description: 'Orientez correctement les pages de votre PDF.' },
    'ocr-pdf': { name: 'OCR & Extraction', description: 'Rendez les PDF scannés recherchables.' },
    'summarize-pdf': { name: 'Résumer le PDF', description: 'Obtenez un résumé automatique grâce à l’IA.' },
    'ask-questions': { name: 'Poser des Questions', description: 'Discutez directement avec votre document.' },
    'compress-pdf': { name: 'Compresser PDF', description: 'Réduisez la taille sans perdre en qualité.' },
    'protect-pdf': { name: 'Protéger par Mot de Passe', description: 'Ajoutez un mot de passe à votre PDF.' },
    'remove-password': { name: 'Déverrouiller PDF', description: 'Supprimez la protection par mot de passe.' },
    'digital-signatures': { name: 'Signatures Numériques', description: 'Signez numériquement vos documents.' }
  },
  German: {
    'create-document': { name: 'Dokument erstellen', description: 'Erstellen Sie ein neues Dokument aus Text.' },
    'create-pdf': { name: 'PDF erstellen', description: 'Neues PDF-Dokument generieren.' },
    'resume-builder': { name: 'Lebenslauf-Generator', description: 'Professionelle Lebensläufe erstellen.' },
    'camera-scanner': { name: 'Kamera-Scanner', description: 'Dokumente direkt mit der Kamera scannen.' },
    'word-to-pdf': { name: 'Word → PDF', description: 'DOCX-Dateien in PDF umwandeln.' },
    'image-to-pdf': { name: 'Bild → PDF', description: 'JPG- oder PNG-Bilder in PDF umwandeln.' },
    'pdf-to-word': { name: 'PDF → Word', description: 'PDFs in bearbeitbare Word-Dateien umwandeln.' },
    'edit-pdf-text': { name: 'PDF-Text bearbeiten', description: 'Text direkt im PDF-Dokument bearbeiten.' },
    'merge-pdf': { name: 'PDF zusammenfügen', description: 'Mehrere PDFs in eine Datei zusammenführen.' },
    'split-pdf': { name: 'PDF teilen', description: 'Seiten aus einer PDF-Datei herauslösen.' },
    'ocr-pdf': { name: 'OCR-Texterkennung', description: 'Gescannte Dokumente durchsuchbar machen.' },
    'summarize-pdf': { name: 'PDF zusammenfassen', description: 'KI-Zusammenfassung Ihres Dokuments.' },
    'compress-pdf': { name: 'PDF komprimieren', description: 'Dateigröße bei hoher Qualität reduzieren.' },
    'protect-pdf': { name: 'Passwortschutz', description: 'Schützen Sie Ihr PDF mit einem Passwort.' },
    'digital-signatures': { name: 'Digitale Signatur', description: 'Dokumente digital unterschreiben.' }
  },
  Hindi: {
    'create-document': { name: 'डॉक्यूमेंट बनाएं', description: 'शुरुआत से नया डॉक्यूमेंट बनाएं।' },
    'create-pdf': { name: 'PDF बनाएं', description: 'नया PDF डॉक्यूमेंट बनाएं।' },
    'resume-builder': { name: 'रेज़्यूमे बिल्डर', description: 'प्रोफेशनल रेज़्यूमे बनाएं।' },
    'camera-scanner': { name: 'कैमरा स्कैनर', description: 'कैमरे से सीधे डॉक्यूमेंट स्कैन करें।' },
    'text-to-pdf': { name: 'टेक्स्ट → PDF', description: 'सादे टेक्स्ट को PDF में बदलें।' },
    'word-to-pdf': { name: 'Word → PDF', description: 'Word फाइलों को PDF में बदलें।' },
    'excel-to-pdf': { name: 'Excel → PDF', description: 'एक्सेल शीट्स को PDF में बदलें।' },
    'image-to-pdf': { name: 'इमेज → PDF', description: 'फोटो (JPG/PNG) को PDF में बदलें।' },
    'pdf-to-word': { name: 'PDF → Word', description: 'PDF को एडिटेबल वर्ड फाइल में बदलें।' },
    'pdf-to-image': { name: 'PDF → इमेज', description: 'PDF पेजों को फोटो में बदलें।' },
    'edit-pdf-text': { name: 'PDF टेक्स्ट एडिट करें', description: 'PDF के अंदर मौजूद टेक्स्ट बदलें।' },
    'merge-pdf': { name: 'PDF जोड़ें (Merge)', description: 'कई PDF फाइलों को एक में मिलाएं।' },
    'split-pdf': { name: 'PDF अलग करें (Split)', description: 'PDF पेजों को अलग-अलग करें।' },
    'ocr-pdf': { name: 'OCR टेक्स्ट एक्सट्रैक्ट', description: 'स्कैन किए गए PDF से टेक्स्ट निकालें।' },
    'summarize-pdf': { name: 'PDF सारांश (AI)', description: 'AI द्वारा डॉक्यूमेंट का त्वरित सारांश पाएं।' },
    'ask-questions': { name: 'PDF से सवाल पूछें', description: 'अपने डॉक्यूमेंट के साथ AI से चैट करें।' },
    'compress-pdf': { name: 'PDF कंप्रेस करें', description: 'गुणवत्ता बनाए रखते हुए साइज छोटा करें।' },
    'protect-pdf': { name: 'पासवर्ड लगाएं', description: 'PDF पर सुरक्षा पासवर्ड लगाएं।' },
    'remove-password': { name: 'पासवर्ड हटाएं', description: 'सुरक्षित PDF से पासवर्ड हटाएं।' },
    'digital-signatures': { name: 'डिजिटल हस्ताक्षर', description: 'डॉक्यूमेंट पर डिजिटल साइन करें।' }
  },
  Japanese: {
    'create-document': { name: 'ドキュメント作成', description: 'ゼロから新しいドキュメントを作成します。' },
    'create-pdf': { name: 'PDF作成', description: '新規PDFドキュメントを生成します。' },
    'resume-builder': { name: '履歴書作成', description: 'プロフェッショナルな履歴書を簡単作成。' },
    'camera-scanner': { name: 'カメラ一発スキャン', description: 'カメラで直接書類をスキャンします。' },
    'word-to-pdf': { name: 'Word → PDF', description: 'DOCXファイルをPDFに変換します。' },
    'image-to-pdf': { name: '画像 → PDF', description: 'JPG/PNG画像をPDFに変換します。' },
    'pdf-to-word': { name: 'PDF → Word', description: 'PDFを編集可能なWord文書に変換。' },
    'edit-pdf-text': { name: 'PDFテキスト編集', description: 'PDF内のテキストを直接編集します。' },
    'merge-pdf': { name: 'PDF結合', description: '複数のPDFを1つのファイルに結合。' },
    'split-pdf': { name: 'PDF分割', description: 'PDFから特定のページを抽出・分割。' },
    'ocr-pdf': { name: 'OCR文字認識', description: 'スキャンPDFを検索可能なテキストに変換。' },
    'summarize-pdf': { name: 'AI要約', description: 'AIがドキュメントを即座に要約します。' },
    'compress-pdf': { name: 'PDF圧縮', description: '高画質を保ったまま容量を削減。' },
    'protect-pdf': { name: 'パスワード保護', description: 'PDFに暗号化パスワードを設定します。' },
    'digital-signatures': { name: '電子署名', description: '文書にデジタル署名を追加します。' }
  },
  Chinese: {
    'create-document': { name: '新建文档', description: '从空白或文本创建新文档。' },
    'create-pdf': { name: '生成 PDF', description: '新建标准 PDF 文档。' },
    'resume-builder': { name: '简历生成器', description: '快速构建专业求职简历。' },
    'camera-scanner': { name: '相机扫描', description: '用手机相机直接扫描纸质文件。' },
    'word-to-pdf': { name: 'Word 转 PDF', description: '将 DOCX 转换成 PDF。' },
    'image-to-pdf': { name: '图片转 PDF', description: '将 JPG/PNG 图片转为 PDF。' },
    'pdf-to-word': { name: 'PDF 转 Word', description: '将 PDF 转为可编辑的 Word。' },
    'edit-pdf-text': { name: '编辑 PDF 文本', description: '直接修改 PDF 内的原有文本。' },
    'merge-pdf': { name: '合并 PDF', description: '把多个 PDF 拼接成一个文件。' },
    'split-pdf': { name: '拆分 PDF', description: '按页码拆分或提取 PDF 页面。' },
    'ocr-pdf': { name: 'OCR 识别', description: '提取扫描件中的文字内容。' },
    'summarize-pdf': { name: 'AI 总结 PDF', description: '使用 AI 智能提取文档摘要。' },
    'compress-pdf': { name: '压缩 PDF', description: '高保真减小 PDF 文件体积。' },
    'protect-pdf': { name: '设置密码', description: '给 PDF 添加安全密码保护。' },
    'digital-signatures': { name: '电子签名', description: '给 PDF 文档添加数字签名。' }
  },
  Portuguese: {
    'create-document': { name: 'Criar Documento', description: 'Crie um novo documento a partir do zero.' },
    'create-pdf': { name: 'Criar PDF', description: 'Gere um novo documento PDF.' },
    'resume-builder': { name: 'Criador de Currículos', description: 'Crie currículos profissionais com facilidade.' },
    'camera-scanner': { name: 'Escâner de Câmera', description: 'Digitalize documentos diretamente com a câmera.' },
    'word-to-pdf': { name: 'Word → PDF', description: 'Converta arquivos DOCX para PDF.' },
    'image-to-pdf': { name: 'Imagem → PDF', description: 'Converta imagens JPG ou PNG para PDF.' },
    'pdf-to-word': { name: 'PDF → Word', description: 'Converta PDF para Word editável.' },
    'edit-pdf-text': { name: 'Editar Texto do PDF', description: 'Modifique o texto existente no seu PDF.' },
    'merge-pdf': { name: 'Juntar PDF', description: 'Combine vários PDFs em um único arquivo.' },
    'split-pdf': { name: 'Dividir PDF', description: 'Separe páginas de um documento PDF.' },
    'ocr-pdf': { name: 'OCR e Reconhecimento', description: 'Torne PDFs digitalizados pesquisáveis.' },
    'summarize-pdf': { name: 'Resumir PDF com IA', description: 'Obtenha um resumo automático do documento.' },
    'compress-pdf': { name: 'Comprimir PDF', description: 'Reduza o tamanho do arquivo sem perder qualidade.' },
    'protect-pdf': { name: 'Proteger com Senha', description: 'Adicione uma senha de proteção ao PDF.' },
    'digital-signatures': { name: 'Assinatura Digital', description: 'Assine seus documentos digitalmente.' }
  },
  Russian: {
    'create-document': { name: 'Создать документ', description: 'Создать новый документ с нуля.' },
    'create-pdf': { name: 'Создать PDF', description: 'Сгенерировать новый PDF файл.' },
    'resume-builder': { name: 'Конструктор резюме', description: 'Создание профессиональных резюме.' },
    'camera-scanner': { name: 'Камера-сканер', description: 'Сканирование документов через камеру.' },
    'word-to-pdf': { name: 'Word → PDF', description: 'Конвертация DOCX в формат PDF.' },
    'image-to-pdf': { name: 'Изображение → PDF', description: 'Конвертация картинок JPG/PNG в PDF.' },
    'pdf-to-word': { name: 'PDF → Word', description: 'Конвертация PDF в редактируемый Word.' },
    'edit-pdf-text': { name: 'Редактировать текст PDF', description: 'Изменение текста внутри PDF файла.' },
    'merge-pdf': { name: 'Объединить PDF', description: 'Слияние нескольких PDF в один.' },
    'split-pdf': { name: 'Разделить PDF', description: 'Извлечение и разделение страниц.' },
    'ocr-pdf': { name: 'Распознавание OCR', description: 'Преобразование сканов в текстовый PDF.' },
    'summarize-pdf': { name: 'Суммаризация ИИ', description: 'Быстрое краткое содержание с помощью ИИ.' },
    'compress-pdf': { name: 'Сжать PDF', description: 'Уменьшение размера файла без потери качества.' },
    'protect-pdf': { name: 'Защитить паролем', description: 'Установка пароля на PDF документ.' },
    'digital-signatures': { name: 'Цифровая подпись', description: 'Подписание документов цифровой подписью.' }
  },
  Korean: {
    'create-document': { name: '새 문서 만들기', description: '텍스트 기반의 새 문서를 작성합니다.' },
    'create-pdf': { name: 'PDF 생성', description: '새로운 PDF 문서를 생성합니다.' },
    'resume-builder': { name: '이력서 작성기', description: '전문적인 이력서를 빠르게 제작합니다.' },
    'camera-scanner': { name: '카메라 스캐너', description: '카메라로 즉시 문서 스캔.' },
    'word-to-pdf': { name: 'Word → PDF', description: 'DOCX 파일을 PDF로 변환합니다.' },
    'image-to-pdf': { name: '이미지 → PDF', description: 'JPG/PNG 이미지를 PDF로 변환합니다.' },
    'pdf-to-word': { name: 'PDF → Word', description: 'PDF를 편집 가능한 Word 문서로 변환.' },
    'edit-pdf-text': { name: 'PDF 텍스트 편집', description: 'PDF 내부의 기존 텍스트를 수정합니다.' },
    'merge-pdf': { name: 'PDF 병합', description: '여러 개의 PDF를 하나의 파일로 합칩니다.' },
    'split-pdf': { name: 'PDF 분할', description: '원하는 페이지를 추출하여 분할합니다.' },
    'ocr-pdf': { name: 'OCR 텍스트 추출', description: '스캔된 PDF에서 검색 가능한 텍스트 추출.' },
    'summarize-pdf': { name: 'AI 요약', description: '문서의 주요 내용을 AI로 자동 요약합니다.' },
    'compress-pdf': { name: 'PDF 압축', description: '고화질을 유지하며 파일 용량을 줄입니다.' },
    'protect-pdf': { name: '비밀번호 암호화', description: 'PDF 문서에 암호를 설정합니다.' },
    'digital-signatures': { name: '전자 서명', description: '문서에 디지털 서명을 첨부합니다.' }
  },
  Arabic: {
    'create-document': { name: 'إنشاء مستند', description: 'إنشاء مستند جديد من الصفر.' },
    'create-pdf': { name: 'إنشاء PDF', description: 'توليد ملف PDF جديد.' },
    'resume-builder': { name: 'منشئ السيرة الذاتية', description: 'إنشاء سيرة ذاتية احترافية بسهولة.' },
    'camera-scanner': { name: 'ماسح الكاميرا', description: 'مسح المستندات ضوئياً عبر كاميرا الهاتف.' },
    'word-to-pdf': { name: 'Word إلى PDF', description: 'تحويل ملفات Word إلى صيغة PDF.' },
    'image-to-pdf': { name: 'صورة إلى PDF', description: 'تحويل صور JPG/PNG إلى ملف PDF.' },
    'pdf-to-word': { name: 'PDF إلى Word', description: 'تحويل PDF إلى ملف Word قابل للتعديل.' },
    'edit-pdf-text': { name: 'تعديل نص PDF', description: 'تعديل النصوص داخل ملف PDF.' },
    'merge-pdf': { name: 'دمج ملفات PDF', description: 'دمج عدة ملفات PDF في ملف واحد.' },
    'split-pdf': { name: 'تقسيم PDF', description: 'فصل صفحات ملف PDF بسهولة.' },
    'ocr-pdf': { name: 'التعرف الضوئي OCR', description: 'استخراج النصوص من الصور والمستندات.' },
    'summarize-pdf': { name: 'تلخيص المستند بالذكاء الاصطناعي', description: 'الحصول على ملخص سريع بالذكاء الاصطناعي.' },
    'compress-pdf': { name: 'ضغط PDF', description: 'تقليل حجم الملف مع الحفاظ على الجودة.' },
    'protect-pdf': { name: 'حماية بكلمة سر', description: 'إضافة كلمة مرور لحماية الملف.' },
    'digital-signatures': { name: 'التوقيع الرقمي', description: 'توقيع المستندات إلكترونياً.' }
  }
};

/**
 * Translates a tool object dynamically according to the selected language
 */
export function translateTool<T extends { id: string; name: string; description: string }>(tool: T, lang?: string): T {
  const normalized = normalizeLanguage(lang);
  const dict = TRANSLATIONS[normalized] || TRANSLATIONS['English'];

  // Check custom override dictionary first
  const langOverrides = TOOL_NAME_TRANSLATIONS[normalized];
  if (langOverrides && langOverrides[tool.id]) {
    const override = langOverrides[tool.id];
    return {
      ...tool,
      name: override.name || tool.name,
      description: override.description || tool.description
    };
  }

  // Fallback map using general dictionary keys
  const toolNameMap: Record<string, string | undefined> = {
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
 * Context for global language management
 */
interface LanguageContextType {
  currentLanguage: string;
  t: (key: string, fallback?: string) => string;
  changeLanguage: (newLang: string) => void;
  translateTool: <T extends { id: string; name: string; description: string }>(tool: T) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode, initialLanguage?: string }> = ({ children, initialLanguage }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pref_language');
      if (saved) return normalizeLanguage(saved);
    }
    if (initialLanguage) return normalizeLanguage(initialLanguage);
    return 'English';
  });

  useEffect(() => {
    if (initialLanguage && typeof window !== 'undefined') {
      const normalizedInitial = normalizeLanguage(initialLanguage);
      if (normalizedInitial !== currentLanguage && !localStorage.getItem('pref_language')) {
        setCurrentLanguage(normalizedInitial);
      }
    }
  }, [initialLanguage]);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e.detail || localStorage.getItem('pref_language') || 'English';
      const normalized = normalizeLanguage(newLang);
      if (normalized !== currentLanguage) {
        setCurrentLanguage(normalized);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pref_language' && e.newValue) {
        const normalized = normalizeLanguage(e.newValue);
        if (normalized !== currentLanguage) {
          setCurrentLanguage(normalized);
        }
      }
    };

    window.addEventListener('paperx_language_changed', handleLangChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('paperx_language_changed', handleLangChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentLanguage]);

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const changeLanguage = (newLang: string) => {
    const normalized = normalizeLanguage(newLang);
    setCurrentLanguage(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pref_language', normalized);
      window.dispatchEvent(new CustomEvent('paperx_language_changed', { detail: normalized }));
    }
  };

  const value = {
    currentLanguage,
    t,
    changeLanguage,
    translateTool: (tool: any) => translateTool(tool, currentLanguage)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      currentLanguage: 'English',
      t: (key: string, fallback?: string) => getTranslation('English', key, fallback),
      changeLanguage: () => {},
      translateTool: (tool: any) => tool
    };
  }
  return context;
};

/**
 * Reactive React hook that listens to language changes and provides dynamic translation function
 */
export function useAppTranslation(userLang?: string) {
  const context = useContext(LanguageContext);
  const prevUserLangRef = useRef<string | undefined>(userLang);

  useEffect(() => {
    if (context && userLang && userLang !== prevUserLangRef.current) {
      prevUserLangRef.current = userLang;
      const normalized = normalizeLanguage(userLang);
      if (normalized && normalized !== context.currentLanguage) {
        context.changeLanguage(normalized);
      }
    }
  }, [userLang, context]);
  
  // Local fallback state (always declared unconditionally at top level)
  const [localLanguage, setLocalLanguage] = useState<string>(() => {
    return userLang ? normalizeLanguage(userLang) : (typeof window !== 'undefined' ? normalizeLanguage(localStorage.getItem('pref_language') || 'English') : 'English');
  });

  useEffect(() => {
    if (context) return;

    if (userLang && userLang !== localLanguage) {
      setLocalLanguage(normalizeLanguage(userLang));
    }
  }, [userLang, context, localLanguage]);

  useEffect(() => {
    if (context) return;

    const handleLangChange = (e: any) => {
      const newLang = e.detail || localStorage.getItem('pref_language') || 'English';
      const normalized = normalizeLanguage(newLang);
      if (normalized !== localLanguage) {
        setLocalLanguage(normalized);
      }
    };

    window.addEventListener('paperx_language_changed', handleLangChange);
    window.addEventListener('storage', handleLangChange);

    return () => {
      window.removeEventListener('paperx_language_changed', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, [context, localLanguage]);

  if (context) {
    return context;
  }

  const t = (key: string, fallback?: string) => getTranslation(localLanguage, key, fallback);

  const changeLanguage = (newLang: string) => {
    const normalized = normalizeLanguage(newLang);
    setLocalLanguage(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pref_language', normalized);
      window.dispatchEvent(new CustomEvent('paperx_language_changed', { detail: normalized }));
    }
  };

  return {
    t,
    currentLanguage: localLanguage,
    changeLanguage,
    translateTool: (tool: any) => translateTool(tool, localLanguage)
  };
}
