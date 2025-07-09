import { User, Transaction, Account, VerificationStep } from "@shared/schema";
import { EmailNotificationType } from "@shared/types";
import axios from 'axios';

// Dictionnaire de traductions pour les emails
const emailTranslations = {
  fr: {
    // Général
    appName: 'EuroNova',
    tagline: 'Votre partenaire bancaire',
    buttonAccessAccount: 'Accéder à mon compte',
    buttonContactSupport: 'Contacter le support',
    footerAutomatedMsg: 'Ce message est automatique, merci de ne pas y répondre.',
    allRightsReserved: 'Tous droits réservés.',
    greeting: (firstName: string, lastName: string) => `Cher(e) <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Notification de transaction',
    transactionCredit: 'Crédit',
    transactionDebit: 'Débit',
    transactionInfo: 'Nous vous informons qu\'une transaction a été effectuée sur votre compte.',
    transactionWarning: 'Si vous n\'êtes pas à l\'origine de cette transaction, veuillez contacter immédiatement notre service client.',
    transactionType: 'Type:',
    transactionAmount: 'Montant:',
    transactionDate: 'Date:',
    transactionDescription: 'Description:',
    noDescription: 'Aucune description',
    dateNotAvailable: 'Date non disponible',
    currentBalance: 'Votre solde actuel est de',
    
    // Reminders
    paymentReminder: 'Rappel de paiement',
    stepPaymentRequired: 'Un paiement est requis pour avancer dans votre processus de vérification.',
    currentStep: 'Étape actuelle:',
    amountDue: 'Montant dû:',
    paymentInstructions: 'Veuillez effectuer un virement bancaire avec les détails suivants:',
    beneficiaryName: 'Nom du bénéficiaire:',
    accountNumber: 'Numéro de compte:',
    paymentReference: 'Référence:',
    paymentHelp: 'Après avoir effectué le paiement, veuillez nous envoyer une preuve de paiement pour accélérer la validation.',
    
    // Status
    accountStatus: 'Statut du compte',
    accountActivated: 'Compte activé',
    accountDeactivated: 'Compte désactivé',
    accountActivatedMessage: 'Vous pouvez maintenant profiter de tous les services d\'EuroNova.',
    accountDeactivatedMessage: 'Pour plus d\'informations ou pour réactiver votre compte, veuillez contacter notre service client.',
    accountStatusUpdate: 'Mise à jour du statut de votre compte',
    accountActivationMsg: 'Nous avons le plaisir de vous informer que votre compte a été activé. Vous pouvez maintenant accéder à toutes les fonctionnalités de notre plateforme.',
    accountDeactivationMsg: 'Nous sommes au regret de vous informer que votre compte a été désactivé. Veuillez contacter notre service client pour plus d\'informations.',
    
    // Welcome
    welcomeTitle: 'Bienvenue chez EuroNova',
    welcomeSubject: 'Vos informations confidentielles',
    welcomeMessage: 'Bienvenue chez EuroNova ! Nous sommes ravis de vous compter parmi nos clients.',
    trustedBankingPartner: 'Votre partenaire bancaire de confiance',
    accountCreated: 'Votre compte a été créé avec succès! Voici vos informations d\'identification :',
    accessCredentials: 'Voici vos identifiants d\'accès:',
    clientIdLabel: 'ID Client :',
    passwordLabel: 'Mot de passe :',
    accountNumberLabel: 'RIB :',
    cardInfoLabel: 'Informations de carte bancaire :',
    cardNumberLabel: 'Numéro de carte :',
    cardExpiryDateLabel: 'Date d\'expiration :',
    cardCvvLabel: 'CVV :',
    securityWarning: 'Conservez ces informations précieusement et ne les partagez avec personne.',
    loginInvite: 'Vous pouvez dès maintenant vous connecter à votre espace client pour découvrir nos services.',
    confidentialInfo: 'Ce message contient des informations confidentielles. Merci de ne pas y répondre.',
  },
  en: {
    // General
    appName: 'EuroNova',
    tagline: 'Your banking partner',
    buttonAccessAccount: 'Access my account',
    buttonContactSupport: 'Contact Support',
    footerAutomatedMsg: 'This is an automated message, please do not reply.',
    allRightsReserved: 'All rights reserved.',
    greeting: (firstName: string, lastName: string) => `Dear <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Transaction Notification',
    transactionCredit: 'Credit',
    transactionDebit: 'Debit',
    transactionInfo: 'We inform you that a transaction has been made on your account.',
    transactionWarning: 'If you did not initiate this transaction, please contact our customer service immediately.',
    transactionType: 'Type:',
    transactionAmount: 'Amount:',
    transactionDate: 'Date:',
    transactionDescription: 'Description:',
    noDescription: 'No description',
    dateNotAvailable: 'Date not available',
    currentBalance: 'Your current balance is',
    
    // Reminders
    paymentReminder: 'Payment Reminder',
    stepPaymentRequired: 'A payment is required to proceed with your verification process.',
    currentStep: 'Current step:',
    amountDue: 'Amount due:',
    paymentInstructions: 'Please make a bank transfer with the following details:',
    beneficiaryName: 'Beneficiary name:',
    accountNumber: 'Account number:',
    paymentReference: 'Reference:',
    paymentHelp: 'After making the payment, please send us proof of payment to expedite the validation.',
    
    // Status
    accountStatus: 'Account Status',
    accountActivated: 'Account Activated',
    accountDeactivated: 'Account Deactivated',
    accountActivatedMessage: 'You can now enjoy all EuroNova services.',
    accountDeactivatedMessage: 'For more information or to reactivate your account, please contact our customer service.',
    accountStatusUpdate: 'Account Status Update',
    accountActivationMsg: 'We are pleased to inform you that your account has been activated. You can now access all the features of our platform.',
    accountDeactivationMsg: 'We regret to inform you that your account has been deactivated. Please contact our customer service for more information.',
    
    // Welcome
    welcomeTitle: 'Welcome to EuroNova',
    welcomeSubject: 'Your confidential information',
    welcomeMessage: 'Welcome to EuroNova! We are delighted to have you as our customer.',
    trustedBankingPartner: 'Your trusted banking partner',
    accountCreated: 'Your account has been successfully created. Here is your identification information:',
    accessCredentials: 'Here are your access credentials:',
    clientIdLabel: 'Client ID:',
    passwordLabel: 'Password:',
    accountNumberLabel: 'Account Number:',
    cardInfoLabel: 'Bank card information:',
    cardNumberLabel: 'Card number:',
    cardExpiryDateLabel: 'Expiry date:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'Keep this information confidential and do not share it with anyone.',
    loginInvite: 'You can now log in to your client area to discover our services.',
    confidentialInfo: 'This message contains confidential information. Please do not reply.',
  },
  es: {
    // General
    appName: 'EuroNova',
    tagline: 'Su socio bancario',
    buttonAccessAccount: 'Acceder a mi cuenta',
    buttonContactSupport: 'Contactar con soporte',
    footerAutomatedMsg: 'Este es un mensaje automático, por favor no responda.',
    allRightsReserved: 'Todos los derechos reservados.',
    greeting: (firstName: string, lastName: string) => `Estimado/a <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Notificación de transacción',
    transactionCredit: 'Crédito',
    transactionDebit: 'Débito',
    transactionInfo: 'Le informamos que se ha realizado una transacción en su cuenta.',
    transactionWarning: 'Si no inició esta transacción, póngase en contacto con nuestro servicio de atención al cliente inmediatamente.',
    transactionType: 'Tipo:',
    transactionAmount: 'Importe:',
    transactionDate: 'Fecha:',
    transactionDescription: 'Descripción:',
    noDescription: 'Sin descripción',
    dateNotAvailable: 'Fecha no disponible',
    currentBalance: 'Su saldo actual es',
    
    // Reminders
    paymentReminder: 'Recordatorio de pago',
    stepPaymentRequired: 'Se requiere un pago para continuar con su proceso de verificación.',
    currentStep: 'Paso actual:',
    amountDue: 'Importe a pagar:',
    paymentInstructions: 'Por favor, realice una transferencia bancaria con los siguientes detalles:',
    beneficiaryName: 'Nombre del beneficiario:',
    accountNumber: 'Número de cuenta:',
    paymentReference: 'Referencia:',
    paymentHelp: 'Después de realizar el pago, envíenos un comprobante para acelerar la validación.',
    
    // Status
    accountStatus: 'Estado de la cuenta',
    accountActivated: 'Cuenta activada',
    accountDeactivated: 'Cuenta desactivada',
    accountActivatedMessage: 'Ahora puede disfrutar de todos los servicios de EuroNova.',
    accountDeactivatedMessage: 'Para más información o para reactivar su cuenta, póngase en contacto con nuestro servicio de atención al cliente.',
    accountStatusUpdate: 'Actualización del estado de la cuenta',
    accountActivationMsg: 'Nos complace informarle que su cuenta ha sido activada. Ahora puede acceder a todas las funciones de nuestra plataforma.',
    accountDeactivationMsg: 'Lamentamos informarle que su cuenta ha sido desactivada. Contacte con nuestro servicio de atención al cliente para más información.',
    
    // Welcome
    welcomeTitle: 'Bienvenido a EuroNova',
    welcomeSubject: 'Su información confidencial',
    welcomeMessage: 'Bienvenido a EuroNova! Estamos encantados de tenerle como cliente.',
    trustedBankingPartner: 'Su socio bancario de confianza',
    accountCreated: '¡Su cuenta ha sido creada con éxito! Aquí está su información de identificación:',
    accessCredentials: 'Aquí están sus credenciales de acceso:',
    clientIdLabel: 'ID de cliente:',
    passwordLabel: 'Contraseña:',
    accountNumberLabel: 'Número de cuenta:',
    cardInfoLabel: 'Información de la tarjeta bancaria:',
    cardNumberLabel: 'Número de tarjeta:',
    cardExpiryDateLabel: 'Fecha de caducidad:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'Mantenga esta información confidencial y no la comparta con nadie.',
    loginInvite: 'Ahora puede iniciar sesión en su área de cliente para descubrir nuestros servicios.',
    confidentialInfo: 'Este mensaje contiene información confidencial. Por favor, no responda.',
  },
  de: {
    // General
    appName: 'EuroNova',
    tagline: 'Ihr Bankpartner',
    buttonAccessAccount: 'Auf mein Konto zugreifen',
    buttonContactSupport: 'Support kontaktieren',
    footerAutomatedMsg: 'Dies ist eine automatische Nachricht, bitte antworten Sie nicht.',
    allRightsReserved: 'Alle Rechte vorbehalten.',
    greeting: (firstName: string, lastName: string) => `Liebe/r <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Transaktionsbenachrichtigung',
    transactionCredit: 'Gutschrift',
    transactionDebit: 'Lastschrift',
    transactionInfo: 'Wir informieren Sie, dass eine Transaktion auf Ihrem Konto durchgeführt wurde.',
    transactionWarning: 'Falls Sie diese Transaktion nicht veranlasst haben, kontaktieren Sie bitte sofort unseren Kundenservice.',
    transactionType: 'Typ:',
    transactionAmount: 'Betrag:',
    transactionDate: 'Datum:',
    transactionDescription: 'Beschreibung:',
    noDescription: 'Keine Beschreibung',
    dateNotAvailable: 'Datum nicht verfügbar',
    currentBalance: 'Ihr aktueller Saldo beträgt',
    
    // Reminders
    paymentReminder: 'Zahlungserinnerung',
    stepPaymentRequired: 'Eine Zahlung ist erforderlich, um mit Ihrem Verifizierungsprozess fortzufahren.',
    currentStep: 'Aktueller Schritt:',
    amountDue: 'Fälliger Betrag:',
    paymentInstructions: 'Bitte führen Sie eine Banküberweisung mit folgenden Details durch:',
    beneficiaryName: 'Name des Begünstigten:',
    accountNumber: 'Kontonummer:',
    paymentReference: 'Referenz:',
    paymentHelp: 'Nach der Zahlung senden Sie uns bitte einen Zahlungsnachweis zur Beschleunigung der Validierung.',
    
    // Status
    accountStatus: 'Kontostatus',
    accountActivated: 'Konto aktiviert',
    accountDeactivated: 'Konto deaktiviert',
    accountActivatedMessage: 'Sie können nun alle EuroNova-Services nutzen.',
    accountDeactivatedMessage: 'Für weitere Informationen oder zur Reaktivierung Ihres Kontos kontaktieren Sie bitte unseren Kundenservice.',
    accountStatusUpdate: 'Kontostatus-Update',
    accountActivationMsg: 'Wir freuen uns, Ihnen mitteilen zu können, dass Ihr Konto aktiviert wurde. Sie können nun auf alle Funktionen unserer Plattform zugreifen.',
    accountDeactivationMsg: 'Wir bedauern, Ihnen mitteilen zu müssen, dass Ihr Konto deaktiviert wurde. Bitte kontaktieren Sie unseren Kundenservice für weitere Informationen.',
    
    // Welcome
    welcomeTitle: 'Willkommen bei EuroNova',
    welcomeSubject: 'Ihre vertraulichen Informationen',
    welcomeMessage: 'Willkommen bei EuroNova! Wir freuen uns, Sie als Kunden zu haben.',
    trustedBankingPartner: 'Ihr vertrauensvoller Bankpartner',
    accountCreated: 'Ihr Konto wurde erfolgreich erstellt! Hier sind Ihre Identifikationsinformationen:',
    accessCredentials: 'Hier sind Ihre Zugangsdaten:',
    clientIdLabel: 'Kunden-ID:',
    passwordLabel: 'Passwort:',
    accountNumberLabel: 'Kontonummer:',
    cardInfoLabel: 'Bankkarten-Informationen:',
    cardNumberLabel: 'Kartennummer:',
    cardExpiryDateLabel: 'Ablaufdatum:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'Bewahren Sie diese Informationen sicher auf und teilen Sie sie mit niemandem.',
    loginInvite: 'Sie können sich jetzt in Ihren Kundenbereich einloggen, um unsere Services zu entdecken.',
    confidentialInfo: 'Diese Nachricht enthält vertrauliche Informationen. Bitte antworten Sie nicht.',
  },
  it: {
    // General
    appName: 'EuroNova',
    tagline: 'Il vostro partner bancario',
    buttonAccessAccount: 'Accedi al mio conto',
    buttonContactSupport: 'Contatta il supporto',
    footerAutomatedMsg: 'Questo è un messaggio automatico, si prega di non rispondere.',
    allRightsReserved: 'Tutti i diritti riservati.',
    greeting: (firstName: string, lastName: string) => `Caro/a <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Notifica di transazione',
    transactionCredit: 'Credito',
    transactionDebit: 'Debito',
    transactionInfo: 'Vi informiamo che è stata effettuata una transazione sul vostro conto.',
    transactionWarning: 'Se non avete avviato questa transazione, contattate immediatamente il nostro servizio clienti.',
    transactionType: 'Tipo:',
    transactionAmount: 'Importo:',
    transactionDate: 'Data:',
    transactionDescription: 'Descrizione:',
    noDescription: 'Nessuna descrizione',
    dateNotAvailable: 'Data non disponibile',
    currentBalance: 'Il vostro saldo attuale è',
    
    // Reminders
    paymentReminder: 'Promemoria di pagamento',
    stepPaymentRequired: 'È richiesto un pagamento per procedere con il vostro processo di verifica.',
    currentStep: 'Passo attuale:',
    amountDue: 'Importo dovuto:',
    paymentInstructions: 'Si prega di effettuare un bonifico bancario con i seguenti dettagli:',
    beneficiaryName: 'Nome del beneficiario:',
    accountNumber: 'Numero di conto:',
    paymentReference: 'Riferimento:',
    paymentHelp: 'Dopo aver effettuato il pagamento, inviateci una prova di pagamento per accelerare la validazione.',
    
    // Status
    accountStatus: 'Stato del conto',
    accountActivated: 'Conto attivato',
    accountDeactivated: 'Conto disattivato',
    accountActivatedMessage: 'Ora potete usufruire di tutti i servizi EuroNova.',
    accountDeactivatedMessage: 'Per maggiori informazioni o per riattivare il vostro conto, contattate il nostro servizio clienti.',
    accountStatusUpdate: 'Aggiornamento dello stato del conto',
    accountActivationMsg: 'Siamo lieti di informarvi che il vostro conto è stato attivato. Ora potete accedere a tutte le funzionalità della nostra piattaforma.',
    accountDeactivationMsg: 'Ci dispiace informarvi che il vostro conto è stato disattivato. Contattate il nostro servizio clienti per maggiori informazioni.',
    
    // Welcome
    welcomeTitle: 'Benvenuto in EuroNova',
    welcomeSubject: 'Le vostre informazioni riservate',
    welcomeMessage: 'Benvenuto in EuroNova! Siamo felici di avervi come cliente.',
    trustedBankingPartner: 'Il vostro partner bancario di fiducia',
    accountCreated: 'Il vostro conto è stato creato con successo! Ecco le vostre informazioni di identificazione:',
    accessCredentials: 'Ecco le vostre credenziali di accesso:',
    clientIdLabel: 'ID Cliente:',
    passwordLabel: 'Password:',
    accountNumberLabel: 'Numero di conto:',
    cardInfoLabel: 'Informazioni della carta bancaria:',
    cardNumberLabel: 'Numero di carta:',
    cardExpiryDateLabel: 'Data di scadenza:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'Conservate queste informazioni con cura e non condividetele con nessuno.',
    loginInvite: 'Ora potete accedere alla vostra area clienti per scoprire i nostri servizi.',
    confidentialInfo: 'Questo messaggio contiene informazioni riservate. Si prega di non rispondere.',
  },
  ar: {
    // General
    appName: 'EuroNova',
    tagline: 'شريكك المصرفي',
    buttonAccessAccount: 'الوصول إلى حسابي',
    buttonContactSupport: 'اتصل بالدعم',
    footerAutomatedMsg: 'هذه رسالة تلقائية، يرجى عدم الرد عليها.',
    allRightsReserved: 'جميع الحقوق محفوظة.',
    greeting: (firstName: string, lastName: string) => `عزيزي/عزيزتي <strong>${firstName} ${lastName}</strong>،`,
    
    // Transaction
    transactionNotification: 'إشعار المعاملة',
    transactionCredit: 'ائتمان',
    transactionDebit: 'خصم',
    transactionInfo: 'نحيطكم علماً بأنه تم إجراء معاملة على حسابكم.',
    transactionWarning: 'إذا لم تقوموا ببدء هذه المعاملة، يرجى الاتصال بخدمة العملاء فوراً.',
    transactionType: 'النوع:',
    transactionAmount: 'المبلغ:',
    transactionDate: 'التاريخ:',
    transactionDescription: 'الوصف:',
    noDescription: 'لا يوجد وصف',
    dateNotAvailable: 'التاريخ غير متوفر',
    currentBalance: 'رصيدكم الحالي هو',
    
    // Reminders
    paymentReminder: 'تذكير بالدفع',
    stepPaymentRequired: 'مطلوب دفعة للمتابعة في عملية التحقق الخاصة بكم.',
    currentStep: 'الخطوة الحالية:',
    amountDue: 'المبلغ المستحق:',
    paymentInstructions: 'يرجى إجراء تحويل مصرفي بالتفاصيل التالية:',
    beneficiaryName: 'اسم المستفيد:',
    accountNumber: 'رقم الحساب:',
    paymentReference: 'المرجع:',
    paymentHelp: 'بعد إجراء الدفع، يرجى إرسال إثبات الدفع لتسريع التحقق.',
    
    // Status
    accountStatus: 'حالة الحساب',
    accountActivated: 'تم تفعيل الحساب',
    accountDeactivated: 'تم إلغاء تفعيل الحساب',
    accountActivatedMessage: 'يمكنكم الآن الاستفادة من جميع خدمات EuroNova.',
    accountDeactivatedMessage: 'لمزيد من المعلومات أو لإعادة تفعيل حسابكم، يرجى الاتصال بخدمة العملاء.',
    accountStatusUpdate: 'تحديث حالة الحساب',
    accountActivationMsg: 'يسرنا إعلامكم بأن حسابكم قد تم تفعيله. يمكنكم الآن الوصول إلى جميع ميزات منصتنا.',
    accountDeactivationMsg: 'نأسف لإعلامكم بأن حسابكم قد تم إلغاء تفعيله. يرجى الاتصال بخدمة العملاء لمزيد من المعلومات.',
    
    // Welcome
    welcomeTitle: 'مرحباً بكم في EuroNova',
    welcomeSubject: 'معلوماتكم السرية',
    welcomeMessage: 'مرحباً بكم في EuroNova! نحن سعداء لوجودكم كعملاء لدينا.',
    trustedBankingPartner: 'شريككم المصرفي الموثوق',
    accountCreated: 'تم إنشاء حسابكم بنجاح! إليكم معلومات التعريف الخاصة بكم:',
    accessCredentials: 'إليكم بيانات الوصول الخاصة بكم:',
    clientIdLabel: 'معرف العميل:',
    passwordLabel: 'كلمة المرور:',
    accountNumberLabel: 'رقم الحساب:',
    cardInfoLabel: 'معلومات البطاقة المصرفية:',
    cardNumberLabel: 'رقم البطاقة:',
    cardExpiryDateLabel: 'تاريخ انتهاء الصلاحية:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'احتفظوا بهذه المعلومات بعناية ولا تشاركوها مع أحد.',
    loginInvite: 'يمكنكم الآن تسجيل الدخول إلى منطقة العملاء لاكتشاف خدماتنا.',
    confidentialInfo: 'تحتوي هذه الرسالة على معلومات سرية. يرجى عدم الرد عليها.',
  },
  zh: {
    // General
    appName: 'EuroNova',
    tagline: '您的银行合作伙伴',
    buttonAccessAccount: '访问我的账户',
    buttonContactSupport: '联系支持',
    footerAutomatedMsg: '这是一条自动消息，请勿回复。',
    allRightsReserved: '版权所有。',
    greeting: (firstName: string, lastName: string) => `亲爱的 <strong>${firstName} ${lastName}</strong>，`,
    
    // Transaction
    transactionNotification: '交易通知',
    transactionCredit: '贷记',
    transactionDebit: '借记',
    transactionInfo: '我们通知您，您的账户已进行了一笔交易。',
    transactionWarning: '如果您没有发起此交易，请立即联系我们的客户服务。',
    transactionType: '类型：',
    transactionAmount: '金额：',
    transactionDate: '日期：',
    transactionDescription: '描述：',
    noDescription: '无描述',
    dateNotAvailable: '日期不可用',
    currentBalance: '您的当前余额为',
    
    // Reminders
    paymentReminder: '付款提醒',
    stepPaymentRequired: '需要付款以继续您的验证过程。',
    currentStep: '当前步骤：',
    amountDue: '应付金额：',
    paymentInstructions: '请使用以下详细信息进行银行转账：',
    beneficiaryName: '受益人姓名：',
    accountNumber: '账户号码：',
    paymentReference: '参考：',
    paymentHelp: '付款后，请向我们发送付款证明以加快验证。',
    
    // Status
    accountStatus: '账户状态',
    accountActivated: '账户已激活',
    accountDeactivated: '账户已停用',
    accountActivatedMessage: '您现在可以享受所有EuroNova服务。',
    accountDeactivatedMessage: '如需更多信息或重新激活您的账户，请联系我们的客户服务。',
    accountStatusUpdate: '账户状态更新',
    accountActivationMsg: '我们很高兴通知您，您的账户已被激活。您现在可以访问我们平台的所有功能。',
    accountDeactivationMsg: '我们很遗憾地通知您，您的账户已被停用。请联系我们的客户服务了解更多信息。',
    
    // Welcome
    welcomeTitle: '欢迎来到EuroNova',
    welcomeSubject: '您的机密信息',
    welcomeMessage: '欢迎来到EuroNova！我们很高兴您成为我们的客户。',
    trustedBankingPartner: '您值得信赖的银行合作伙伴',
    accountCreated: '您的账户已成功创建！以下是您的身份信息：',
    accessCredentials: '以下是您的访问凭据：',
    clientIdLabel: '客户ID：',
    passwordLabel: '密码：',
    accountNumberLabel: '账户号码：',
    cardInfoLabel: '银行卡信息：',
    cardNumberLabel: '卡号：',
    cardExpiryDateLabel: '到期日期：',
    cardCvvLabel: 'CVV：',
    securityWarning: '请妥善保管这些信息，不要与任何人分享。',
    loginInvite: '您现在可以登录您的客户区域来发现我们的服务。',
    confidentialInfo: '此消息包含机密信息。请勿回复。',
  },
  ru: {
    // General
    appName: 'EuroNova',
    tagline: 'Ваш банковский партнер',
    buttonAccessAccount: 'Доступ к моему счету',
    buttonContactSupport: 'Связаться с поддержкой',
    footerAutomatedMsg: 'Это автоматическое сообщение, пожалуйста, не отвечайте на него.',
    allRightsReserved: 'Все права защищены.',
    greeting: (firstName: string, lastName: string) => `Уважаемый/ая <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Уведомление о транзакции',
    transactionCredit: 'Кредит',
    transactionDebit: 'Дебет',
    transactionInfo: 'Мы уведомляем вас о том, что по вашему счету была проведена транзакция.',
    transactionWarning: 'Если вы не инициировали эту транзакцию, немедленно свяжитесь с нашей службой поддержки клиентов.',
    transactionType: 'Тип:',
    transactionAmount: 'Сумма:',
    transactionDate: 'Дата:',
    transactionDescription: 'Описание:',
    noDescription: 'Без описания',
    dateNotAvailable: 'Дата недоступна',
    currentBalance: 'Ваш текущий баланс составляет',
    
    // Reminders
    paymentReminder: 'Напоминание о платеже',
    stepPaymentRequired: 'Требуется платеж для продолжения процесса верификации.',
    currentStep: 'Текущий шаг:',
    amountDue: 'Сумма к оплате:',
    paymentInstructions: 'Пожалуйста, совершите банковский перевод со следующими реквизитами:',
    beneficiaryName: 'Имя получателя:',
    accountNumber: 'Номер счета:',
    paymentReference: 'Ссылка:',
    paymentHelp: 'После совершения платежа, пожалуйста, отправьте нам подтверждение платежа для ускорения проверки.',
    
    // Status
    accountStatus: 'Статус счета',
    accountActivated: 'Счет активирован',
    accountDeactivated: 'Счет деактивирован',
    accountActivatedMessage: 'Теперь вы можете пользоваться всеми услугами EuroNova.',
    accountDeactivatedMessage: 'Для получения дополнительной информации или повторной активации вашего счета, пожалуйста, свяжитесь с нашей службой поддержки клиентов.',
    accountStatusUpdate: 'Обновление статуса счета',
    accountActivationMsg: 'Мы рады сообщить вам, что ваш счет был активирован. Теперь вы можете получить доступ ко всем функциям нашей платформы.',
    accountDeactivationMsg: 'Мы сожалеем сообщить вам, что ваш счет был деактивирован. Пожалуйста, свяжитесь с нашей службой поддержки клиентов для получения дополнительной информации.',
    
    // Welcome
    welcomeTitle: 'Добро пожаловать в EuroNova',
    welcomeSubject: 'Ваша конфиденциальная информация',
    welcomeMessage: 'Добро пожаловать в EuroNova! Мы рады видеть вас в качестве нашего клиента.',
    trustedBankingPartner: 'Ваш надежный банковский партнер',
    accountCreated: 'Ваш счет был успешно создан! Вот ваша идентификационная информация:',
    accessCredentials: 'Вот ваши учетные данные для доступа:',
    clientIdLabel: 'ID клиента:',
    passwordLabel: 'Пароль:',
    accountNumberLabel: 'Номер счета:',
    cardInfoLabel: 'Информация о банковской карте:',
    cardNumberLabel: 'Номер карты:',
    cardExpiryDateLabel: 'Дата истечения:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'Храните эту информацию в безопасности и не делитесь ею ни с кем.',
    loginInvite: 'Теперь вы можете войти в свою клиентскую зону, чтобы открыть наши услуги.',
    confidentialInfo: 'Это сообщение содержит конфиденциальную информацию. Пожалуйста, не отвечайте на него.',
  },
  pt: {
    // General
    appName: 'EuroNova',
    tagline: 'Seu parceiro bancário',
    buttonAccessAccount: 'Acessar minha conta',
    buttonContactSupport: 'Contatar suporte',
    footerAutomatedMsg: 'Esta é uma mensagem automática, por favor não responda.',
    allRightsReserved: 'Todos os direitos reservados.',
    greeting: (firstName: string, lastName: string) => `Caro/a <strong>${firstName} ${lastName}</strong>,`,
    
    // Transaction
    transactionNotification: 'Notificação de transação',
    transactionCredit: 'Crédito',
    transactionDebit: 'Débito',
    transactionInfo: 'Informamos que uma transação foi realizada em sua conta.',
    transactionWarning: 'Se você não iniciou esta transação, entre em contato com nosso atendimento ao cliente imediatamente.',
    transactionType: 'Tipo:',
    transactionAmount: 'Valor:',
    transactionDate: 'Data:',
    transactionDescription: 'Descrição:',
    noDescription: 'Sem descrição',
    dateNotAvailable: 'Data não disponível',
    currentBalance: 'Seu saldo atual é',
    
    // Reminders
    paymentReminder: 'Lembrete de pagamento',
    stepPaymentRequired: 'Um pagamento é necessário para prosseguir com seu processo de verificação.',
    currentStep: 'Etapa atual:',
    amountDue: 'Valor devido:',
    paymentInstructions: 'Por favor, faça uma transferência bancária com os seguintes detalhes:',
    beneficiaryName: 'Nome do beneficiário:',
    accountNumber: 'Número da conta:',
    paymentReference: 'Referência:',
    paymentHelp: 'Após fazer o pagamento, envie-nos um comprovante de pagamento para acelerar a validação.',
    
    // Status
    accountStatus: 'Status da conta',
    accountActivated: 'Conta ativada',
    accountDeactivated: 'Conta desativada',
    accountActivatedMessage: 'Agora você pode desfrutar de todos os serviços da EuroNova.',
    accountDeactivatedMessage: 'Para mais informações ou para reativar sua conta, entre em contato com nosso atendimento ao cliente.',
    accountStatusUpdate: 'Atualização do status da conta',
    accountActivationMsg: 'Temos o prazer de informar que sua conta foi ativada. Agora você pode acessar todos os recursos de nossa plataforma.',
    accountDeactivationMsg: 'Lamentamos informar que sua conta foi desativada. Entre em contato com nosso atendimento ao cliente para mais informações.',
    
    // Welcome
    welcomeTitle: 'Bem-vindo à EuroNova',
    welcomeSubject: 'Suas informações confidenciais',
    welcomeMessage: 'Bem-vindo à EuroNova! Estamos felizes em tê-lo como nosso cliente.',
    trustedBankingPartner: 'Seu parceiro bancário confiável',
    accountCreated: 'Sua conta foi criada com sucesso! Aqui estão suas informações de identificação:',
    accessCredentials: 'Aqui estão suas credenciais de acesso:',
    clientIdLabel: 'ID do Cliente:',
    passwordLabel: 'Senha:',
    accountNumberLabel: 'Número da conta:',
    cardInfoLabel: 'Informações do cartão bancário:',
    cardNumberLabel: 'Número do cartão:',
    cardExpiryDateLabel: 'Data de validade:',
    cardCvvLabel: 'CVV:',
    securityWarning: 'Mantenha essas informações seguras e não as compartilhe com ninguém.',
    loginInvite: 'Agora você pode fazer login em sua área do cliente para descobrir nossos serviços.',
    confidentialInfo: 'Esta mensagem contém informações confidenciais. Por favor, não responda.',
  },
  ja: {
    // General
    appName: 'EuroNova',
    tagline: 'あなたの銀行パートナー',
    buttonAccessAccount: 'マイアカウントにアクセス',
    buttonContactSupport: 'サポートに連絡',
    footerAutomatedMsg: 'これは自動メッセージです。返信しないでください。',
    allRightsReserved: '全著作権所有。',
    greeting: (firstName: string, lastName: string) => `<strong>${firstName} ${lastName}</strong> 様`,
    
    // Transaction
    transactionNotification: '取引通知',
    transactionCredit: 'クレジット',
    transactionDebit: 'デビット',
    transactionInfo: 'お客様のアカウントで取引が行われたことをお知らせします。',
    transactionWarning: 'この取引を開始していない場合は、すぐにカスタマーサービスにお問い合わせください。',
    transactionType: 'タイプ：',
    transactionAmount: '金額：',
    transactionDate: '日付：',
    transactionDescription: '説明：',
    noDescription: '説明なし',
    dateNotAvailable: '日付が利用できません',
    currentBalance: '現在の残高は',
    
    // Reminders
    paymentReminder: '支払いリマインダー',
    stepPaymentRequired: '認証プロセスを続行するために支払いが必要です。',
    currentStep: '現在のステップ：',
    amountDue: '支払い金額：',
    paymentInstructions: '以下の詳細で銀行振込を行ってください：',
    beneficiaryName: '受益者名：',
    accountNumber: 'アカウント番号：',
    paymentReference: '参照：',
    paymentHelp: '支払い後、検証を迅速化するために支払い証明をお送りください。',
    
    // Status
    accountStatus: 'アカウントステータス',
    accountActivated: 'アカウントが有効化されました',
    accountDeactivated: 'アカウントが無効化されました',
    accountActivatedMessage: 'これでEuroNovaのすべてのサービスをご利用いただけます。',
    accountDeactivatedMessage: '詳細情報やアカウントの再有効化については、カスタマーサービスにお問い合わせください。',
    accountStatusUpdate: 'アカウントステータスの更新',
    accountActivationMsg: 'お客様のアカウントが有効化されたことをお知らせいたします。これで当プラットフォームのすべての機能にアクセスできます。',
    accountDeactivationMsg: 'お客様のアカウントが無効化されたことをお知らせいたします。詳細については、カスタマーサービスにお問い合わせください。',
    
    // Welcome
    welcomeTitle: 'EuroNovaへようこそ',
    welcomeSubject: 'お客様の機密情報',
    welcomeMessage: 'EuroNovaへようこそ！お客様を当社の顧客としてお迎えできることを嬉しく思います。',
    trustedBankingPartner: '信頼できる銀行パートナー',
    accountCreated: 'アカウントが正常に作成されました！こちらがお客様の識別情報です：',
    accessCredentials: 'こちらがお客様のアクセス認証情報です：',
    clientIdLabel: 'クライアントID：',
    passwordLabel: 'パスワード：',
    accountNumberLabel: 'アカウント番号：',
    cardInfoLabel: '銀行カード情報：',
    cardNumberLabel: 'カード番号：',
    cardExpiryDateLabel: '有効期限：',
    cardCvvLabel: 'CVV：',
    securityWarning: 'この情報を安全に保管し、誰とも共有しないでください。',
    loginInvite: 'これでクライアントエリアにログインして、当社のサービスをご利用いただけます。',
    confidentialInfo: 'このメッセージには機密情報が含まれています。返信しないでください。',
  },
  ko: {
    // General
    appName: 'EuroNova',
    tagline: '귀하의 은행 파트너',
    buttonAccessAccount: '내 계정에 액세스',
    buttonContactSupport: '지원팀에 문의',
    footerAutomatedMsg: '이것은 자동 메시지입니다. 답장하지 마십시오.',
    allRightsReserved: '모든 권리 보유.',
    greeting: (firstName: string, lastName: string) => `친애하는 <strong>${firstName} ${lastName}</strong>님,`,
    
    // Transaction
    transactionNotification: '거래 알림',
    transactionCredit: '크레딧',
    transactionDebit: '데빗',
    transactionInfo: '귀하의 계정에서 거래가 이루어졌음을 알려드립니다.',
    transactionWarning: '이 거래를 시작하지 않으셨다면 즉시 고객 서비스에 문의하십시오.',
    transactionType: '유형:',
    transactionAmount: '금액:',
    transactionDate: '날짜:',
    transactionDescription: '설명:',
    noDescription: '설명 없음',
    dateNotAvailable: '날짜를 사용할 수 없음',
    currentBalance: '현재 잔액은',
    
    // Reminders
    paymentReminder: '결제 알림',
    stepPaymentRequired: '인증 프로세스를 계속하려면 결제가 필요합니다.',
    currentStep: '현재 단계:',
    amountDue: '지불 금액:',
    paymentInstructions: '다음 세부 정보로 은행 송금을 해주십시오:',
    beneficiaryName: '수익자 이름:',
    accountNumber: '계정 번호:',
    paymentReference: '참조:',
    paymentHelp: '결제 후 검증을 신속히 처리하기 위해 결제 증명을 보내주십시오.',
    
    // Status
    accountStatus: '계정 상태',
    accountActivated: '계정이 활성화됨',
    accountDeactivated: '계정이 비활성화됨',
    accountActivatedMessage: '이제 모든 EuroNova 서비스를 이용하실 수 있습니다.',
    accountDeactivatedMessage: '자세한 정보나 계정 재활성화를 위해 고객 서비스에 문의하십시오.',
    accountStatusUpdate: '계정 상태 업데이트',
    accountActivationMsg: '귀하의 계정이 활성화되었음을 알려드립니다. 이제 저희 플랫폼의 모든 기능에 액세스할 수 있습니다.',
    accountDeactivationMsg: '귀하의 계정이 비활성화되었음을 알려드립니다. 자세한 정보는 고객 서비스에 문의하십시오.',
    
    // Welcome
    welcomeTitle: 'EuroNova에 오신 것을 환영합니다',
    welcomeSubject: '귀하의 기밀 정보',
    welcomeMessage: 'EuroNova에 오신 것을 환영합니다! 귀하를 저희 고객으로 모시게 되어 기쁩니다.',
    trustedBankingPartner: '신뢰할 수 있는 은행 파트너',
    accountCreated: '계정이 성공적으로 생성되었습니다! 다음은 귀하의 식별 정보입니다:',
    accessCredentials: '다음은 귀하의 액세스 자격 증명입니다:',
    clientIdLabel: '클라이언트 ID:',
    passwordLabel: '비밀번호:',
    accountNumberLabel: '계정 번호:',
    cardInfoLabel: '은행 카드 정보:',
    cardNumberLabel: '카드 번호:',
    cardExpiryDateLabel: '만료 날짜:',
    cardCvvLabel: 'CVV:',
    securityWarning: '이 정보를 안전하게 보관하고 누구와도 공유하지 마십시오.',
    loginInvite: '이제 고객 영역에 로그인하여 저희 서비스를 발견할 수 있습니다.',
    confidentialInfo: '이 메시지에는 기밀 정보가 포함되어 있습니다. 답장하지 마십시오.',
  }
};

