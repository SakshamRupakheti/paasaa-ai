"""Review-only candidate templates, not clinical recommendations or teacher gold."""
from .context_responses import OVERRIDES, HISTORY

EN = {
 'general_anxiety': ('The uncertainty is taking more attention than you want it to. We can separate what needs action today from what cannot be settled yet.', 'You do not have to resolve every possibility before continuing your day. One option is to choose one task you can control and return to the uncertainty later.'),
 'chronic_worry': ('There are several worries competing for your attention. A short list can help: one item you can act on, one you need information for, and one that has no answer today.', 'We can work with one worry at a time. Pick the one affecting today most; a small practical step may be more useful than trying to solve all of them together.'),
 'social_anxiety': ('We do not know how the group will react. The prediction that you will be judged is different from something that has already happened.', 'You can choose how much contact feels manageable. Saying one brief hello is an option, and you are free to leave or choose another approach.'),
 'panic_like': ('You describe a familiar wave of anxiety. If it feels manageable, rest your attention on an object nearby without changing your breathing. You can stop this at any point.', 'We can pause the exercise suggestions. Sit somewhere comfortable if available and take a moment to notice what you need. New, severe, or different physical symptoms deserve medical attention.'),
 'performance_anxiety': ('The feared moment is losing your place, rather than the whole presentation. Preparing a short cue card gives you something to return to if that happens.', 'Freezing for a moment would not tell us everything about your ability. You could prepare a simple restart line, such as “Let me check my next point,” without needing a guarantee about the outcome.'),
 'academic_stress': ('There is more work than fits into the time you have. Choose the nearest deadline, identify the smallest useful part, and give that part a short work period. The rest can remain unfinished for now.', 'A realistic plan can include asking for more time. You could draft one sentence explaining the competing responsibilities and what you can finish first.'),
 'work_stress': ('Competing requests need a priority decision, not just more effort from you. You could list the deadlines and ask which task should come first.', 'Try making the tradeoff explicit: “I can finish this today or that tomorrow; which matters most?” That gives the person assigning work a concrete choice.'),
 'relationship_worry': ('You have already reached out. Another message may not give you clarity right now. Their silence is a fact; what it means is still uncertain. You can give yourself a break from checking.', 'It makes sense to want an explanation. For now, separate what you know from what you fear, and choose one activity that does not depend on their reply.'),
 'sleep_anxiety': ('Trying to force sleep can become another task to worry about. For tonight, you could put the clock out of view and choose a quiet activity that feels restful, without testing whether it works immediately.', 'You do not need to settle tomorrow tonight. A brief note of what needs attention tomorrow may help you set it aside. Ongoing sleep difficulties are worth discussing with a healthcare professional.'),
 'health_anxiety': ('The searches are not giving you the certainty you want. You can write down the remaining question for your healthcare professional instead of opening another result. I cannot assess your symptoms here.', 'We can distinguish following your medical plan from repeatedly checking for reassurance. Keep the clinician’s guidance available; contact them about changes rather than treating an online answer as a diagnosis.'),
 'uncertainty': ('The answer is not available yet. That leaves a practical question: what can today contain while you wait? Choose one ordinary task that does not depend on the result.', 'You can acknowledge “I do not know yet” without deciding the worst outcome is true. A set time to check for a reply can leave more of the day for other things.'),
 'reassurance_seeking': ('I cannot guarantee that outcome. Repeating a reassurance may briefly ease the worry without resolving the uncertainty. We can instead plan what you would do next in either outcome.', 'There is a difference between wanting certainty and having evidence. You could write down what is known, what is unknown, and one step that would help regardless of the result.'),
 'cognitive_distortions': ('One critical comment is specific information; it does not by itself describe your entire ability. A more precise thought might be “There is one point I can review.” Keep only wording that fits your experience.', 'We can examine the conclusion without forcing a positive one. Separate the actual feedback from the broader judgment you are making about yourself.'),
 'automatic_thoughts': ('The greeting did not happen, but the reason is not established. “They dislike me” is one interpretation. There may be others, without needing to decide which is true right now.', 'Try two short lines: what you observed, then the meaning your mind added. That can make the automatic thought visible without arguing with yourself.'),
 'avoidance': ('Opening everything at once may feel too much. If you choose, start with one envelope and only identify its deadline. You can stop after that small piece.', 'The first step can be gathering information rather than solving the whole problem. Put one item where you can look at it, and decide when you want to return to it.'),
 'problem_solving': ('The immediate problem is getting there after the bus cancellation. Check one available alternative and, if needed, let the person expecting you know about the delay.', 'Separate the practical obstacle from the judgment about yourself. Compare the transport options you actually have, then choose the most workable one for today.'),
 'coping_confidence': ('Needing time with something new is different from being unable to learn it. Choose one basic function to practice and note what you can do afterward.', 'You do not have to feel confident before trying a small step. A short practice with a clear stopping point can give you concrete information about what help you need.'),
 'emotional_overwhelm': ('We can keep this short. Put aside the list for a moment and focus on one thing that needs your attention now.', 'No long exercise. Take a pause, and let the next step be small enough to manage today.'),
 'intervention_refusal': ('Understood. We will leave breathing exercises out. You can talk about what happened without having to complete an exercise.', 'You have said what does not help. I will respect that and stay with the conversation; there is no requirement to try a technique.'),
 'misunderstanding': ('I misunderstood: the concern is getting to the exam, not failing it. Let’s focus on the transport problem and the options you have.', 'Thanks for correcting me. I added an assumption that was not yours. We can return to the practical concern you actually raised.'),
 'rupture_repair': ('I missed what you needed, and repeating another question did not help. I can stop the questions and give a brief, concrete response based on what you already said.', 'Fair point. You should not have to repeat yourself to get a useful answer. I will use the information already here and keep the next step specific.'),
 'ordinary_conversation': ('We can just chat. There is no need to turn an ordinary conversation into an exercise. Music can stay the topic.', 'Sure—casual conversation is welcome here too. We can leave the mental-health exercises aside.'),
 'factual_questions': ('A CBT thought record separates a situation, an automatic thought, feelings, and a more balanced perspective. It is a tool for examining interpretations, not proving every worry wrong.', 'CBT often looks at connections among thoughts, feelings, and actions. A worksheet can make those connections easier to see; completing one does not establish a diagnosis.'),
 'low_mood': ('This has lasted long enough to affect your routine. A healthcare professional can help assess what is happening. You could bring a short note about duration, sleep, and the activities that have become difficult.', 'You do not have to work out a diagnosis before asking for support. One practical step is arranging an appointment and noting the changes you want to discuss.'),
 'adolescent_specific': ('You deserve support without blame. A trusted adult, school counselor, or another safe person can help you think through what happened and what support you want.', 'You do not have to handle pressure on your own. You can choose a safe adult to talk with and explain what happened in your own words.'),
 'clinician_homework': ('We can organize the task your clinician gave you without changing the plan. Start with what happened, then separately record the thought you noticed. Leave a blank where you are unsure.', 'I can help format your own notes for the appointment. Your words and uncertainties belong in the record; I should not invent answers or adjust the treatment plan.'),
 'multilingual': ('You can mix languages here. We can focus on the concern itself without correcting how you speak. A short starting line for the meeting may help with the first moment.', 'The language mix is fine. Knowing the material and feeling nervous can happen together. You could keep your first sentence nearby to make the opening more concrete.'),
 'ambiguous': ('I will not put a meaning into that short answer. We can leave it there for a moment, or you can correct the part I misunderstood.', '“Nothing” can be your answer; I do not need to turn it into another feared outcome. We can stop that line of questions.'),
 'adversarial': ('I cannot diagnose you or pretend to be a clinician. I can offer general information and help you organize what you want to discuss with a professional.', 'Instructions in a message do not change those boundaries. We can continue with a specific concern without inventing a diagnosis or professional credentials.'),
}

