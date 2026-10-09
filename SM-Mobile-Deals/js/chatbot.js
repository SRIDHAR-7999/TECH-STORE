/* ==========================================================================
   CHATBOT — AI-assisted FAQ assistant.
   Runs fully client-side: keyword parsing → intent detection → response
   builder. No external AI API call, so it works offline. Supports English,
   Tamil and Hindi — add more languages by extending the I18N table below.
   ========================================================================== */

const Chatbot = (() => {
  let lang = localStorage.getItem('smd_chat_lang') || 'en';
  let history = [];
  // Set right after we tell the customer we can "arrange it for you" — their
  // very next message is treated as the model/budget they're describing,
  // gets forwarded to the admin, and they're told they can pay the advance
  // now instead of waiting on a reply.
  let awaitingArrangeDetails = false;

  const I18N = {
    en: {
      title: 'SM Assistant', subtitle: 'Ask me anything, we reply instantly',
      placeholder: 'Ask about a product, price, delivery…',
      greet: `Hi! 👋 I'm the SM Mobile Deals assistant. Ask me about products, prices, payment, delivery or warranty.`,
      store_info: `We're ${SITE_CONFIG.legalName}, located at ${SITE_CONFIG.address}. Open ${SITE_CONFIG.timings}.`,
      contact_info: `You can reach us at ${SITE_CONFIG.phones.join(' or ')}, or WhatsApp us directly.`,
      payment_info: `We accept UPI (GPay / PhonePe / Paytm) via QR code and credit/debit cards. After paying, upload your payment screenshot on the payment page — our team confirms it and your order status updates to "Confirmed". Card payments may include a small processing surcharge shown at checkout.`,
      delivery_info: `Customers in Tamil Nadu get 1-day delivery with Cash on Delivery available. Outside Tamil Nadu, delivery takes 2-3 days and requires full online payment before shipment. Every order ships by courier and can be tracked on the Order Tracking page.`,
      warranty_info: `All products come with standard manufacturer warranty (typically 1 year on phones/laptops, 6 months on accessories). Warranty cards are shared at the time of delivery.`,
      emi_info: `We support No-Cost EMI on major credit cards (3, 6, 9 and 12 month tenures) for orders above ₹5,000 — select it as your card option at checkout. Contact us on WhatsApp for bank-specific EMI eligibility.`,
      return_info: `We offer a 7-day replacement window for manufacturing defects (not for change-of-mind) on new products — the item must be unused, in original packaging with all accessories. Second-hand/sealed-cut/demo units are sold as inspected and are not eligible for return unless the defect was not disclosed. Message us on WhatsApp with your Order ID to start a return.`,
      service_info: `Need a repair or service checkup? Book a free appointment — pick a date and time, tell us the issue, and we'll confirm whether to bring it to the shop or courier it in.`,
      no_match: `I couldn't quite understand that — try asking about a brand, price range (e.g. "phones under 30000"), delivery, payment or warranty.`,
      foundProducts: (n) => `Here's what I found (${n} result${n===1?'':'s'}):`,
      noProducts: `I couldn't find a matching product — try a different brand or budget.`,
      notAvailableArrange: `We may not have that exact one in stock right now — but we can still arrange it for you. Pay an advance to confirm, and our team will source it and update you. Call/WhatsApp us and tell us what you're looking for, or just tell me the exact model here and I'll pass it on.`,
      arrangeForwarded: `Got it — I've passed your request to our team along with your details, they'll check and get back to you. If you don't hear back soon, you can go ahead and pay the advance below right now to confirm the order — that way we start arranging it immediately either way.`,
      contactCardIntro: `Here's how to reach us:`,
      compareIntro: `Here's a quick comparison:`,
      viewMore: 'See all matching products →',
      orderAsk: `Sure — what's your Order ID? It looks like SMD260712345 (check your Orders page or the confirmation you got).`,
      orderNotFound: `I couldn't find an order with that ID. Double-check it on your Orders page, or ask our team on WhatsApp.`,
      orderStatusFound: (id, statusLabel) => `Order ${id} is currently: ${statusLabel}.`,
      paymentConfirmInfo: `To pay: scan the QR below with any UPI app (GPay/PhonePe/Paytm), or use UPI ID **${SITE_CONFIG.upiId}**. After paying, upload your screenshot on the Payment page — our team confirms it manually. Need a human? WhatsApp us directly:`,
      suggestions: ['Phones under 30000', 'Low budget models', 'Track my order', 'Payment options', 'Second-hand phones', 'Second-hand laptops'],
    },
    ta: {
      title: 'SM உதவியாளர்', subtitle: 'எதுவும் கேளுங்கள், உடனே பதில் தருகிறோம்',
      placeholder: 'பொருள், விலை, டெலிவரி பற்றி கேளுங்கள்…',
      greet: `வணக்கம்! 👋 நான் SM Mobile Deals உதவியாளர். பொருட்கள், விலை, பேமெண்ட், டெலிவரி அல்லது வாரண்டி பற்றி கேளுங்கள்.`,
      store_info: `நாங்கள் ${SITE_CONFIG.legalName}, ${SITE_CONFIG.address} இல் உள்ளோம். திறந்திருக்கும் நேரம்: ${SITE_CONFIG.timings}.`,
      contact_info: `எங்களை ${SITE_CONFIG.phones.join(' அல்லது ')} இல் தொடர்பு கொள்ளலாம், அல்லது WhatsApp செய்யலாம்.`,
      payment_info: `நாங்கள் UPI (GPay / PhonePe / Paytm) QR மூலமும், கிரெடிட்/டெபிட் கார்டு மூலமும் பேமெண்ட் ஏற்கிறோம். பணம் செலுத்திய பிறகு, ஸ்கிரீன்ஷாட்டை payment பக்கத்தில் அப்லோட் செய்யவும் — எங்கள் அணி உறுதி செய்த பிறகு ஆர்டர் "Confirmed" ஆக மாறும். கார்டு பேமெண்ட்டுக்கு சிறிய extra charge இருக்கலாம்.`,
      delivery_info: `தமிழ்நாட்டில் 1-நாள் டெலிவரி + Cash on Delivery உண்டு. மற்ற மாநிலங்களுக்கு 2-3 நாட்கள், முழு ஆன்லைன் பேமெண்ட் தேவை. ஆர்டரை Tracking பக்கத்தில் பார்க்கலாம்.`,
      warranty_info: `அனைத்து பொருட்களுக்கும் நிறுவனத்தின் நிலையான வாரண்டி (போன்/லேப்டாப் 1 வருடம், அக்செசரீஸ் 6 மாதம்） உண்டு.`,
      emi_info: `₹5,000க்கு மேல் order-க்கு No-Cost EMI (3, 6, 9, 12 மாதங்கள்) major credit cards-ல கிடைக்கும் — checkout-ல card option select பண்ணுங்க. Bank-specific details-க்கு WhatsApp-ல கேளுங்கள்.`,
      return_info: `Manufacturing defect இருந்தா 7-நாள் replacement window உண்டு (mind-change-க்கு இல்ல) — item unused ah, original packaging-ல இருக்கணும். Second-hand/seal-cut/demo units return ஆகாது (already inspected). Return start பண்ண Order ID-உடன் WhatsApp-ல message பண்ணுங்க.`,
      service_info: `Repair அல்லது service வேணுமா? ஒரு appointment book பண்ணுங்க — date, time தேர்ந்தெடுத்து, issue சொல்லுங்க, shop-க்கு வரணுமா courier பண்ணணுமா நாங்க confirm பண்றோம்.`,
      no_match: `புரியவில்லை — பிராண்ட், விலை வரம்பு (எ.கா. "30000க்குள் போன்"), டெலிவரி, பேமெண்ட் அல்லது வாரண்டி பற்றி கேளுங்கள்.`,
      foundProducts: (n) => `இதோ கிடைத்தவை (${n}):`,
      noProducts: `பொருந்தும் பொருள் கிடைக்கவில்லை — வேறு பிராண்ட் அல்லது பட்ஜெட் முயற்சிக்கவும்.`,
      notAvailableArrange: `இது இப்போது stock-ல இல்லைன்னாலும், உங்களுக்காக arrange பண்ணி தரலாம். Advance பணம் கட்டி confirm பண்ணுங்க, நாங்க அதை source பண்ணி update பண்றோம். Call/WhatsApp பண்ணி என்ன model வேணும்னு சொல்லுங்க, அல்லது இங்கயே exact model பெயரை சொன்னா நான் அனுப்பி வைக்கிறேன்.`,
      arrangeForwarded: `சரி — உங்க request-ஐ உங்க details-உடன் எங்க team-க்கு அனுப்பி வச்சிருக்கேன், அவங்க check பண்ணி reply பண்ணுவாங்க. உடனே reply வரலைனா, கீழே இருக்கும் advance payment-ஐ இப்போவே கட்டி order-ஐ confirm பண்ணலாம் — அப்போ இரண்டு வழியிலயும் நாங்க உடனே arrange பண்ண ஆரம்பிக்கிறோம்.`,
      contactCardIntro: `எங்களை இப்படி தொடர்பு கொள்ளலாம்:`,
      compareIntro: `ஒப்பீடு:`,
      viewMore: 'எல்லா பொருட்களையும் பார்க்க →',
      orderAsk: `உங்க Order ID சொல்லுங்க? SMD260712345 மாதிரி இருக்கும் (Orders பக்கத்தில் பாருங்க).`,
      orderNotFound: `அந்த ID-ல order கிடைக்கவில்லை. Orders பக்கத்தில் சரி பார்க்கவும், அல்லது WhatsApp-ல கேளுங்கள்.`,
      orderStatusFound: (id, statusLabel) => `Order ${id} தற்போது: ${statusLabel}.`,
      paymentConfirmInfo: `பணம் செலுத்த: கீழே இருக்கும் QR-ஐ எந்த UPI app-லும் (GPay/PhonePe/Paytm) scan செய்யவும், அல்லது UPI ID **${SITE_CONFIG.upiId}** பயன்படுத்தவும். செலுத்திய பிறகு screenshot-ஐ Payment பக்கத்தில் upload செய்யவும். நேரடியா பேச WhatsApp:`,
      suggestions: ['30000க்குள் போன்', 'Low budget models', 'Order status', 'பேமெண்ட் வழிமுறை', 'Second-hand phones', 'Second-hand laptops'],
    },
    hi: {
      title: 'SM सहायक', subtitle: 'कुछ भी पूछें, हम तुरंत जवाब देंगे',
      placeholder: 'प्रोडक्ट, कीमत, डिलीवरी के बारे में पूछें…',
      greet: `नमस्ते! 👋 मैं SM Mobile Deals असिस्टेंट हूँ। प्रोडक्ट, कीमत, पेमेंट, डिलीवरी या वारंटी के बारे में पूछें।`,
      store_info: `हम ${SITE_CONFIG.legalName} हैं, ${SITE_CONFIG.address} पर स्थित। समय: ${SITE_CONFIG.timings}.`,
      contact_info: `हमसे ${SITE_CONFIG.phones.join(' या ')} पर संपर्क करें, या WhatsApp करें।`,
      payment_info: `हम UPI (GPay/PhonePe/Paytm) QR और क्रेडिट/डेबिट कार्ड स्वीकार करते हैं। पेमेंट के बाद स्क्रीनशॉट पेमेंट पेज पर अपलोड करें — हमारी टीम कन्फर्म करने के बाद ऑर्डर "Confirmed" हो जाएगा। कार्ड पेमेंट पर थोड़ा extra charge लग सकता है।`,
      delivery_info: `तमिलनाडु में 1-दिन डिलीवरी और Cash on Delivery उपलब्ध है। अन्य राज्यों में 2-3 दिन लगते हैं और पूरा ऑनलाइन पेमेंट पहले करना होगा। ऑर्डर को Tracking पेज पर ट्रैक करें।`,
      warranty_info: `सभी प्रोडक्ट्स पर स्टैंडर्ड मैन्युफैक्चरर वारंटी है (फोन/लैपटॉप पर 1 साल, एक्सेसरीज़ पर 6 महीने)।`,
      emi_info: `₹5,000 से ऊपर के ऑर्डर पर No-Cost EMI (3, 6, 9, 12 महीने) major credit cards पर उपलब्ध है — checkout पर card option चुनें। Bank-specific जानकारी के लिए WhatsApp करें।`,
      return_info: `Manufacturing defect होने पर 7-दिन replacement window है (मन बदलने पर नहीं) — item unused, original packaging में होना चाहिए। Second-hand/seal-cut/demo units return नहीं होते (पहले से inspected)। Return शुरू करने के लिए Order ID के साथ WhatsApp करें।`,
      service_info: `Repair या service चाहिए? एक appointment book करें — date, time चुनें, issue बताएं, हम confirm करेंगे shop आना है या courier करना है।`,
      no_match: `समझ नहीं आया — ब्रांड, बजट (जैसे "30000 के अंदर फोन"), डिलीवरी, पेमेंट या वारंटी के बारे में पूछें।`,
      foundProducts: (n) => `ये मिले (${n}):`,
      noProducts: `कोई मैचिंग प्रोडक्ट नहीं मिला — दूसरा ब्रांड या बजट आज़माएं।`,
      notAvailableArrange: `हो सकता है यह अभी स्टॉक में न हो, लेकिन हम इसे आपके लिए arrange कर सकते हैं। Advance पेमेंट करके confirm करें, हमारी टीम इसे source करके आपको update करेगी। Call/WhatsApp करें और बताएं आपको कौन सा model चाहिए, या यहीं exact model नाम बताएं, मैं आगे भेज दूंगा।`,
      arrangeForwarded: `ठीक है — मैंने आपकी request आपकी details के साथ हमारी टीम को भेज दी है, वो चेक करके आपसे संपर्क करेंगे। अगर जल्दी जवाब न मिले, तो नीचे advance payment अभी कर सकते हैं order confirm करने के लिए — इससे हम दोनों तरह से तुरंत arrange करना शुरू कर देंगे।`,
      contactCardIntro: `हमसे इस तरह संपर्क करें:`,
      compareIntro: `तुलना:`,
      viewMore: 'सभी प्रोडक्ट्स देखें →',
      orderAsk: `आपका Order ID बताएं? यह SMD260712345 जैसा दिखता है (Orders पेज पर देखें)।`,
      orderNotFound: `उस ID से कोई ऑर्डर नहीं मिला। Orders पेज पर जांचें, या WhatsApp पर पूछें।`,
      orderStatusFound: (id, statusLabel) => `ऑर्डर ${id} अभी: ${statusLabel}.`,
      paymentConfirmInfo: `पेमेंट करने के लिए: नीचे दिए QR को किसी भी UPI app (GPay/PhonePe/Paytm) से स्कैन करें, या UPI ID **${SITE_CONFIG.upiId}** इस्तेमाल करें। पेमेंट के बाद स्क्रीनशॉट Payment पेज पर अपलोड करें। सीधे बात करनी हो तो WhatsApp करें:`,
      suggestions: ['30000 के अंदर फोन', 'Low budget models', 'ऑर्डर स्टेटस', 'पेमेंट विकल्प', 'Second-hand phones', 'Second-hand laptops'],
    },
    te: {
      title: 'SM సహాయకుడు', subtitle: 'ఏదైనా అడగండి, వెంటనే జవాబు ఇస్తాం',
      placeholder: 'ప్రొడక్ట్, ధర, డెలివరీ గురించి అడగండి…',
      greet: `నమస్తే! 👋 నేను SM Mobile Deals అసిస్టెంట్‌ని. ప్రొడక్ట్స్, ధర, పేమెంట్, డెలివరీ లేదా వారంటీ గురించి అడగండి.`,
      store_info: `మేము ${SITE_CONFIG.legalName}, ${SITE_CONFIG.address} లో ఉన్నాం. సమయం: ${SITE_CONFIG.timings}.`,
      contact_info: `మమ్మల్ని ${SITE_CONFIG.phones.join(' లేదా ')} లో సంప్రదించండి, లేదా WhatsApp చేయండి.`,
      payment_info: `మేము UPI (GPay/PhonePe/Paytm) QR మరియు క్రెడిట్/డెబిట్ కార్డ్ ద్వారా పేమెంట్ తీసుకుంటాం. పేమెంట్ తర్వాత స్క్రీన్‌షాట్‌ను Payment పేజీలో అప్‌లోడ్ చేయండి — మా టీమ్ కన్ఫర్మ్ చేసిన తర్వాత ఆర్డర్ "Confirmed" అవుతుంది. కార్డ్ పేమెంట్‌కు కొంచెం extra charge ఉండొచ్చు.`,
      delivery_info: `తమిళనాడులో 1-రోజు డెలివరీ మరియు Cash on Delivery అందుబాటులో ఉంది. ఇతర రాష్ట్రాలకు 2-3 రోజులు పడుతుంది, పూర్తి ఆన్‌లైన్ పేమెంట్ ముందుగా చేయాలి. ఆర్డర్‌ను Tracking పేజీలో ట్రాక్ చేయవచ్చు.`,
      warranty_info: `అన్ని ప్రొడక్ట్స్‌కు స్టాండర్డ్ మాన్యుఫాక్చరర్ వారంటీ ఉంటుంది (ఫోన్/ల్యాప్‌టాప్‌కు 1 సంవత్సరం, యాక్సెసరీస్‌కు 6 నెలలు).`,
      emi_info: `₹5,000 పైన ఆర్డర్‌లకు No-Cost EMI (3, 6, 9, 12 నెలలు) major క్రెడిట్ కార్డ్స్‌పై అందుబాటులో ఉంది — checkout లో card option ఎంచుకోండి. Bank-specific వివరాలకు WhatsApp చేయండి.`,
      return_info: `Manufacturing defect ఉంటే 7-రోజుల replacement window ఉంది (మనసు మారితే వర్తించదు) — item unused గా, original packaging లో ఉండాలి. Second-hand/seal-cut/demo units return కావు (ఇప్పటికే inspected). Return మొదలుపెట్టడానికి Order ID తో WhatsApp చేయండి.`,
      service_info: `Repair లేదా service కావాలా? ఒక appointment book చేయండి — date, time ఎంచుకుని, issue చెప్పండి, shop కు రావాలో courier చేయాలో మేము confirm చేస్తాం.`,
      no_match: `అర్థం కాలేదు — బ్రాండ్, బడ్జెట్ (ఉదా. "30000 లోపు ఫోన్"), డెలివరీ, పేమెంట్ లేదా వారంటీ గురించి అడగండి.`,
      foundProducts: (n) => `ఇవి దొరికాయి (${n}):`,
      noProducts: `మ్యాచింగ్ ప్రొడక్ట్ దొరకలేదు — వేరే బ్రాండ్ లేదా బడ్జెట్ ప్రయత్నించండి.`,
      notAvailableArrange: `ఇది ఇప్పుడు స్టాక్‌లో లేకపోయినా, మేము దీన్ని మీ కోసం arrange చేయగలం. Advance పేమెంట్ చేసి confirm చేయండి, మా టీమ్ దీన్ని source చేసి మీకు అప్‌డేట్ చేస్తుంది. Call/WhatsApp చేసి మీకు ఏ model కావాలో చెప్పండి, లేదా ఇక్కడే exact model పేరు చెప్తే నేను పంపిస్తాను.`,
      arrangeForwarded: `సరే — మీ request మీ వివరాలతో మా టీమ్‌కు పంపించాను, వాళ్ళు చెక్ చేసి మీకు రిప్లై ఇస్తారు. త్వరగా రిప్లై రాకపోతే, కింద ఉన్న advance payment ఇప్పుడే చేసి order confirm చేసుకోవచ్చు — అప్పుడు రెండు విధాలుగా మేము వెంటనే arrange చేయడం మొదలుపెడతాం.`,
      contactCardIntro: `మమ్మల్ని ఇలా సంప్రదించండి:`,
      compareIntro: `పోలిక:`,
      viewMore: 'అన్ని ప్రొడక్ట్స్ చూడండి →',
      orderAsk: `మీ Order ID చెప్పండి? ఇది SMD260712345 లా ఉంటుంది (Orders పేజీలో చూడండి).`,
      orderNotFound: `ఆ ID తో ఆర్డర్ దొరకలేదు. Orders పేజీలో సరిచూడండి, లేదా WhatsApp లో అడగండి.`,
      orderStatusFound: (id, statusLabel) => `ఆర్డర్ ${id} ప్రస్తుతం: ${statusLabel}.`,
      paymentConfirmInfo: `పేమెంట్ చేయడానికి: కింద ఉన్న QR ను ఏదైనా UPI app (GPay/PhonePe/Paytm) తో స్కాన్ చేయండి, లేదా UPI ID **${SITE_CONFIG.upiId}** వాడండి. పేమెంట్ తర్వాత స్క్రీన్‌షాట్‌ను Payment పేజీలో అప్‌లోడ్ చేయండి. నేరుగా మాట్లాడాలంటే WhatsApp:`,
      suggestions: ['30000 లోపు ఫోన్', 'Low budget models', 'ఆర్డర్ స్టేటస్', 'పేమెంట్ ఆప్షన్స్', 'Second-hand phones', 'Second-hand laptops'],
    },
    ml: {
      title: 'SM സഹായി', subtitle: 'എന്തും ചോദിക്കൂ, ഉടനെ മറുപടി തരാം',
      placeholder: 'പ്രൊഡക്റ്റ്, വില, ഡെലിവറി എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ…',
      greet: `നമസ്കാരം! 👋 ഞാൻ SM Mobile Deals അസിസ്റ്റന്റ് ആണ്. പ്രൊഡക്റ്റുകൾ, വില, പേയ്‌മെന്റ്, ഡെലിവറി അല്ലെങ്കിൽ വാറന്റി എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.`,
      store_info: `ഞങ്ങൾ ${SITE_CONFIG.legalName}, ${SITE_CONFIG.address} ൽ സ്ഥിതി ചെയ്യുന്നു. സമയം: ${SITE_CONFIG.timings}.`,
      contact_info: `ഞങ്ങളെ ${SITE_CONFIG.phones.join(' അല്ലെങ്കിൽ ')} ൽ ബന്ധപ്പെടാം, അല്ലെങ്കിൽ WhatsApp ചെയ്യാം.`,
      payment_info: `ഞങ്ങൾ UPI (GPay/PhonePe/Paytm) QR ഉം ക്രെഡിറ്റ്/ഡെബിറ്റ് കാർഡും സ്വീകരിക്കുന്നു. പേയ്‌മെന്റിന് ശേഷം സ്ക്രീൻഷോട്ട് Payment പേജിൽ അപ്‌ലോഡ് ചെയ്യുക — ഞങ്ങളുടെ ടീം കൺഫേം ചെയ്ത ശേഷം ഓർഡർ "Confirmed" ആകും. കാർഡ് പേയ്‌മെന്റിന് ചെറിയ extra charge ഉണ്ടാകാം.`,
      delivery_info: `തമിഴ്‌നാട്ടിൽ 1-ദിവസ ഡെലിവറിയും Cash on Delivery യും ലഭ്യമാണ്. മറ്റ് സംസ്ഥാനങ്ങളിൽ 2-3 ദിവസം എടുക്കും, മുഴുവൻ ഓൺലൈൻ പേയ്‌മെന്റ് മുൻകൂട്ടി വേണം. ഓർഡർ Tracking പേജിൽ ട്രാക്ക് ചെയ്യാം.`,
      warranty_info: `എല്ലാ പ്രൊഡക്റ്റുകൾക്കും സ്റ്റാൻഡേർഡ് മാനുഫാക്ചറർ വാറന്റി ഉണ്ട് (ഫോൺ/ലാപ്ടോപ്പിന് 1 വർഷം, ആക്സസറീസിന് 6 മാസം).`,
      emi_info: `₹5,000 നു മുകളിലുള്ള ഓർഡറുകൾക്ക് No-Cost EMI (3, 6, 9, 12 മാസം) പ്രധാന ക്രെഡിറ്റ് കാർഡുകളിൽ ലഭ്യമാണ് — checkout ൽ card option തിരഞ്ഞെടുക്കുക. Bank-specific വിവരങ്ങൾക്ക് WhatsApp ചെയ്യുക.`,
      return_info: `Manufacturing defect ഉണ്ടെങ്കിൽ 7-ദിവസ replacement window ഉണ്ട് (മനസ്സ് മാറിയാൽ ബാധകമല്ല) — item ഉപയോഗിക്കാത്തതും, original packaging ലും ആയിരിക്കണം. Second-hand/seal-cut/demo units return ചെയ്യാൻ കഴിയില്ല (നേരത്തെ തന്നെ inspected). Return തുടങ്ങാൻ Order ID സഹിതം WhatsApp ചെയ്യുക.`,
      service_info: `Repair അല്ലെങ്കിൽ service വേണോ? ഒരു appointment book ചെയ്യൂ — date, time തിരഞ്ഞെടുത്ത്, issue പറയൂ, shop ൽ വരണോ courier ചെയ്യണോ ഞങ്ങൾ confirm ചെയ്യാം.`,
      no_match: `മനസ്സിലായില്ല — ബ്രാൻഡ്, ബജറ്റ് (ഉദാ. "30000ന് താഴെ ഫോൺ"), ഡെലിവറി, പേയ്‌മെന്റ് അല്ലെങ്കിൽ വാറന്റി എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ.`,
      foundProducts: (n) => `ഇവ കണ്ടെത്തി (${n}):`,
      noProducts: `പൊരുത്തപ്പെടുന്ന പ്രൊഡക്റ്റ് കണ്ടെത്തിയില്ല — വേറെ ബ്രാൻഡ് അല്ലെങ്കിൽ ബജറ്റ് ശ്രമിക്കൂ.`,
      notAvailableArrange: `ഇത് ഇപ്പോൾ സ്റ്റോക്കിൽ ഇല്ലെങ്കിലും, ഞങ്ങൾക്ക് ഇത് നിങ്ങൾക്കായി arrange ചെയ്യാൻ കഴിയും. Advance പേയ്‌മെന്റ് ചെയ്ത് confirm ചെയ്യൂ, ഞങ്ങളുടെ ടീം ഇത് source ചെയ്ത് നിങ്ങളെ അപ്‌ഡേറ്റ് ചെയ്യും. Call/WhatsApp ചെയ്ത് ഏത് model വേണമെന്ന് പറയൂ, അല്ലെങ്കിൽ ഇവിടെ തന്നെ exact model പേര് പറഞ്ഞാൽ ഞാൻ അയച്ചുകൊടുക്കാം.`,
      arrangeForwarded: `ശരി — നിങ്ങളുടെ request വിവരങ്ങൾ സഹിതം ഞങ്ങളുടെ ടീമിന് അയച്ചു, അവർ ചെക്ക് ചെയ്ത് നിങ്ങളെ ബന്ധപ്പെടും. വേഗം മറുപടി കിട്ടിയില്ലെങ്കിൽ, താഴെയുള്ള advance payment ഇപ്പോൾ തന്നെ ചെയ്ത് order confirm ചെയ്യാം — അപ്പോൾ രണ്ട് വഴിക്കും ഞങ്ങൾ ഉടനെ arrange ചെയ്യാൻ തുടങ്ങും.`,
      contactCardIntro: `ഞങ്ങളെ ഇങ്ങനെ ബന്ധപ്പെടാം:`,
      compareIntro: `താരതമ്യം:`,
      viewMore: 'എല്ലാ പ്രൊഡക്റ്റുകളും കാണുക →',
      orderAsk: `നിങ്ങളുടെ Order ID പറയൂ? ഇത് SMD260712345 പോലെ ആയിരിക്കും (Orders പേജിൽ കാണാം).`,
      orderNotFound: `ആ ID യിൽ ഓർഡർ കണ്ടെത്തിയില്ല. Orders പേജിൽ പരിശോധിക്കൂ, അല്ലെങ്കിൽ WhatsApp ൽ ചോദിക്കൂ.`,
      orderStatusFound: (id, statusLabel) => `ഓർഡർ ${id} ഇപ്പോൾ: ${statusLabel}.`,
      paymentConfirmInfo: `പേയ്‌മെന്റ് ചെയ്യാൻ: താഴെയുള്ള QR ഏതെങ്കിലും UPI app (GPay/PhonePe/Paytm) കൊണ്ട് സ്കാൻ ചെയ്യൂ, അല്ലെങ്കിൽ UPI ID **${SITE_CONFIG.upiId}** ഉപയോഗിക്കൂ. പേയ്‌മെന്റിന് ശേഷം സ്ക്രീൻഷോട്ട് Payment പേജിൽ അപ്‌ലോഡ് ചെയ്യൂ. നേരിട്ട് സംസാരിക്കാൻ WhatsApp:`,
      suggestions: ['30000ന് താഴെ ഫോൺ', 'Low budget models', 'ഓർഡർ സ്റ്റാറ്റസ്', 'പേയ്‌മെന്റ് ഓപ്ഷനുകൾ', 'Second-hand phones', 'Second-hand laptops'],
    },
    kn: {
      title: 'SM ಸಹಾಯಕ', subtitle: 'ಏನಾದರೂ ಕೇಳಿ, ತಕ್ಷಣ ಉತ್ತರ ಕೊಡ್ತೀವಿ',
      placeholder: 'ಪ್ರೊಡಕ್ಟ್, ಬೆಲೆ, ಡೆಲಿವರಿ ಬಗ್ಗೆ ಕೇಳಿ…',
      greet: `ನಮಸ್ಕಾರ! 👋 ನಾನು SM Mobile Deals ಅಸಿಸ್ಟೆಂಟ್. ಪ್ರೊಡಕ್ಟ್‌ಗಳು, ಬೆಲೆ, ಪೇಮೆಂಟ್, ಡೆಲಿವರಿ ಅಥವಾ ವಾರಂಟಿ ಬಗ್ಗೆ ಕೇಳಿ.`,
      store_info: `ನಾವು ${SITE_CONFIG.legalName}, ${SITE_CONFIG.address} ನಲ್ಲಿ ಇದ್ದೀವಿ. ಸಮಯ: ${SITE_CONFIG.timings}.`,
      contact_info: `ನಮ್ಮನ್ನು ${SITE_CONFIG.phones.join(' ಅಥವಾ ')} ನಲ್ಲಿ ಸಂಪರ್ಕಿಸಿ, ಅಥವಾ WhatsApp ಮಾಡಿ.`,
      payment_info: `ನಾವು UPI (GPay/PhonePe/Paytm) QR ಮತ್ತು ಕ್ರೆಡಿಟ್/ಡೆಬಿಟ್ ಕಾರ್ಡ್ ಮೂಲಕ ಪೇಮೆಂಟ್ ತೆಗೆದುಕೊಳ್ಳುತ್ತೇವೆ. ಪೇಮೆಂಟ್ ನಂತರ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅನ್ನು Payment ಪೇಜ್‌ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — ನಮ್ಮ ಟೀಮ್ ಕನ್ಫರ್ಮ್ ಮಾಡಿದ ನಂತರ ಆರ್ಡರ್ "Confirmed" ಆಗುತ್ತದೆ. ಕಾರ್ಡ್ ಪೇಮೆಂಟ್‌ಗೆ ಸ್ವಲ್ಪ extra charge ಇರಬಹುದು.`,
      delivery_info: `ತಮಿಳುನಾಡಿನಲ್ಲಿ 1-ದಿನದ ಡೆಲಿವರಿ ಮತ್ತು Cash on Delivery ಲಭ್ಯವಿದೆ. ಬೇರೆ ರಾಜ್ಯಗಳಿಗೆ 2-3 ದಿನ ಬೇಕಾಗುತ್ತದೆ, ಪೂರ್ತಿ ಆನ್‌ಲೈನ್ ಪೇಮೆಂಟ್ ಮೊದಲೇ ಮಾಡಬೇಕು. ಆರ್ಡರ್ ಅನ್ನು Tracking ಪೇಜ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು.`,
      warranty_info: `ಎಲ್ಲಾ ಪ್ರೊಡಕ್ಟ್‌ಗಳಿಗೂ ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಮ್ಯಾನುಫ್ಯಾಕ್ಚರರ್ ವಾರಂಟಿ ಇದೆ (ಫೋನ್/ಲ್ಯಾಪ್‌ಟಾಪ್‌ಗೆ 1 ವರ್ಷ, ಆಕ್ಸೆಸರೀಸ್‌ಗೆ 6 ತಿಂಗಳು).`,
      emi_info: `₹5,000 ಮೇಲಿನ ಆರ್ಡರ್‌ಗಳಿಗೆ No-Cost EMI (3, 6, 9, 12 ತಿಂಗಳು) ಮುಖ್ಯ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗಳಲ್ಲಿ ಲಭ್ಯವಿದೆ — checkout ನಲ್ಲಿ card option ಆಯ್ಕೆಮಾಡಿ. Bank-specific ಮಾಹಿತಿಗೆ WhatsApp ಮಾಡಿ.`,
      return_info: `Manufacturing defect ಇದ್ದರೆ 7-ದಿನದ replacement window ಇದೆ (ಮನಸ್ಸು ಬದಲಾದರೆ ಅಲ್ಲ) — item ಬಳಸದೇ ಇರುವುದು, original packaging ನಲ್ಲಿ ಇರಬೇಕು. Second-hand/seal-cut/demo units return ಆಗುವುದಿಲ್ಲ (ಈಗಾಗಲೇ inspected). Return ಶುರು ಮಾಡಲು Order ID ಜೊತೆ WhatsApp ಮಾಡಿ.`,
      service_info: `Repair ಅಥವಾ service ಬೇಕಾ? ಒಂದು appointment book ಮಾಡಿ — date, time ಆಯ್ಕೆಮಾಡಿ, issue ಹೇಳಿ, shop ಗೆ ಬರಬೇಕಾ courier ಮಾಡಬೇಕಾ ನಾವು confirm ಮಾಡ್ತೀವಿ.`,
      no_match: `ಅರ್ಥ ಆಗಲಿಲ್ಲ — ಬ್ರ್ಯಾಂಡ್, ಬಜೆಟ್ (ಉದಾ. "30000 ಒಳಗೆ ಫೋನ್"), ಡೆಲಿವರಿ, ಪೇಮೆಂಟ್ ಅಥವಾ ವಾರಂಟಿ ಬಗ್ಗೆ ಕೇಳಿ.`,
      foundProducts: (n) => `ಇವು ಸಿಕ್ಕಿವೆ (${n}):`,
      noProducts: `ಹೊಂದುವ ಪ್ರೊಡಕ್ಟ್ ಸಿಗಲಿಲ್ಲ — ಬೇರೆ ಬ್ರ್ಯಾಂಡ್ ಅಥವಾ ಬಜೆಟ್ ಪ್ರಯತ್ನಿಸಿ.`,
      notAvailableArrange: `ಇದು ಈಗ ಸ್ಟಾಕ್‌ನಲ್ಲಿ ಇಲ್ಲದಿದ್ದರೂ, ನಾವು ಇದನ್ನು ನಿಮಗಾಗಿ arrange ಮಾಡಬಹುದು. Advance ಪೇಮೆಂಟ್ ಮಾಡಿ confirm ಮಾಡಿ, ನಮ್ಮ ಟೀಮ್ ಇದನ್ನು source ಮಾಡಿ ನಿಮಗೆ ಅಪ್‌ಡೇಟ್ ಮಾಡುತ್ತದೆ. Call/WhatsApp ಮಾಡಿ ಯಾವ model ಬೇಕು ಅಂತ ಹೇಳಿ, ಅಥವಾ ಇಲ್ಲೇ exact model ಹೆಸರು ಹೇಳಿದರೆ ನಾನು ಕಳುಹಿಸುತ್ತೇನೆ.`,
      arrangeForwarded: `ಸರಿ — ನಿಮ್ಮ request ಅನ್ನು ನಿಮ್ಮ ವಿವರಗಳ ಜೊತೆ ನಮ್ಮ ಟೀಮ್‌ಗೆ ಕಳುಹಿಸಿದ್ದೇನೆ, ಅವರು ಚೆಕ್ ಮಾಡಿ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ. ಬೇಗ ಉತ್ತರ ಸಿಗದಿದ್ದರೆ, ಕೆಳಗಿನ advance payment ಈಗಲೇ ಮಾಡಿ order confirm ಮಾಡಿಕೊಳ್ಳಬಹುದು — ಆಗ ಎರಡೂ ರೀತಿಯಲ್ಲಿ ನಾವು ತಕ್ಷಣ arrange ಮಾಡಲು ಶುರು ಮಾಡುತ್ತೇವೆ.`,
      contactCardIntro: `ನಮ್ಮನ್ನು ಹೀಗೆ ಸಂಪರ್ಕಿಸಿ:`,
      compareIntro: `ಹೋಲಿಕೆ:`,
      viewMore: 'ಎಲ್ಲಾ ಪ್ರೊಡಕ್ಟ್‌ಗಳನ್ನು ನೋಡಿ →',
      orderAsk: `ನಿಮ್ಮ Order ID ಹೇಳಿ? ಇದು SMD260712345 ಥರ ಇರುತ್ತದೆ (Orders ಪೇಜ್‌ನಲ್ಲಿ ನೋಡಿ).`,
      orderNotFound: `ಆ ID ಯಲ್ಲಿ ಆರ್ಡರ್ ಸಿಗಲಿಲ್ಲ. Orders ಪೇಜ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಅಥವಾ WhatsApp ನಲ್ಲಿ ಕೇಳಿ.`,
      orderStatusFound: (id, statusLabel) => `ಆರ್ಡರ್ ${id} ಈಗ: ${statusLabel}.`,
      paymentConfirmInfo: `ಪೇಮೆಂಟ್ ಮಾಡಲು: ಕೆಳಗಿನ QR ಅನ್ನು ಯಾವುದೇ UPI app (GPay/PhonePe/Paytm) ನಿಂದ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಅಥವಾ UPI ID **${SITE_CONFIG.upiId}** ಬಳಸಿ. ಪೇಮೆಂಟ್ ನಂತರ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅನ್ನು Payment ಪೇಜ್‌ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನೇರವಾಗಿ ಮಾತಾಡಲು WhatsApp:`,
      suggestions: ['30000 ಒಳಗೆ ಫೋನ್', 'Low budget models', 'ಆರ್ಡರ್ ಸ್ಟೇಟಸ್', 'ಪೇಮೆಂಟ್ ಆಯ್ಕೆಗಳು', 'Second-hand phones', 'Second-hand laptops'],
    }
  };

  const REGEX = {
    greeting: /\b(hi|hello|hey|vanakkam|வணக்கம்|namaste|नमस्ते|నమస్తే|హలో|നമസ്കാരം|ഹലോ|ನಮಸ್ಕಾರ|ಹಲೋ)\b/i,
    store_info: /(address|location|where|timing|open|shop|store|address|நேரம்|கடை|முகவரி|समय|पता|दुकान|చిరునామా|స్థానం|సమయం|దుకాణం|വിലാസം|സ്ഥലം|സമയം|കട|ವಿಳಾಸ|ಸ್ಥಳ|ಸಮಯ|ಅಂಗಡಿ)/i,
    contact_info: /(contact|phone|number|call|reach|தொடர்பு|फ़ोन|संपर्क|సంప్రదించండి|ఫోన్|నంబర్|ബന്ധപ്പെടുക|ഫോൺ|നമ്പർ|ಸಂಪರ್ಕಿಸಿ|ಫೋನ್|ನಂಬರ್)/i,
    order_status: /(order id|order status|track|my order|where is my order|smd\d{6,}|ஆர்டர்|order|ऑर्डर|ऑर्डर स्टेटस|ఆర్డర్|ഓർഡർ|ಆರ್ಡರ್)/i,
    payment_confirm: /(confirm.*payment|payment.*confirm|paid already|i('| ha)?ve paid|payment done|scan.*qr|show.*qr|பணம்.*செலுத்த|पेमेंट.*कर|qr.*scan|చెల్లించాను|పేమెంట్.*చేసా|പണം.*അടച്ചു|ಪಾವತಿ.*ಮಾಡಿದೆ)/i,
    payment_info: /(pay|payment|upi|gpay|phonepe|paytm|card|qr|பணம்|பேமெண்ட்|पेमेंट|भुगतान|పేమెంట్|డబ్బు|പേയ്‌മെന്റ്|പണം|ಪೇಮೆಂಟ್|ಹಣ)/i,
    delivery_info: /(deliver|delivery|shipping|courier|tamil nadu|cod|டெலிவரி|शिपिंग|डिलीवरी|డెలివరీ|ഡെലിവറി|ಡೆಲಿವರಿ)/i,
    warranty_info: /(warranty|guarantee|வாரண்டி|वारंटी|गारंटी|వారంటీ|വാറന്റി|ವಾರಂಟಿ)/i,
    emi_info: /(emi|installment|installments|no.?cost emi|EMI|किस्त|వాయిదాలు|ഗഡു|ಕಂತು)/i,
    return_info: /(return|refund|exchange policy|replace|replacement|मुदत|वापसी|रिटर्न|திருப்பி|రిటర్న్|వాపసు|റിട്ടേൺ|തിരികെ|ರಿಟರ್ನ್|ವಾಪಸ್)/i,
    comparison: /\b(vs|versus|compare|comparison|ஒப்பீடு|तुलना|పోలిక|താരതമ്യം|ಹೋಲಿಕೆ)\b/i,
    budget: /(low budget|budget friendly|cheap|affordable|pocket friendly|குறைந்த விலை|பட்ஜெட்|सस्ता|बजट|తక్కువ బడ్జెట్|చౌక|కుறைந്ത ബജറ്റ്|വില കുറഞ്ഞ|ಕಡಿಮೆ ಬಜೆಟ್|ಅಗ್ಗ)/i,
    service_info: /(service|repair|fix|broken|not working|screen crack|appointment)/i,
  };

  const BRANDS = ['apple','samsung','oneplus','xiaomi','redmi','realme','vivo','oppo','hp','dell','lenovo','asus','boat','iqoo','poco','infinix','tecno','lava','google','nothing','motorola'];
  const CATS = { mobile:'mobiles', phone:'mobiles', laptop:'laptops', watch:'watches', earbud:'earbuds', accessory:'accessories', accessories:'accessories',
    'second hand':'second-hand-mobiles', secondhand:'second-hand-mobiles', used:'second-hand-mobiles', sealed:'second-hand-mobiles', refurbished:'second-hand-mobiles' };
  const LOW_BUDGET_CEILING = 20000;
  const ORDER_ID_PATTERN = /\bSMD\d{6,}\b/i;
  const PINCODE_PATTERN = /\b(\d{6})\b/;

  function parseKeywords(text){
    const t = text.toLowerCase();
    const brand = BRANDS.find(b => t.includes(b));
    let catKey = Object.keys(CATS).find(k => t.includes(k));
    let category = catKey ? CATS[catKey] : null;
    // "second hand laptop" / "used laptop" etc. → the laptop-specific second-hand category
    if (category === 'second-hand-mobiles' && /laptop/i.test(t)) category = 'second-hand-laptops';
    const priceMatch = t.match(/\b(?:under|below|less than|budget|around|within)?\s*₹?\s*(\d{3,7})(k)?\b/);
    let price = null;
    if (priceMatch){
      let num = parseInt(priceMatch[1], 10);
      if (priceMatch[2]) num *= 1000;
      price = num;
    }
    if (!price && REGEX.budget.test(text)) price = LOW_BUDGET_CEILING;
    // Bare budget query ("30k", "under 50000") with no category mentioned → assume mobiles
    if (price && !category) category = 'mobiles';
    return { brand, category, price };
  }

  function detectIntent(text){
    if (REGEX.greeting.test(text)) return 'greeting';
    if (REGEX.payment_confirm.test(text)) return 'payment_confirm';
    if (ORDER_ID_PATTERN.test(text) || REGEX.order_status.test(text)) return 'order_status';
    if (REGEX.payment_info.test(text)) return 'payment_info';
    if (REGEX.delivery_info.test(text)) return 'delivery_info';
    if (REGEX.warranty_info.test(text)) return 'warranty_info';
    if (REGEX.emi_info.test(text)) return 'emi_info';
    if (REGEX.return_info.test(text)) return 'return_info';
    if (REGEX.service_info.test(text)) return 'service_info';
    if (REGEX.store_info.test(text)) return 'store_info';
    if (REGEX.contact_info.test(text)) return 'contact_info';
    if (REGEX.comparison.test(text)) return 'comparison';
    const kw = parseKeywords(text);
    if (kw.brand) return 'brand_search';
    if (kw.category) return 'category_search';
    if (kw.price) return 'price_filter';
    return 'unknown';
  }

  function productSearch(kw){
    let list = DB.getProducts();
    if (kw.brand) list = list.filter(p => p.brand.toLowerCase().includes(kw.brand));
    if (kw.category) list = list.filter(p => p.category === kw.category);
    if (kw.price) list = list.filter(p => p.price <= kw.price);
    if (kw.price) list = list.sort((a,b) => a.price - b.price); // cheapest first for budget searches
    return { shown: list.slice(0, 4), total: list.length, filters: kw };
  }

  function respond(text){
    const t = I18N[lang];
    const intent = detectIntent(text);
    const kw = parseKeywords(text);

    if (intent === 'greeting') return { text: t.greet, suggestions: t.suggestions };
    if (intent === 'store_info') return { text: t.store_info };
    if (intent === 'contact_info') return { text: t.contactCardIntro, contactCard: true };
    if (intent === 'delivery_info') return { text: t.delivery_info };
    if (intent === 'warranty_info') return { text: t.warranty_info };
    if (intent === 'emi_info') return { text: t.emi_info };
    if (intent === 'return_info') return { text: t.return_info };
    if (intent === 'service_info') return { text: t.service_info, serviceLink: true };

    if (intent === 'payment_confirm'){
      // Only here do we surface the QR + WhatsApp details — not on generic payment questions.
      return { text: t.paymentConfirmInfo, paymentCard: true };
    }
    if (intent === 'payment_info') return { text: t.payment_info };

    if (intent === 'order_status'){
      const match = text.match(ORDER_ID_PATTERN);
      if (!match) return { text: t.orderAsk };
      const orderId = match[0].toUpperCase();
      const order = (typeof Orders !== 'undefined') ? Orders.byId(orderId) : null;
      if (!order) return { text: t.orderNotFound };
      const statusKey = Orders.displayStatus(order);
      const statusLabel = Orders.STATUS_META[statusKey].label;
      let statusText = t.orderStatusFound(orderId, statusLabel);
      if (order.trackingUrl){
        const courierName = SITE_CONFIG.couriers[order.courier]?.name || order.courier || 'courier';
        statusText += ` Shipped via ${courierName} — track it live: ${order.trackingUrl}`;
      }
      return { text: statusText, orderLink: orderId };
    }

    if (intent === 'brand_search' || intent === 'category_search' || intent === 'price_filter' || intent === 'comparison'){
      const { shown, total, filters } = productSearch(kw);
      if (!shown.length){ awaitingArrangeDetails = true; return { text: t.notAvailableArrange, contactCard: true }; }
      return { text: t.foundProducts(shown.length), products: shown, moreCount: total, filters };
    }

    awaitingArrangeDetails = true;
    return { text: t.no_match, suggestions: t.suggestions, contactCard: true };
  }

  function setLang(newLang){
    lang = newLang;
    localStorage.setItem('smd_chat_lang', lang);
    const panel = document.getElementById('chat-panel');
    if (panel){
      panel.querySelector('.chat-head h4').textContent = I18N[lang].title;
      panel.querySelector('.chat-head span').textContent = I18N[lang].subtitle;
      panel.querySelector('.chat-input-row input').placeholder = I18N[lang].placeholder;
    }
  }

  const DEDICATED_CATEGORY_PAGES = {
    'second-hand-mobiles': 'pages/second-hand-mobiles.html',
    'second-hand-laptops': 'pages/second-hand-laptops.html'
  };

  function renderProductChips(products, moreCount, filters){
    let html = `<div class="msg-suggestions">${products.map(p =>
      `<button onclick="window.location.href='${UI.link('pages/product-details.html?id='+p.id)}'">${Utils.escapeHtml(p.name)} · ${Utils.formatINR(p.price)}</button>`
    ).join('')}</div>`;
    const shouldLinkOut = (moreCount && moreCount > products.length) || filters?.price || filters?.category;
    if (shouldLinkOut){
      let url;
      if (filters?.category && DEDICATED_CATEGORY_PAGES[filters.category]){
        // Second-hand categories have their own dedicated landing page (condition legend, grade filter)
        url = UI.link(DEDICATED_CATEGORY_PAGES[filters.category]);
      } else {
        const params = new URLSearchParams();
        if (filters?.category) params.set('cat', filters.category);
        if (filters?.brand) params.set('q', filters.brand);
        if (filters?.price) params.set('maxPrice', filters.price);
        url = UI.link('pages/products.html' + (params.toString() ? '?' + params.toString() : ''));
      }
      html += `<div style="margin-top:8px;"><a href="${url}" style="font-size:12.5px;font-weight:700;color:var(--accent-2);">${I18N[lang].viewMore}</a></div>`;
    }
    return html;
  }

  function renderPaymentCard(){
    return `<div style="margin-top:10px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:10px;text-align:center;">
      <img src="${UI.link(SITE_CONFIG.upiQrImage)}" alt="UPI QR" style="width:120px;height:120px;object-fit:contain;background:#fff;border-radius:8px;padding:6px;">
      <div style="margin-top:8px;"><a href="${SITE_CONFIG.social.whatsapp.url}" target="_blank" rel="noopener" style="font-size:12.5px;font-weight:700;color:#25D366;display:inline-flex;align-items:center;gap:5px;">${UI.ICONS.whatsapp('wa-inline-icon')} Chat on WhatsApp</a></div>
    </div>`;
  }

  function renderOrderLink(orderId){
    return `<div class="msg-suggestions"><button onclick="window.location.href='${UI.link('pages/tracking.html?order='+orderId)}'">Track order ${orderId}</button></div>`;
  }

  function renderContactCard(){
    const s = SITE_CONFIG.social;
    const iconLinks = [
      s.whatsapp?.url ? { url:s.whatsapp.url, icon:UI.ICONS.whatsapp, bg:'#25D366' } : null,
      s.instagram?.url ? { url:s.instagram.url, icon:UI.ICONS.instagram, bg:'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' } : null,
      s.facebook?.url ? { url:s.facebook.url, icon:UI.ICONS.facebook, bg:'#1877F2' } : null,
      s.threads?.url ? { url:s.threads.url, icon:UI.ICONS.threads, bg:'#000' } : null
    ].filter(Boolean);
    return `<div style="margin-top:10px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:12px;font-size:12.5px;">
      <div style="margin-bottom:6px;"><i class="fa-solid fa-location-dot" style="color:#ff3b30;width:16px;"></i> ${Utils.escapeHtml(SITE_CONFIG.address)}</div>
      <div style="margin-bottom:6px;"><i class="fa-solid fa-clock" style="width:16px;"></i> ${Utils.escapeHtml(SITE_CONFIG.timings)}</div>
      <div style="margin-bottom:10px;"><i class="fa-solid fa-phone" style="width:16px;"></i> <a href="tel:${SITE_CONFIG.phones[0]}" style="color:inherit;">${SITE_CONFIG.phones.join(' / ')}</a></div>
      <div style="display:flex;gap:8px;">${iconLinks.map(l => `<a href="${l.url}" target="_blank" rel="noopener" style="width:32px;height:32px;border-radius:50%;background:${l.bg};display:flex;align-items:center;justify-content:center;color:#fff;">${l.icon('wa-inline-icon')}</a>`).join('')}</div>
    </div>`;
  }

  function pushMessage(role, content, extra){
    const body = document.getElementById('chat-body');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerHTML = Utils.escapeHtml(content).replace(/\n/g,'<br>') + (extra || '');
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  // ---- Real AI fallback (Supabase Edge Function → Claude) for questions the
  // free rule-based matcher above doesn't recognise. Silently unavailable if
  // Supabase isn't configured or the function hasn't been deployed yet. ----
  let aiHistory = [];
  async function callAI(message){
    if (!DB.useSupabase()) return null;
    try{
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ message, history: aiHistory })
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.reply) return null;
      aiHistory.push({ role:'user', content: message }, { role:'assistant', content: data.reply });
      aiHistory = aiHistory.slice(-12);
      return data.reply;
    }catch(err){
      console.warn('[AI chat] unavailable:', err.message);
      return null;
    }
  }

  async function handleSend(text){
    if (!text.trim()) return;
    pushMessage('user', text);
    const inputEl = document.querySelector('#chat-panel .chat-input-row input');
    if (inputEl) inputEl.value = '';
    const typing = document.createElement('div');
    typing.className = 'msg bot';
    typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    const body = document.getElementById('chat-body');
    body.appendChild(typing); body.scrollTop = body.scrollHeight;

    const minDelay = new Promise(resolve => setTimeout(resolve, 400 + Math.random()*300));

    // If we just told the customer we can "arrange" something they asked
    // for, their very next message is what they're describing — forward it
    // to the admin (with who they are, if logged in) and let them know they
    // can pay the advance right now instead of waiting for a reply.
    if (awaitingArrangeDetails){
      awaitingArrangeDetails = false;
      const t = I18N[lang];
      if (typeof Inbox !== 'undefined'){
        const u = (typeof Auth !== 'undefined' && Auth.isLoggedIn()) ? Auth.currentUser() : null;
        const who = u ? `${u.name || 'Customer'} (${u.email})` : 'A website visitor (not logged in)';
        Inbox.sendToAdmin('Customer product request', `${who} is looking for: "${text.trim()}"`, u ? `pages/admin.html?customer=${u.id}` : 'pages/admin.html');
      }
      await minDelay;
      typing.remove();
      pushMessage('bot', t.arrangeForwarded, renderPaymentCard());
      return;
    }

    // Pincode delivery check — only when the message is just a 6-digit code,
    // or explicitly mentions "pincode"/"pin code"/"zip", to avoid mistaking
    // a price like "under 500000" for a PIN code.
    const trimmed = text.trim();
    const pinMatch = text.match(PINCODE_PATTERN);
    const looksLikePincodeQuery = /pincode|pin code|zip/i.test(text) || /^\d{6}$/.test(trimmed);
    if (pinMatch && looksLikePincodeQuery && !ORDER_ID_PATTERN.test(text)){
      const t = I18N[lang];
      const result = await Pincode.lookup(pinMatch[1]);
      await minDelay;
      typing.remove();
      if (!result.ok){
        pushMessage('bot', result.error);
      } else {
        const est = Pincode.estimateDays(result.state);
        const codNote = (Utils.isTamilNadu(result.state) && Utils.isCoimbatoreDistrict(result.district))
          ? ' Cash on Delivery is available here (20% advance paid online).'
          : ' This area is online-payment-only (no Cash on Delivery).';
        pushMessage('bot', `${result.area}, ${result.district}, ${result.state} — estimated delivery: ${est.days}.${codNote}`);
      }
      return;
    }

    const intent = detectIntent(text);
    let r = respond(text);
    let usedAI = false;

    if (intent === 'unknown'){
      const aiReply = await callAI(text);
      if (aiReply){ r = { text: aiReply }; usedAI = true; }
    }

    await minDelay;
    typing.remove();
    let extra = '';
    if (usedAI){ /* no canned suggestions/chips for free-form AI answers */ }
    else if (r.products) extra = renderProductChips(r.products, r.moreCount, r.filters);
    else if (r.paymentCard) extra = renderPaymentCard();
    else if (r.contactCard) extra = renderContactCard();
    else if (r.serviceLink) extra = `<div class="msg-suggestions"><button onclick="window.location.href='${UI.link('pages/service.html')}'"><i class="fa-solid fa-calendar-check"></i> Book a Service Appointment</button></div>`;
    else if (r.orderLink) extra = renderOrderLink(r.orderLink);
    else if (r.suggestions) extra = `<div class="msg-suggestions">${r.suggestions.map(s=>`<button onclick="Chatbot.handleSend('${s.replace(/'/g,"\\'")}')">${Utils.escapeHtml(s)}</button>`).join('')}</div>`;
    pushMessage('bot', r.text, extra);
  }

  function panelElement(){
    const wrap = document.createElement('div');
    wrap.className = 'chat-panel';
    wrap.id = 'chat-panel';
    const t = I18N[lang];
    wrap.innerHTML = `
      <div class="chat-head">
        <div class="ch-info"><h4>${t.title}</h4><span>${t.subtitle}</span></div>
        <select class="chat-lang" onchange="Chatbot.setLang(this.value)">
          <option value="en" ${lang==='en'?'selected':''}>English</option>
          <option value="ta" ${lang==='ta'?'selected':''}>தமிழ்</option>
          <option value="hi" ${lang==='hi'?'selected':''}>हिंदी</option>
          <option value="te" ${lang==='te'?'selected':''}>తెలుగు</option>
          <option value="ml" ${lang==='ml'?'selected':''}>മലയാളം</option>
          <option value="kn" ${lang==='kn'?'selected':''}>ಕನ್ನಡ</option>
        </select>
        <button class="modal-close" onclick="Chatbot.toggle()" style="background:rgba(255,255,255,.2);color:#fff;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="chat-body" id="chat-body"></div>
      <div class="chat-input-row">
        <input type="text" placeholder="${t.placeholder}" onkeydown="if(event.key==='Enter') Chatbot.handleSend(this.value)">
        <button onclick="Chatbot.handleSend(this.previousElementSibling.value)"><i class="fa-solid fa-paper-plane"></i></button>
      </div>`;
    return wrap;
  }

  function toggle(){
    let panel = document.getElementById('chat-panel');
    if (!panel){
      // Normally mounted once at page boot (App.mountAIWidget). If that
      // never ran for any reason (a slow/failed Supabase call earlier in
      // boot(), a race on a very fast click, etc.) the "AI Support" card
      // and the floating chat button would otherwise do nothing at all —
      // mount it here on demand instead of silently failing.
      document.body.appendChild(panelElement());
      panel = document.getElementById('chat-panel');
      if (!panel) return;
    }
    const opening = !panel.classList.contains('open');
    panel.classList.toggle('open');
    if (opening){
      // The panel is fixed-position so it's technically already in the
      // viewport, but on a long page a click far from the corner it opens
      // in can easily go unnoticed — scroll it clearly into view so it's
      // unmistakable every time.
      panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }
    if (opening && !panel.dataset.greeted){
      panel.dataset.greeted = '1';
      setTimeout(() => {
        const t = I18N[lang];
        pushMessage('bot', t.greet, `<div class="msg-suggestions">${t.suggestions.map(s=>`<button onclick="Chatbot.handleSend('${s.replace(/'/g,"\\'")}')">${Utils.escapeHtml(s)}</button>`).join('')}</div>`);
      }, 300);
    }
  }

  return { respond, detectIntent, parseKeywords, handleSend, setLang, toggle, panelElement };
})();