// Types pour les traductions
type SupportedLanguages = 'fr' | 'en' | 'es' | 'de' | 'it' | 'ar' | 'zh' | 'ru' | 'pt' | 'ja' | 'ko'; 

// Type pour définir le schéma des traductions
interface EmailTranslation {
  // Général
  appName: string;
  tagline: string;
  buttonAccessAccount: string;
  buttonContactSupport: string;
  footerAutomatedMsg: string;
  allRightsReserved: string;
  greeting: (firstName: string, lastName: string) => string;
  
  // Transaction
  transactionNotification: string;
  transactionCredit: string;
  transactionDebit: string;
  transactionInfo: string;
  transactionWarning: string;
  transactionType: string;
  transactionAmount: string;
  transactionDate: string;
  transactionDescription: string;
  noDescription: string;
  dateNotAvailable: string;
  currentBalance: string;
  
  // Reminders
  paymentReminder: string;
  stepPaymentRequired: string;
  currentStep: string;
  amountDue: string;
  paymentInstructions: string;
  beneficiaryName: string;
  accountNumber: string;
  paymentReference: string;
  paymentHelp: string;
  
  // Status
  accountStatus: string;
  accountActivated: string;
  accountDeactivated: string;
  accountActivatedMessage: string;
  accountDeactivatedMessage: string;
  accountStatusUpdate: string;
  accountActivationMsg: string;
  accountDeactivationMsg: string;
  
