const PHRASES = {
  'irrigate before 9am to reduce evaporation loss': {
    hi: 'सुबह 9 बजे से पहले सिंचाई करें ताकि पानी की हानि कम हो',
    kn: 'ತೇವಾಂಶ ನಷ್ಟ ಕಡಿಮೆಯಾಗಲು ಬೆಳಗ್ಗೆ 9ರೊಳಗೆ ನೀರು ಹಾಯಿಸಿ',
    ta: 'ஆவியாதலைக் குறைக்க காலை 9க்குள் பாசனம் செய்யுங்கள்',
    te: 'ఆవిరి నష్టం తగ్గించడానికి ఉదయం 9 లోపు నీరు పెట్టండి',
    mr: 'बाष्पीभवन कमी करण्यासाठी सकाळी 9 पूर्वी पाणी द्या',
    bn: 'বাষ্পীভবন কমাতে সকাল ৯টার আগে সেচ করুন',
    gu: 'બાષ્પીભવન ઘટાડવા સવારે 9 પહેલાં પાણી આપો',
    ml: 'ബാഷ്പീകരണം കുറയ്ക്കാൻ രാവിലെ 9-ന് മുമ്പ് ജലസേചനം നടത്തുക',
    pa: 'ਵਾਸ਼ਪੀਕਰਨ ਘਟਾਉਣ ਲਈ ਸਵੇਰੇ 9 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਪਾਣੀ ਦਿਓ'
  },
  'delay spraying rain expected within 36 hours': {
    hi: '36 घंटे के भीतर बारिश की संभावना — छिड़काव टालें',
    kn: '36 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ — ಸಿಂಪರಣೆ ತಡೆಹಿಡಿಯಿರಿ',
    ta: '36 மணி நேரத்தில் மழை — தெளிப்பை தாமதிக்கவும்',
    te: '36 గంటల్లో వర్షం — పిచికారీ ఆలస్యం చేయండి',
    mr: '36 तासांत पाऊस — फवारणी लांबवा',
    bn: '৩৬ ঘণ্টার মধ্যে বৃষ্টি — স্প্রে দেরি করুন',
    gu: '36 કલાકમાં વરસાદ — છંટકાવ વધારવો નહીં',
    ml: '36 മണിക്കൂറിനുള്ളിൽ മഴ — തളിക്കൽ മാറ്റുക',
    pa: '36 ਘੰਟਿਆਂ ਵਿੱਚ ਮੀਂਹ — ਛਿੜਕਾਅ ਮੁਲਤਵੀ ਕਰੋ'
  },
  'rain expected within 36 hours delay spraying and fertiliser application until the sky clears': {
    hi: '36 घंटों के भीतर बारिश की संभावना — आसमान साफ होने तक छिड़काव और खाद देना टालें'
  },
  'rain expected within 36 hours delay spraying and fertilizer application until the sky clears': {
    hi: '36 घंटों के भीतर बारिश की संभावना — आसमान साफ होने तक छिड़काव और खाद देना टालें',
    kn: '36 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ — ಆಕಾಶ ಸ್ವಚ್ಛವಾಗುವವರೆಗೆ ಸಿಂಪರಣೆ ಮತ್ತು ಗೊಬ್ಬರ ನೀಡುವುದನ್ನು ತಡೆಹಿಡಿಯಿರಿ'
  },
  'Soil moisture is running low in this district — irrigate before 9 am to cut evaporation losses.': {
    hi: 'इस जिले में मिट्टी की नमी कम है — वाष्पीकरण कम करने के लिए सुबह 9 बजे से पहले सिंचाई करें।',
    kn: 'ಈ ಜಿಲ್ಲೆಯಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಕಡಿಮೆಯಾಗಿದೆ — ತೇವಾಂಶ ನಷ್ಟ ಕಡಿಮೆ ಮಾಡಲು ಬೆಳಗ್ಗೆ 9ಕ್ಕಿಂತ ಮೊದಲು ನೀರು ಹಾಯಿಸಿ।'
  }
};

export function translate(text, lang = 'en') {
  if (!text || lang === 'en') return { text, translated: text, lang, engine: 'identity' };
  if (process.env.TRANSLATE_API_KEY) {
    return { text, translated: text, lang, engine: 'external', note: 'TRANSLATE_API_KEY set; route to the configured provider.' };
  }
  const key = String(text).trim();
  const direct = PHRASES[key] && PHRASES[key][lang];
  if (direct) return { text, translated: direct, lang, engine: 'dictionary' };
  return { text, translated: text, lang, engine: 'dictionary', fallback: true };
}
