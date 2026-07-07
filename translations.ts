export type Lang = 'en' | 'hi';

export const translations = {
  en: {
    // Nav
    home: 'Home', documents: 'Documents', ebooks: 'E-Books', search: 'Search',
    login: 'Login', signup: 'Sign Up', logout: 'Logout',
    dashboard: 'Dashboard', adminPanel: 'Admin Panel', creatorDashboard: 'Creator Dashboard',
    profile: 'Profile', settings: 'Settings', myUploads: 'My Uploads',
    myDownloads: 'My Downloads', savedDocs: 'Saved Documents',
    notifications: 'Notifications', pricing: 'Pricing',

    // Hero
    heroTitle: 'Knowledge Without Limits',
    heroSubtitle: 'Access thousands of study materials, notes, research papers, and e-books. Upload, share, and learn together.',
    heroSearch: 'Search documents, notes, papers...',
    browseAll: 'Browse All', getStarted: 'Get Started Free',

    // Sections
    featuredDocs: 'Featured Documents', featuredEbooks: 'Featured E-Books',
    trendingNotes: 'Trending Notes', popularCategories: 'Popular Categories',
    topContributors: 'Top Contributors', latestUploads: 'Latest Uploads',
    premiumResources: 'Premium Resources', testimonials: 'What Students Say',
    pricingPlans: 'Simple Pricing', faq: 'Frequently Asked Questions',
    viewAll: 'View All', seeMore: 'See More',

    // Actions
    download: 'Download', preview: 'Preview', save: 'Save', share: 'Share',
    like: 'Like', comment: 'Comment', report: 'Report', upload: 'Upload',
    delete: 'Delete', edit: 'Edit', approve: 'Approve', reject: 'Reject',
    cancel: 'Cancel', submit: 'Submit', continue: 'Continue', back: 'Back',
    confirm: 'Confirm', close: 'Close', copy: 'Copy', copied: 'Copied!',

    // Auth
    emailAddress: 'Email Address', password: 'Password', fullName: 'Full Name',
    confirmPassword: 'Confirm Password', rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?', resetPassword: 'Reset Password',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
    orContinueWith: 'Or continue with', googleLogin: 'Continue with Google',
    signInToAccount: 'Sign in to your account', createAccount: 'Create your account',
    verifyEmail: 'Verify your email', emailSent: 'Reset email sent!',

    // Document
    fileType: 'File Type', fileSize: 'File Size', category: 'Category',
    uploadedBy: 'Uploaded by', uploadDate: 'Upload Date', views: 'Views',
    downloads: 'Downloads', likes: 'Likes', tags: 'Tags',
    description: 'Description', relatedDocs: 'Related Documents',
    premiumOnly: 'Premium Only', freeDoc: 'Free',
    addComment: 'Add a comment...', postComment: 'Post Comment',
    noComments: 'No comments yet. Be the first to comment!',

    // Upload
    uploadDoc: 'Upload Document', uploadEbook: 'Upload E-Book',
    dragDrop: 'Drag & drop file here', orBrowse: 'or browse to upload',
    acceptedFormats: 'Accepted formats: PDF, DOCX, PPT, PPTX, TXT',
    title: 'Title', titleRequired: 'Title is required',
    uploadSuccess: 'Upload successful! Awaiting admin approval.',
    uploading: 'Uploading...', selectCategory: 'Select Category',
    setPremium: 'Premium Content', addTags: 'Add Tags',

    // Subscription
    choosePlan: 'Choose Your Plan', upgradePlan: 'Upgrade Plan',
    currentPlan: 'Current Plan', planActive: 'Active', planExpired: 'Expired',
    upgradeNow: 'Upgrade Now', getProPlan: 'Get Pro', getPremiumPlan: 'Get Premium',
    subscriptionDetails: 'Subscription Details', expiresOn: 'Expires on',

    // Payment
    paymentInstructions: 'Payment Instructions',
    step1: 'Step 1: Pay via UPI', step2: 'Step 2: Upload Screenshot',
    step3: 'Step 3: Wait for Approval',
    upiId: 'UPI ID', scanQR: 'Scan QR Code to Pay',
    copyUpiId: 'Copy UPI ID', transactionId: 'Transaction ID (optional)',
    uploadScreenshot: 'Upload Payment Screenshot',
    paymentPending: 'Payment Pending Review',
    paymentApproved: 'Payment Approved!', paymentRejected: 'Payment Rejected',

    // Admin
    totalUsers: 'Total Users', totalDocuments: 'Total Documents',
    totalEbooks: 'Total E-Books', totalDownloads: 'Total Downloads',
    pendingApprovals: 'Pending Approvals', pendingPayments: 'Pending Payments',
    userManagement: 'User Management', contentModeration: 'Content Moderation',
    paymentVerification: 'Payment Verification', categoryManagement: 'Category Management',
    siteSettings: 'Site Settings', reportsManagement: 'Reports',
    subscriptionManagement: 'Subscriptions',

    // Status
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
    active: 'Active', inactive: 'Inactive', free: 'Free', premium: 'Premium',
    loading: 'Loading...', error: 'Something went wrong', noData: 'No data found',
    noResults: 'No results found', tryAgain: 'Try again',

    // AI
    aiSummary: 'AI Summary', aiKeywords: 'Key Topics', generateSummary: 'Generate Summary',
    aiQuestions: 'Practice Questions', aiNotes: 'AI Study Notes',
    studyAssistant: 'AI Study Assistant', generating: 'Generating...',

    // Language
    switchLanguage: 'हिंदी', language: 'Language',

    // Legal
    aboutUs: 'About Us', contactUs: 'Contact Us', privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions', dmcaPolicy: 'DMCA Policy',
    refundPolicy: 'Refund Policy',

    // Misc
    darkMode: 'Dark Mode', lightMode: 'Light Mode',
    searchPlaceholder: 'Search documents, notes, e-books...',
    noDownloadsLeft: 'Daily download limit reached (1 per day). Upgrade to Premium for unlimited downloads.',
    loginRequired: 'Please login to continue.',
    readingProgress: 'Reading Progress', continueReading: 'Continue Reading',
    startReading: 'Start Reading',
  },

  hi: {
    // Nav
    home: 'होम', documents: 'दस्तावेज़', ebooks: 'ई-बुक्स', search: 'खोज',
    login: 'लॉगिन', signup: 'साइन अप', logout: 'लॉगआउट',
    dashboard: 'डैशबोर्ड', adminPanel: 'एडमिन पैनल', creatorDashboard: 'क्रिएटर डैशबोर्ड',
    profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स', myUploads: 'मेरे अपलोड',
    myDownloads: 'मेरे डाउनलोड', savedDocs: 'सेव्ड दस्तावेज़',
    notifications: 'सूचनाएं', pricing: 'मूल्य निर्धारण',

    // Hero
    heroTitle: 'ज्ञान की कोई सीमा नहीं',
    heroSubtitle: 'हजारों अध्ययन सामग्री, नोट्स, शोध पत्र और ई-पुस्तकें एक्सेस करें। अपलोड करें, शेयर करें और साथ मिलकर सीखें।',
    heroSearch: 'दस्तावेज़, नोट्स, पेपर खोजें...',
    browseAll: 'सभी देखें', getStarted: 'मुफ़्त शुरू करें',

    // Sections
    featuredDocs: 'फ़ीचर्ड दस्तावेज़', featuredEbooks: 'फ़ीचर्ड ई-बुक्स',
    trendingNotes: 'ट्रेंडिंग नोट्स', popularCategories: 'लोकप्रिय श्रेणियां',
    topContributors: 'शीर्ष योगदानकर्ता', latestUploads: 'नवीनतम अपलोड',
    premiumResources: 'प्रीमियम संसाधन', testimonials: 'छात्र क्या कहते हैं',
    pricingPlans: 'सरल मूल्य निर्धारण', faq: 'अक्सर पूछे जाने वाले प्रश्न',
    viewAll: 'सभी देखें', seeMore: 'और देखें',

    // Actions
    download: 'डाउनलोड', preview: 'प्रीव्यू', save: 'सेव', share: 'शेयर',
    like: 'लाइक', comment: 'टिप्पणी', report: 'रिपोर्ट', upload: 'अपलोड',
    delete: 'हटाएं', edit: 'संपादित करें', approve: 'अनुमोदित करें', reject: 'अस्वीकार करें',
    cancel: 'रद्द करें', submit: 'जमा करें', continue: 'जारी रखें', back: 'वापस',
    confirm: 'पुष्टि करें', close: 'बंद करें', copy: 'कॉपी करें', copied: 'कॉपी हो गया!',

    // Auth
    emailAddress: 'ईमेल पता', password: 'पासवर्ड', fullName: 'पूरा नाम',
    confirmPassword: 'पासवर्ड की पुष्टि करें', rememberMe: 'मुझे याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?', resetPassword: 'पासवर्ड रीसेट करें',
    noAccount: 'खाता नहीं है?', hasAccount: 'पहले से खाता है?',
    orContinueWith: 'या जारी रखें', googleLogin: 'Google से जारी रखें',
    signInToAccount: 'अपने खाते में साइन इन करें', createAccount: 'अपना खाता बनाएं',
    verifyEmail: 'ईमेल सत्यापित करें', emailSent: 'रीसेट ईमेल भेज दिया!',

    // Document
    fileType: 'फ़ाइल प्रकार', fileSize: 'फ़ाइल आकार', category: 'श्रेणी',
    uploadedBy: 'अपलोड किया', uploadDate: 'अपलोड तिथि', views: 'व्यूज़',
    downloads: 'डाउनलोड', likes: 'लाइक्स', tags: 'टैग',
    description: 'विवरण', relatedDocs: 'संबंधित दस्तावेज़',
    premiumOnly: 'प्रीमियम केवल', freeDoc: 'मुफ़्त',
    addComment: 'टिप्पणी जोड़ें...', postComment: 'टिप्पणी करें',
    noComments: 'अभी तक कोई टिप्पणी नहीं। पहले टिप्पणी करें!',

    // Upload
    uploadDoc: 'दस्तावेज़ अपलोड करें', uploadEbook: 'ई-बुक अपलोड करें',
    dragDrop: 'यहाँ फ़ाइल खींचें और छोड़ें', orBrowse: 'या ब्राउज़ करें',
    acceptedFormats: 'स्वीकृत प्रारूप: PDF, DOCX, PPT, PPTX, TXT',
    title: 'शीर्षक', titleRequired: 'शीर्षक आवश्यक है',
    uploadSuccess: 'अपलोड सफल! एडमिन अनुमोदन की प्रतीक्षा में।',
    uploading: 'अपलोड हो रहा है...', selectCategory: 'श्रेणी चुनें',
    setPremium: 'प्रीमियम सामग्री', addTags: 'टैग जोड़ें',

    // Subscription
    choosePlan: 'अपना प्लान चुनें', upgradePlan: 'प्लान अपग्रेड करें',
    currentPlan: 'वर्तमान प्लान', planActive: 'सक्रिय', planExpired: 'समाप्त',
    upgradeNow: 'अभी अपग्रेड करें', getProPlan: 'प्रो लें', getPremiumPlan: 'प्रीमियम लें',
    subscriptionDetails: 'सदस्यता विवरण', expiresOn: 'समाप्ति तिथि',

    // Payment
    paymentInstructions: 'भुगतान निर्देश',
    step1: 'चरण 1: UPI से भुगतान करें', step2: 'चरण 2: स्क्रीनशॉट अपलोड करें',
    step3: 'चरण 3: अनुमोदन की प्रतीक्षा करें',
    upiId: 'UPI आईडी', scanQR: 'भुगतान के लिए QR स्कैन करें',
    copyUpiId: 'UPI ID कॉपी करें', transactionId: 'ट्रांजैक्शन ID (वैकल्पिक)',
    uploadScreenshot: 'भुगतान स्क्रीनशॉट अपलोड करें',
    paymentPending: 'भुगतान समीक्षाधीन',
    paymentApproved: 'भुगतान स्वीकृत!', paymentRejected: 'भुगतान अस्वीकृत',

    // Admin
    totalUsers: 'कुल उपयोगकर्ता', totalDocuments: 'कुल दस्तावेज़',
    totalEbooks: 'कुल ई-बुक्स', totalDownloads: 'कुल डाउनलोड',
    pendingApprovals: 'लंबित अनुमोदन', pendingPayments: 'लंबित भुगतान',
    userManagement: 'उपयोगकर्ता प्रबंधन', contentModeration: 'सामग्री मॉडरेशन',
    paymentVerification: 'भुगतान सत्यापन', categoryManagement: 'श्रेणी प्रबंधन',
    siteSettings: 'साइट सेटिंग्स', reportsManagement: 'रिपोर्ट्स',
    subscriptionManagement: 'सदस्यता',

    // Status
    pending: 'लंबित', approved: 'अनुमोदित', rejected: 'अस्वीकृत',
    active: 'सक्रिय', inactive: 'निष्क्रिय', free: 'मुफ़्त', premium: 'प्रीमियम',
    loading: 'लोड हो रहा है...', error: 'कुछ गलत हो गया', noData: 'कोई डेटा नहीं',
    noResults: 'कोई परिणाम नहीं', tryAgain: 'पुनः प्रयास करें',

    // AI
    aiSummary: 'AI सारांश', aiKeywords: 'मुख्य विषय', generateSummary: 'सारांश बनाएं',
    aiQuestions: 'अभ्यास प्रश्न', aiNotes: 'AI अध्ययन नोट्स',
    studyAssistant: 'AI अध्ययन सहायक', generating: 'बना रहे हैं...',

    // Language
    switchLanguage: 'English', language: 'भाषा',

    // Legal
    aboutUs: 'हमारे बारे में', contactUs: 'संपर्क करें', privacyPolicy: 'गोपनीयता नीति',
    termsConditions: 'नियम और शर्तें', dmcaPolicy: 'DMCA नीति',
    refundPolicy: 'वापसी नीति',

    // Misc
    darkMode: 'डार्क मोड', lightMode: 'लाइट मोड',
    searchPlaceholder: 'दस्तावेज़, नोट्स, ई-बुक्स खोजें...',
    noDownloadsLeft: 'दैनिक डाउनलोड सीमा समाप्त (1 प्रतिदिन)। असीमित डाउनलोड के लिए प्रीमियम में अपग्रेड करें।',
    loginRequired: 'जारी रखने के लिए लॉगिन करें।',
    readingProgress: 'पढ़ने की प्रगति', continueReading: 'पढ़ना जारी रखें',
    startReading: 'पढ़ना शुरू करें',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