  // Welcome
  welcomeTitle: string;
  welcomeSubject: string;
  welcomeMessage: string;
  trustedBankingPartner: string;
  accountCreated: string;
  accessCredentials: string;
  clientIdLabel: string;
  passwordLabel: string;
  accountNumberLabel: string;
  cardInfoLabel: string;
  cardNumberLabel: string;
  cardExpiryDateLabel: string;
  cardCvvLabel: string;
  securityWarning: string;
  loginInvite: string;
  confidentialInfo: string;
}

// Fonction d'aide pour obtenir les traductions selon la langue
function getTranslation(lang: string): EmailTranslation {
  // Vérifier si la langue est supportée
  const supportedLang = (lang === 'fr' || lang === 'en' || lang === 'es' || lang === 'de' || lang === 'it' || lang === 'ar' || lang === 'zh' || lang === 'ru' || lang === 'pt' || lang === 'ja' || lang === 'ko') ? 
    lang as SupportedLanguages : 'fr';
  
  // Retourner les traductions pour cette langue
  return emailTranslations[supportedLang];
}

// Configuration de l'API Brevo
const apiKey = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Fonction pour vérifier la validité de la clé API
export async function checkApiKey(): Promise<boolean> {
  if (!apiKey) {
    console.error("❌ Clé API Brevo manquante");
    return false;
  }
  
  try {
    console.log("🔑 Vérification de la clé API Brevo...");
    
    const response = await axios.get('https://api.brevo.com/v3/account', {
      headers: {
        'api-key': apiKey
      }
    });
    
    if (response.status === 200) {
      console.log("✅ Clé API Brevo valide");
      console.log("📧 Infos du compte Brevo:", {
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        companyName: response.data.companyName,
      });
      return true;
    } else {
      console.error("❌ Clé API Brevo invalide. Statut:", response.status);
      return false;
    }
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la vérification de la clé API Brevo:");
    if (error instanceof Error) {
      // Si c'est une erreur standard
      console.error("- Message:", error.message);
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      // Si c'est une erreur Axios
      const axiosError = error as { response?: { status?: number, data?: any } };
      if (axiosError.response) {
        console.error("- Statut:", axiosError.response.status);
        console.error("- Message:", axiosError.response.data);
      }
    } else {
      // Autre type d'erreur
      console.error("- Erreur inconnue:", error);
    }
    return false;
  }
}