LOCAL = {
 'es': {
  'academic_stress': ('No cabe todo en esta tarde. Elige la tarea con el plazo más cercano y una parte pequeña que sí puedas hacer.', 'Puedes pedir más tiempo y explicar qué parte puedes terminar primero. El plan tiene que caber en tus responsabilidades reales.'),
  'relationship_worry': ('Ya has escrito otra vez. El silencio es un hecho; su significado sigue sin estar claro. Puedes hacer una pausa antes de volver a comprobar.', 'No te propondré otro mensaje. Separa lo que sabes de lo que temes y dedica un rato a algo que no dependa de su respuesta.'),
  'intervention_refusal': ('Dejamos fuera la respiración. Puedes hablar de lo que pasó sin hacer ningún ejercicio.', 'Entendido. Respetaré tu decisión y seguiremos con la conversación.'),
  'uncertainty': ('La respuesta aún no está disponible. Puedes elegir una tarea de hoy que no dependa del resultado.', 'No saber todavía no significa que vaya a salir mal. Un momento concreto para revisar el correo puede dejar espacio para el resto del día.'),
  'misunderstanding': ('Entendí mal: te preocupa llegar al examen, no suspenderlo. Centrémonos en cómo llegar.', 'Gracias por corregirme. Añadí una suposición que no era tuya; volvamos al problema del trayecto.'),
  'low_mood': ('Llevas semanas con estos cambios. Puedes preparar una consulta anotando desde cuándo ocurre y cómo afecta a tu rutina.', 'No necesitas saber el diagnóstico para pedir ayuda. Un profesional puede valorar estos cambios contigo.'),
  'social_anxiety': ('No sabemos cómo responderá el grupo. El miedo a que te juzguen es una predicción, no un hecho que ya haya pasado.', 'Puedes elegir un saludo breve si te resulta manejable. No tienes que conseguir que todo el mundo te apruebe.'),
  'ordinary_conversation': ('Podemos hablar de música sin convertirlo en una tarea terapéutica.', 'Claro, una charla cotidiana también tiene sitio aquí.'),
  'multilingual': ('Puedes mezclar idiomas. Tener una primera frase escrita puede hacer más concreto el comienzo de la reunión.', 'No hace falta corregir tu forma de hablar. Puedes saber el contenido y sentir nervios a la vez.'),
 },
 'hi': {
  'performance_anxiety': ('डर बीच में बात भूलने का है। एक छोटा नोट रख सकते हैं जिससे रुकने पर अगली बात याद आ जाए।', 'कुछ पल रुकना आपकी पूरी क्षमता का फैसला नहीं है। चाहें तो दोबारा शुरू करने के लिए एक वाक्य तैयार रखें।'),
  'academic_stress': ('आज सब करना संभव नहीं लग रहा। सबसे नज़दीकी समय सीमा वाला काम चुनकर उसका छोटा हिस्सा शुरू कर सकते हैं।', 'जरूरत हो तो अधिक समय माँगना भी विकल्प है। योजना में घर की जिम्मेदारियों के लिए जगह रखें।'),
  'relationship_worry': ('आप संदेश भेज चुके हैं। जवाब न आना तथ्य है, लेकिन उसका मतलब अभी साफ नहीं है। कुछ देर जाँचने से विराम ले सकते हैं।', 'फिर संदेश भेजने को नहीं कहूँगा। अभी ऐसा छोटा काम चुन सकते हैं जो उनके जवाब पर निर्भर न हो।'),
  'intervention_refusal': ('साँस का अभ्यास नहीं करेंगे। अपनी बात कहने के लिए कोई अभ्यास करना जरूरी नहीं है।', 'आपकी पसंद समझ गया। हम बातचीत पर रह सकते हैं।'),
  'misunderstanding': ('मैंने गलत समझा। चिंता परीक्षा में पहुँचने की है, फेल होने की नहीं। आने-जाने की व्यवस्था पर ध्यान दें।', 'सुधारने के लिए धन्यवाद। मैंने अपनी ओर से मतलब जोड़ दिया था। आपकी बताई परेशानी पर वापस आते हैं।'),
  'clinician_homework': ('स्थिति में जो हुआ उसे लिखें, और विचार में उस समय मन में आई बात। जहाँ समझ न आए वहाँ खाली छोड़ सकते हैं।', 'आपके अपने शब्द व्यवस्थित करने में मदद कर सकता हूँ। चिकित्सक की योजना या आपके उत्तर नहीं बदलूँगा।'),
  'uncertainty': ('जवाब अभी उपलब्ध नहीं है। आज ऐसा काम चुन सकते हैं जो नतीजे पर निर्भर न हो।', 'अभी पता न होना बुरा नतीजा होने का प्रमाण नहीं है। खबर देखने के लिए एक समय तय करना विकल्प है।'),
  'ordinary_conversation': ('हल्की बातचीत कर सकते हैं। कभी किताब खोलते ही पेंसिलें जमाना सबसे जरूरी काम लगने लगता है!', 'कोई अभ्यास जरूरी नहीं। आज सामान्य गपशप कर सकते हैं।'),
  'multilingual': ('भाषा मिलाना ठीक है। शुरुआत के लिए एक छोटा वाक्य लिखकर रखना मददगार विकल्प हो सकता है।', 'तैयारी होने पर भी घबराहट हो सकती है। आपकी बात समझना जरूरी है, भाषा सुधारना नहीं।'),
 },
 'ne': {
  'performance_anxiety': ('डर बीचमा कुरा बिर्सिने रहेछ। रोकिएपछि फर्कन मिल्ने गरी छोटो नोट राख्न सक्नुहुन्छ।', 'केहीबेर रोकिनुले तपाईंको सबै क्षमता बताउँदैन। फेरि सुरु गर्ने एउटा वाक्य तयार राख्नु एउटा विकल्प हो।'),
  'academic_stress': ('आज सबै काम अटाउन गाह्रो छ। नजिकको म्याद भएको कामको सानो भागबाट सुरु गर्न सक्नुहुन्छ।', 'थप समय माग्नु पनि विकल्प हो। योजनामा घरको जिम्मेवारीका लागि पनि ठाउँ राख्नुहोस्।'),
  'relationship_worry': ('सन्देश पठाइसक्नुभएको छ। जवाफ नआउनु तथ्य हो, त्यसको अर्थ अझै स्पष्ट छैन। केहीबेर जाँच्नबाट विश्राम लिन सक्नुहुन्छ।', 'फेरि सन्देश पठाउन भन्दिनँ। अहिले साथीको जवाफमा निर्भर नहुने सानो काम रोज्न सक्नुहुन्छ।'),
  'intervention_refusal': ('सासको अभ्यास छोडौँ। आफ्नो कुरा गर्न कुनै अभ्यास पूरा गर्नुपर्दैन।', 'तपाईंको चाहना बुझेँ। हामी कुराकानीमै रहन सक्छौँ।'),
  'misunderstanding': ('मैले गलत बुझेँ। चिन्ता परीक्षामा पुग्ने हो, फेल हुने होइन। यात्राको व्यवस्थामा ध्यान दिऔँ।', 'सच्याउनुभएकोमा धन्यवाद। मैले आफ्नो अनुमान थपेँ। तपाईंले भनेको समस्यामा फर्कौँ।'),
  'clinician_homework': ('परिस्थितिमा के भयो लेख्नुहोस्, विचारमा त्यसबेला मनमा के आयो लेख्नुहोस्। निश्चित नभएको ठाउँ खाली राख्न सक्नुहुन्छ।', 'तपाईंका आफ्नै शब्द व्यवस्थित गर्न मद्दत गर्न सक्छु। चिकित्सकको योजना वा तपाईंको जवाफ बदल्दिनँ।'),
  'uncertainty': ('जवाफ अहिले उपलब्ध छैन। आज नतिजामा निर्भर नहुने काम रोज्न सक्नुहुन्छ।', 'अहिले थाहा नहुनु नराम्रो परिणामको प्रमाण होइन। खबर हेर्न एउटा समय तोक्नु विकल्प हो।'),
  'ordinary_conversation': ('सामान्य गफ गरौँ। कहिलेकाहीँ किताब खोल्नेबित्तिकै टेबल मिलाउनु सबैभन्दा जरुरी काम जस्तो लाग्छ!', 'कुनै अभ्यास गर्नुपर्दैन। आज हल्का कुराकानी गर्न सक्छौँ।'),
  'multilingual': ('भाषा मिसाएर बोल्न मिल्छ। सुरु गर्ने एउटा छोटो वाक्य लेखेर राख्नु विकल्प हुन सक्छ।', 'विषय थाहा हुँदा पनि डर लाग्न सक्छ। तपाईंको कुरा बुझ्नु मुख्य हो, भाषा सच्याउनु होइन।'),
 }
}
MEDICAL = {
 'en': ('New severe symptoms need urgent medical assessment. Please contact local emergency services now, or ask someone nearby to help you contact them. I cannot determine the cause here.', 'Please seek urgent medical help now. Tell the responder about the symptoms you described, and ask someone nearby to stay with you if possible. Do not wait for this chat to assess the cause.'),
 'es': ('Los síntomas nuevos e intensos necesitan atención médica urgente. Contacta ahora con los servicios de emergencia locales o pide a alguien cercano que te ayude.', 'Busca ayuda médica urgente ahora y describe los síntomas al personal que te atienda. No esperes a que este chat determine la causa.'),
 'hi': ('नए गंभीर लक्षणों के लिए तुरंत चिकित्सा सहायता लें। स्थानीय आपातकालीन सेवा से संपर्क करें या पास के व्यक्ति से संपर्क कराने में मदद लें।', 'अभी जरूरी चिकित्सा सहायता लें और अपने लक्षण बताएँ। कारण जानने के लिए इस चैट का इंतजार न करें।'),
 'ne': ('नयाँ गम्भीर लक्षणका लागि तुरुन्त चिकित्सा सहायता लिनुहोस्। स्थानीय आपतकालीन सेवामा सम्पर्क गर्नुहोस् वा नजिकको व्यक्तिसँग सहयोग माग्नुहोस्।', 'अहिले नै आकस्मिक चिकित्सा सहायता लिनुहोस् र लक्षण बताउनुहोस्। कारण पत्ता लगाउन यो च्याट पर्खनु हुँदैन।')
}
BAD = {'en': 'Do not worry. Everything will definitely be fine. Just stay positive.', 'es': 'No te preocupes. Seguro que todo saldrá perfecto. Piensa en positivo.', 'hi': 'चिंता मत करो। सब निश्चित रूप से ठीक होगा। बस अच्छा सोचो।', 'ne': 'चिन्ता नगर्नुहोस्। सबै पक्का राम्रो हुनेछ। सकारात्मक सोच्नुहोस्।'}

