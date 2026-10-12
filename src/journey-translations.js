// Interface translations only; user messages and records remain untouched.
const rows=[
['Want to stay connected?','जुड़े रहना चाहते हैं?','सम्पर्कमा रहन चाहनुहुन्छ?','¿Quieres mantener el contacto?'],
['Your email address','आपका ईमेल पता','तपाईंको इमेल ठेगाना','Tu correo electrónico'],
['Get updates →','अपडेट पाएँ →','अपडेट पाउनुहोस् →','Recibir novedades →'],
['By selecting Get updates, you agree to save your email for product updates.','अपडेट पाएँ चुनने पर आप उत्पाद अपडेट के लिए अपना ईमेल सहेजने की सहमति देते हैं।','अपडेट पाउनुहोस् छान्दा उत्पादनका अपडेटका लागि आफ्नो इमेल राख्न सहमति दिनुहुन्छ।','Al elegir Recibir novedades, aceptas guardar tu correo para recibir noticias del producto.'],
['YOUR SPACE IS JUST BELOW','आपकी जगह बस नीचे है','तपाईंको ठाउँ तल छ','TU ESPACIO ESTÁ JUSTO DEBAJO'],
['Scroll to chat','चैट तक स्क्रॉल करें','कुराकानीतिर स्क्रोल गर्नुहोस्','Desplazarse al chat'],
['Your space','आपकी जगह','तपाईंको ठाउँ','Tu espacio'],
['Account & sign-in →','खाता और साइन इन →','खाता र साइन इन →','Cuenta e inicio de sesión →'],
['AI self-help prototype.','AI स्व-सहायता प्रोटोटाइप।','AI स्व-सहयोगको प्रारूप।','Prototipo de autoayuda con IA.'],
['Not a therapist.','चिकित्सक नहीं।','चिकित्सक होइन।','No es un terapeuta.'],
['Open a detailed reflection →','विस्तृत चिंतन खोलें →','विस्तृत मनन खोल्नुहोस् →','Abrir una reflexión detallada →'],
['NOTICE YOUR PATTERNS','अपने पैटर्न पर ध्यान दें','आफ्ना ढाँचाहरू हेर्नुहोस्','OBSERVA TUS PATRONES'],
['See your check-ins and return to your reflections. →','अपने चेक-इन देखें और चिंतन पर लौटें। →','आफ्ना चेक-इन हेर्नुहोस् र मननमा फर्कनुहोस्। →','Consulta tus registros y retoma tus reflexiones. →'],
['A MOMENT OF SUPPORT','सहारे का एक पल','सहयोगको एक क्षण','UN MOMENTO DE APOYO'],
['One small step is enough.','एक छोटा कदम काफी है।','एउटा सानो कदम पर्याप्त छ।','Un pequeño paso es suficiente.'],
['Find grounding, breathing, or human support. →','ग्राउंडिंग, साँस के अभ्यास या मानवीय सहायता पाएँ। →','ग्राउन्डिङ, श्वास अभ्यास वा मानवीय सहयोग पाउनुहोस्। →','Encuentra ejercicios de conexión, respiración o apoyo humano. →'],
['What’s on your mind today?','आज आपके मन में क्या है?','आज तपाईंको मनमा के छ?','¿Qué tienes en mente hoy?'],
['Or sign in to save your progress','या अपनी प्रगति सहेजने के लिए साइन इन करें','वा आफ्नो प्रगति राख्न साइन इन गर्नुहोस्','O inicia sesión para guardar tu progreso'],
['Open my daily check-in','मेरा दैनिक चेक-इन खोलें','मेरो दैनिक चेक-इन खोल्नुहोस्','Abrir mi registro diario'],
['Your daily check-in will open with your space.','आपकी जगह के साथ दैनिक चेक-इन खुलेगा।','तपाईंको ठाउँसँगै दैनिक चेक-इन खुल्नेछ।','Tu registro diario se abrirá con tu espacio.'],
['Your space could not open. Please try again.','आपकी जगह नहीं खुल सकी। फिर कोशिश करें।','तपाईंको ठाउँ खोल्न सकिएन। फेरि प्रयास गर्नुहोस्।','No pudimos abrir tu espacio. Inténtalo de nuevo.'],
['Message Paasaa…','Paasaa को संदेश…','Paasaa लाई सन्देश…','Escribe a Paasaa…'],
['Your interest is registered. Thank you.','आपकी रुचि दर्ज कर ली गई है। धन्यवाद।','तपाईंको रुचि दर्ता भयो। धन्यवाद।','Tu interés ha quedado registrado. Gracias.'],
['Updates signup is unavailable right now. Please try again later.','अपडेट के लिए पंजीकरण अभी उपलब्ध नहीं है। बाद में कोशिश करें।','अपडेटका लागि दर्ता अहिले उपलब्ध छैन। पछि प्रयास गर्नुहोस्।','El registro de novedades no está disponible. Inténtalo más tarde.'],
['Check-in added for this visit. Lost on refresh or close.','इस बार का चेक-इन जोड़ा गया। रीफ्रेश या बंद करने पर मिट जाएगा।','यस भ्रमणका लागि चेक-इन थपियो। रिफ्रेस वा बन्द गर्दा हराउँछ।','Registro añadido para esta visita. Se pierde al actualizar o cerrar.']
];
export const journeyTranslations=Object.fromEntries(rows.map(([en,hi,ne,es])=>[en,{hi,ne,es}]));