// Fonction d'envoi d'email avec Brevo
export async function sendEmail(to: string, subject: string, html: string, lang?: string): Promise<boolean> {
  try {
    // Vérifier que l'adresse email est valide
    if (!to || !to.includes('@')) {
      console.error(`📧 Invalid email address: ${to}`);
      return false;
    }

    // Si pas de clé API configurée, on utilise le mode simulation
    if (!apiKey) {
      console.log(`📧 ====== SIMULATION D'EMAIL (pas de clé API Brevo) ======`);
      console.log(`📧 Email envoyé à: ${to}`);
      console.log(`📧 Sujet: ${subject}`);
      console.log(`📧 Contenu: \n    ${html.length > 500 ? html.substring(0, 500) + '...' : html}`);
      console.log(`📧 ====== FIN SIMULATION ======`);
      return true;
    }

    // Création du message pour Brevo
    const emailData = {
      sender: {
        name: "EuroNova Banking",
        email: "ecreditgroupe@gmail.com"  // Utilisation de l'adresse email vérifiée dans Brevo
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: html
    };

    // Envoi du message
    console.log(`📧 Envoi d'email à ${to} via Brevo API...`);
    
    try {
      console.log(`📧 Envoi vers Brevo API avec les données:`, {
        to: emailData.to[0].email,
        from: emailData.sender.email,
        subject: emailData.subject,
      });
      
      const response = await axios.post(BREVO_API_URL, emailData, {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        }
      });
      
      console.log(`📧 Email envoyé avec succès via Brevo (statut: ${response.status})`);
      console.log(`📧 Réponse Brevo:`, response.data);
      
      return true;
    } catch (err: any) {
      console.error(`📧 Erreur lors de l'envoi via Brevo:`);
      if (err.response) {
        console.error(`- Statut: ${err.response.status}`);
        console.error(`- Message: ${JSON.stringify(err.response.data)}`);
      } else {
        console.error(`- Message: ${err.message}`);
      }
      return false;
    }
  } catch (error: unknown) {
    console.error(`📧 Error sending email to ${to}:`);
    if (error instanceof Error) {
      console.error(`- Message: ${error.message}`);
    } else {
      console.error(`- Error: ${String(error)}`);
    }
    return false;
  }
}