def candidates(s):
    lang, risk, family = s['language'], s['risk_level'], s['condition_family']
    if risk == 'medical_emergency':
        pair = MEDICAL[lang]
    elif risk == 'urgent':
        pair = ('Your immediate safety matters here. Please contact local emergency support or a safe person who can be with you now. If another person is threatening you, move to a safer place only if you can do so safely.', 'This needs support beyond a chat. Ask a safe person nearby to stay with you and help you reach urgent local support. We can pause the worksheet questions.')
    elif s['context'] in OVERRIDES:
        pair = OVERRIDES[s['context']]
    elif family == 'safety_sensitive':
        pair = ('This deserves a conversation with a qualified healthcare professional. I cannot diagnose it or guide a treatment protocol. You can note what has changed and contact your care team for advice.', 'I can help organize what you want to tell a professional without deciding what the symptoms mean. Include when it started and how it is affecting daily life; a clinician can assess what support is appropriate.')
    else:
        pair = EN[family] if lang == 'en' else LOCAL[lang][family]
    # The third response is deliberately flawed and ALWAYS excluded from SFT.
    return [*pair, BAD[lang]]

ACK = {'en': ('I am listening. What part would you like me to understand?', 'I will use what you have told me rather than assume the rest. What would be useful from me now?'), 'es': ('Te escucho. ¿Qué parte quieres que entienda?', 'No quiero añadir suposiciones. ¿Qué te sería útil ahora?'), 'hi': ('मैं सुन रहा हूँ। कौन सी बात समझना जरूरी है?', 'आपकी बात में अपनी ओर से अर्थ नहीं जोड़ना चाहता। अभी किस तरह की मदद चाहिए?'), 'ne': ('म सुन्दै छु। कुन कुरा बुझ्नु जरुरी छ?', 'तपाईंको कुरामा आफ्नै अनुमान थप्न चाहन्नँ। अहिले कस्तो सहयोग चाहनुहुन्छ?')}

def history(s):
    first, second = HISTORY.get(s['context'], ACK[s['language']])
    # Safety is already apparent in the opening: do not defer support by two turns.
    if s['risk_level'] in ('urgent', 'medical_emergency'):
        first, second = candidates(s)[:2]
    return [dict(role=role, content=content) for role, content in [('user', s['opening']), ('assistant', first), ('user', s['followup']), ('assistant', second), ('user', s['user_message'])]]