// Generate transaction notification email
export async function sendTransactionEmail(
  user: User, 
  transaction: Transaction, 
  account: Account
): Promise<boolean> {
  // Utiliser la langue préférée de l'utilisateur, avec français par défaut
  const userLang = user.language || 'fr';
  const isCredit = transaction.toAccountId === account.id;
  
  // Récupérer les traductions pour la langue de l'utilisateur
  const t = getTranslation(userLang);
  
  // Déterminer le type de transaction (crédit ou débit)
  const transactionType = isCredit ? t.transactionCredit : t.transactionDebit;
  
  // Créer le sujet de l'email
  const subject = `${t.appName} - ${transactionType} ${isCredit ? 'de' : 'de'} ${Math.abs(transaction.amount)}€`;
  
  const transactionColor = isCredit ? "#28C76F" : "#EA5455";
  
  // Gérer les dates potentiellement nulles
  let formattedDate = t.dateNotAvailable;
  if (transaction.createdAt) {
    // Définir la locale en fonction de la langue
    let locale = 'fr-FR'; // Par défaut
    if (userLang === 'en') locale = 'en-US';
    else if (userLang === 'es') locale = 'es-ES';
    else if (userLang === 'de') locale = 'de-DE';
    else if (userLang === 'it') locale = 'it-IT';
    else if (userLang === 'ar') locale = 'ar-SA';
    else if (userLang === 'zh') locale = 'zh-CN';
    else if (userLang === 'ru') locale = 'ru-RU';
    else if (userLang === 'pt') locale = 'pt-BR';
    else if (userLang === 'ja') locale = 'ja-JP';
    else if (userLang === 'ko') locale = 'ko-KR';
    
    if (transaction.createdAt instanceof Date) {
      formattedDate = transaction.createdAt.toLocaleString(locale);
    } else {
      formattedDate = new Date(transaction.createdAt).toLocaleString(locale);
    }
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #191C33; margin: 0;"><span style="color: #7A73FF;">Euro</span>Nova</h1>
        <p style="color: #818181; margin-top: 5px;">${t.tagline}</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #191C33; margin-top: 0;">${t.transactionNotification}</h2>
        <p>${t.greeting(user.firstName, user.lastName)}</p>
        <p>${t.transactionInfo}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border-left: 4px solid #7A73FF;">
          <p style="margin: 0 0 5px 0;"><strong>${t.transactionType}</strong> <span style="color: ${transactionColor};">${transactionType}</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.transactionAmount}</strong> <span style="color: ${transactionColor};">${Math.abs(transaction.amount)} €</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.transactionDate}</strong> ${formattedDate}</p>
          <p style="margin: 0;"><strong>${t.transactionDescription}</strong> ${transaction.description || t.noDescription}</p>
        </div>
        
        <p>${t.currentBalance} <strong>${account.balance} €</strong>.</p>
        <p>${t.transactionWarning}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/auth?username=${user.username}" style="display: inline-block; background-color: #7A73FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">${t.buttonAccessAccount}</a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #818181; text-align: center;">
        <p>${t.footerAutomatedMsg}</p>
        <p>© ${new Date().getFullYear()} EuroNova. ${t.allRightsReserved}</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html, userLang);
}

// Generate payment reminder email
export async function sendPaymentReminderEmail(
  user: User, 
  verificationStep: VerificationStep, 
  stepNumber: number
): Promise<boolean> {
  // Utiliser la langue préférée de l'utilisateur, avec français par défaut
  const userLang = user.language || 'fr';
  
  // Récupérer les traductions pour la langue de l'utilisateur
  const t = getTranslation(userLang);
  
  // Définir les textes selon la langue des étapes
  const stepLabels = {
    fr: [
      "Frais d'enregistrement de crédit",
      "Frais de virement international",
      "Frais de justice",
      "Frais d'assurance",
      "Frais d'autorisation de décaissement"
    ],
    en: [
      "Credit Registration Fee",
      "International Transfer Fee",
      "Legal Fee",
      "Insurance Fee",
      "Disbursement Authorization Fee"
    ],
    es: [
      "Tarifa de registro de crédito",
      "Tarifa de transferencia internacional",
      "Tarifa legal",
      "Tarifa de seguro",
      "Tarifa de autorización de desembolso"
    ],
    de: [
      "Kreditregistrierungsgebühr",
      "Internationale Überweisungsgebühr",
      "Rechtsgebühr",
      "Versicherungsgebühr",
      "Auszahlungsautorisierungsgebühr"
    ],
    it: [
      "Commissione di registrazione credito",
      "Commissione di trasferimento internazionale",
      "Commissione legale",
      "Commissione di assicurazione",
      "Commissione di autorizzazione al prelievo"
    ],
    ar: [
      "رسوم تسجيل الائتمان",
      "رسوم التحويل الدولي",
      "الرسوم القانونية",
      "رسوم التأمين",
      "رسوم تفويض الصرف"
    ],
    zh: [
      "信贷注册费",
      "国际转账费",
      "法律费",
      "保险费",
      "支付授权费"
    ],
    ru: [
      "Комиссия за регистрацию кредита",
      "Комиссия за международный перевод",
      "Юридическая комиссия",
      "Страховая комиссия",
      "Комиссия за авторизацию выплаты"
    ],
    pt: [
      "Taxa de registro de crédito",
      "Taxa de transferência internacional",
      "Taxa legal",
      "Taxa de seguro",
      "Taxa de autorização de desembolso"
    ],
    ja: [
      "クレジット登録手数料",
      "国際送金手数料",
      "法的手数料",
      "保険手数料",
      "支払い承認手数料"
    ],
    ko: [
      "신용 등록 수수료",
      "국제 송금 수수료",
      "법적 수수료",
      "보험 수수료",
      "지급 승인 수수료"
    ]
  };
  
  // Sélectionner les labels selon la langue
  const currentStepLabels = stepLabels[userLang as keyof typeof stepLabels] || stepLabels.fr;
  
  const stepAmounts = [
    verificationStep.step1Amount,
    verificationStep.step2Amount,
    verificationStep.step3Amount,
    verificationStep.step4Amount,
    verificationStep.step5Amount
  ];
  
  const completedSteps = [
    verificationStep.step1Completed,
    verificationStep.step2Completed,
    verificationStep.step3Completed,
    verificationStep.step4Completed,
    verificationStep.step5Completed
  ].filter(Boolean).length;
  
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 3);
  
  // Créer le sujet de l'email
  const subject = `${t.appName} - ${t.paymentReminder}: ${currentStepLabels[stepNumber - 1]}`;
  
  // Définir la locale en fonction de la langue
  let locale = 'fr-FR'; // Par défaut
  if (userLang === 'en') locale = 'en-US';
  else if (userLang === 'es') locale = 'es-ES';
  else if (userLang === 'de') locale = 'de-DE';
  else if (userLang === 'it') locale = 'it-IT';
  else if (userLang === 'ar') locale = 'ar-SA';
  else if (userLang === 'zh') locale = 'zh-CN';
  else if (userLang === 'ru') locale = 'ru-RU';
  else if (userLang === 'pt') locale = 'pt-BR';
  else if (userLang === 'ja') locale = 'ja-JP';
  else if (userLang === 'ko') locale = 'ko-KR';
  
  // Format pour le texte de progression
  const progressText = `${t.currentStep} <strong>${completedSteps}/5</strong>`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #191C33; margin: 0;"><span style="color: #7A73FF;">Euro</span>Nova</h1>
        <p style="color: #818181; margin-top: 5px;">${t.tagline}</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #191C33; margin-top: 0;">${t.paymentReminder}</h2>
        <p>${t.greeting(user.firstName, user.lastName)}</p>
        <p>${t.stepPaymentRequired}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border-left: 4px solid #FF9F43;">
          <p style="margin: 0 0 5px 0;"><strong>${t.currentStep}</strong> <span>${currentStepLabels[stepNumber - 1]}</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.amountDue}</strong> <span>${stepAmounts[stepNumber - 1]} €</span></p>
          <p style="margin: 0;"><strong>${userLang === 'en' ? 'Deadline:' : userLang === 'es' ? 'Fecha límite:' : userLang === 'de' ? 'Frist:' : userLang === 'it' ? 'Scadenza:' : userLang === 'ar' ? 'الموعد النهائي:' : userLang === 'zh' ? '截止日期:' : userLang === 'ru' ? 'Крайний срок:' : userLang === 'pt' ? 'Prazo:' : userLang === 'ja' ? '期限:' : userLang === 'ko' ? '마감일:' : 'Date limite:'}</strong> <span style="color: #EA5455;">${deadlineDate.toLocaleDateString(locale)}</span></p>
        </div>
        
        <p>${t.paymentInstructions}</p>
        <p>${progressText}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/auth?username=${user.username}&redirect=/client/payments" style="display: inline-block; background-color: #7A73FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">${t.buttonAccessAccount}</a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #818181; text-align: center;">
        <p>${t.paymentHelp}</p>
        <p>© ${new Date().getFullYear()} EuroNova. ${t.allRightsReserved}</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html, userLang);
}

// Generate account status email
export async function sendAccountStatusEmail(
  user: User, 
  isActive: boolean
): Promise<boolean> {
  // Utiliser la langue préférée de l'utilisateur, avec français par défaut
  const userLang = user.language || 'fr';
  
  // Récupérer les traductions pour la langue de l'utilisateur
  const t = getTranslation(userLang);
  
  // Préparer le sujet selon le statut
  const statusAction = isActive ? t.accountActivated : t.accountDeactivated;
  const subject = `${t.appName} - ${statusAction}`;
  
  // Préparer le message de statut selon l'état
  const statusMessage = isActive ? 
    `<strong style="color: #28C76F;">${t.accountActivated}</strong>. ${t.accountActivatedMessage}` : 
    `<strong style="color: #EA5455;">${t.accountDeactivated}</strong>. ${t.accountDeactivatedMessage}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #191C33; margin: 0;"><span style="color: #7A73FF;">Euro</span>Nova</h1>
        <p style="color: #818181; margin-top: 5px;">${t.tagline}</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #191C33; margin-top: 0;">${t.accountStatus}</h2>
        <p>${t.greeting(user.firstName, user.lastName)}</p>
        
        <p>${statusMessage}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/auth?username=${user.username}&redirect=/client/support" style="display: inline-block; background-color: #7A73FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">${t.buttonContactSupport}</a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #818181; text-align: center;">
        <p>${t.footerAutomatedMsg}</p>
        <p>© ${new Date().getFullYear()} EuroNova. ${t.allRightsReserved}</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html, userLang);
}

// Generate welcome email with credentials
export async function sendWelcomeEmail(
  user: User, 
  accountNumber: string,
  clientId?: string,
  password?: string,
  cardNumber?: string,
  cardExpiryDate?: string,
  cardCvv?: string
): Promise<boolean> {
  // Utiliser la langue préférée de l'utilisateur, avec français par défaut
  const userLang = user.language || 'fr';
  
  // Récupérer les traductions pour la langue de l'utilisateur
  const t = getTranslation(userLang);
  
  // Définir le sujet de l'email
  const subject = `${t.appName} - ${t.welcomeSubject}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0c326f; margin: 0;"><span style="color: #0c326f;">Euro</span>Nova</h1>
        <p style="color: #818181; margin-top: 5px;">${t.trustedBankingPartner}</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #0c326f; margin-top: 0;">${t.welcomeTitle}</h2>
        <p>${t.greeting(user.firstName, user.lastName)}</p>
        <p>${t.welcomeMessage}</p>
        <p>${t.accountCreated}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border-left: 4px solid #0c326f;">
          <p style="margin: 0 0 5px 0;"><strong>${t.clientIdLabel}</strong> <span>${clientId || user.username}</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.passwordLabel}</strong> <span>${password || '********'}</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.accountNumberLabel}</strong> <span>${accountNumber}</span></p>
          ${cardNumber ? `
          <hr style="margin: 10px 0; border: none; border-top: 1px solid #e6e6e6;" />
          <p style="margin: 10px 0 5px 0;"><strong>${t.cardInfoLabel}</strong></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.cardNumberLabel}</strong> <span>${cardNumber}</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.cardExpiryDateLabel}</strong> <span>${cardExpiryDate}</span></p>
          <p style="margin: 0 0 5px 0;"><strong>${t.cardCvvLabel}</strong> <span>${cardCvv}</span></p>
          ` : ''}
        </div>
        
        <p style="color: #EA5455; font-weight: bold;">${t.securityWarning}</p>
        <p>${t.loginInvite}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/auth?username=${user.username}&redirect=/client/dashboard" style="display: inline-block; background-color: #0c326f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">${t.buttonAccessAccount}</a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #818181; text-align: center;">
        <p>${t.confidentialInfo}</p>
        <p>© ${new Date().getFullYear()} EuroNova. ${t.allRightsReserved}</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html, userLang);
}

// Send generic email by type
export async function sendEmailByType(
  type: EmailNotificationType, 
  user: User, 
  data: any
): Promise<boolean> {
  // Utiliser la langue de l'utilisateur s'il en a une définie, sinon français par défaut
  const userLanguage = user.language || 'fr';
  
  switch (type) {
    case 'transaction':
      return sendTransactionEmail(user, data.transaction, data.account);
    case 'reminder':
      return sendPaymentReminderEmail(user, data.verificationStep, data.stepNumber);
    case 'status':
      return sendAccountStatusEmail(user, data.isActive);
    case 'welcome':
      return sendWelcomeEmail(
        user, 
        data.accountNumber, 
        data.clientId, 
        data.password, 
        data.cardNumber, 
        data.cardExpiryDate, 
        data.cardCvv
      );
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

