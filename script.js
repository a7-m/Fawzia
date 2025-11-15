
        const defaultConfig = {
            school_name: "مدرسة الطالب الذكي الخاصة بنزوى",
            welcome_text: "مرحباً بك في منصة الاختبارات التعليمية",
            instructions_title: "قواعد الاختبار",
            start_button_text: "ابدأ الاختبار",
            results_title: "نتيجة الاختبار",
            background_color: "#1e3c72",
            surface_color: "#ffffff",
            text_color: "#333333",
            primary_action_color: "#4CAF50",
            secondary_action_color: "#2196F3",
            font_family: "Cairo",
            font_size: 16
        };

        let currentConfig = { ...defaultConfig };
        let allTestData = [];

        const readingPassage = `ليلة لا تصدق 

    <img src="images&video/night.png" alt="ليلة لا تصدق" style="width: 50%; border-radius: 8px; margin-top: 15px;">

أَمِينَةُ فِي العَاشِرَةِ مِنْ عُمْرِهَا، وَكَانَ بِإِمْكَانِهَا أَنْ تَشُقَّ طَرِيقَهَا مِنْ غُرْفَتِهَا إِلَى الحَمَّامِ وَهِيَ نِصْفُ نَائِمَةٍ. وَيَكُونُ بَابُ غُرْفَتِهَا فِي العَادَةِ مُوَارَبًا لِيَسْمَحَ لِلْمِصْبَاحِ اللَّيْلِيِّ فِي المَمَرِّ بِأَنْ يُعْطِيَ الغُرْفَةَ إِضَاءَةً كَافِيَةً لِتَصِلَ إِلَى الحَمَّامِ مُرُورًا بِمَنْضَدَةِ الهَاتِفِ.

فِي إِحْدَى اللَّيَالِي بَيْنَمَا كَانَتْ أَمِينَةُ مَارَّةً بِمَنْضَدَةِ الهَاتِفِ فِي طَرِيقِهَا إِلَى الحَمَّامِ سَمِعَتْ صَوْتًا مُنْخَفِضًا كَالهَسِيسِ، وَلَكِنْ فِي الحَقِيقَةِ لَمْ تَهْتَمَّ لِهَذَا الصَّوْتِ كَوْنَهَا نِصْفَ نَائِمَةٍ. وَعَلَى أَيِّ حَالٍ كَانَ الصَّوْتُ قَادِمًا مِنْ بَعِيدٍ، وَلَمْ تَعْرِفْ مِنْ أَيْنَ يَأْتِي هَذَا الصَّوْتُ إِلَّا فِي طَرِيقِ عَوْدَتِهَا إِلَى غُرْفَتِهَا. كَانَتْ كُومَةٌ مِنَ الصُّحُفِ وَالمَجَلَّاتِ القَدِيمَةِ تَحْتَ المَنْضَدَةِ قَدْ بَدَأَتْ تَتَحَرَّكُ، وَمِنْ هُنَا كَانَ مَصْدَرُ الصَّوْتِ. وَفَجْأَةً بَدَأَتْ كُومَةُ الصُّحُفِ وَالمَجَلَّاتِ تَتَسَاقَطُ يَمِينًا وَشِمَالًا وَإِلَى الأَمَامِ وَالخَلْفِ. بَعْدَهَا كَانَتِ الصُّحُفُ وَالمَجَلَّاتُ فَوْقَ الأَرْضِ فِي كُلِّ مَكَانٍ. لَمْ تُصَدِّقْ أَمِينَةُ عَيْنَيْهَا حِينَ شَاهَدَتْ تِمْسَاحًا يَشْخُرُ وَيَنْخُرُ خَارِجًا مِنْ تَحْتِ المَنْضَدَةِ.

تَجَمَّدَتْ أَمِينَةُ فِي مَكَانِهَا وَاتَّسَعَتْ عَيْنَاهَا كَصَحْنَيِ فِنْجَانٍ، وَرَاقَبَتِ التِّمْسَاحَ يَزْحَفُ خَارِجًا مِنْ كُومَةِ الصُّحُفِ وَالمَجَلَّاتِ وَهُوَ يَتَلَفَّتُ فِي أَنْحَاءِ الشَّقَّةِ بِبُطْءٍ. كَانَ يَبْدُو وَكَأَنَّهُ خَارِجٌ لِتَوِّهِ مِنَ المَاءِ مُبَلَّلًا يَتَقَاطَرُ مِنْهُ المَاءُ، وَكَانَ يَتْرُكُ السَّجَّادَ مُبَلَّلًا أَيْنَمَا خَطَا.

<img src="images&video/crocodil.png" alt="ليلة لا تصدق" style="width: 50%; border-radius: 8px; margin-top: 15px;">

حَرَّكَ التِّمْسَاحُ رَأْسَهُ إِلَى الأَمَامِ وَالخَلْفِ مُصْدِرًا هَسِيسًا عَالِيًا، وَبَلَعَتْ أَمِينَةُ رِيقَهَا بِصُعُوبَةٍ وَهِيَ تَنْظُرُ إِلَى مُخَاطِ التِّمْسَاحِ وَصَفٍّ مُخِيفٍ وَطَوِيلٍ مِنَ الأَسْنَانِ، وَحَرَّكَ ذَيْلَهُ بِبُطْءٍ إِلَى الأَمَامِ وَإِلَى الخَلْفِ. كَانَتْ أَمِينَةُ قَدْ قَرَأَتْ فِي مَجَلَّةِ الحَيَوَانِ كَيْفَ يَنْفُضُ التِّمْسَاحُ المَاءَ بِذَيْلِهِ حِينَ يُطَارِدُ أَعْدَاءَهُ أَوْ يُرِيدُ الهُجُومَ عَلَيْهِمْ.

وَقَعَ نَظَرُهَا عَلَى آخِرِ عَدَدٍ مِنْ مَجَلَّةِ الحَيَوَانِ الَّذِي وَقَعَ عَلَى قَدَمِهَا مِنْ كُومَةِ الصُّحُفِ وَالمَجَلَّاتِ، ثُمَّ تَلَقَّتْ أَمِينَةُ صَدْمَةً أُخْرَى حِينَ لَاحَظَتْ أَنَّ غِلَافَ المَجَلَّةِ الَّذِي كَانَ يَحْمِلُ صُورَةَ تِمْسَاحٍ كَبِيرٍ فِي نَهْرٍ أَصْبَحَ الآنَ يَحْمِلُ صُورَةَ نَهْرٍ فَارِغٍ.

اِنْحَنَتْ أَمِينَةُ وَالْتَقَطَتِ المَجَلَّةَ، وَفِي هَذِهِ اللَّحْظَةِ حَرَّكَ التِّمْسَاحُ ذَيْلَهُ بِقُوَّةٍ حَيْثُ كَسَرَ المَزْهَرِيَّةَ عَلَى الأَرْضِ، وَنَثَرَ أَزْهَارَ دُوَّارِ الشَّمْسِ فِي كُلِّ مَكَانٍ، وَبِقَفْزَةٍ سَرِيعَةٍ كَانَتْ أَمِينَةُ فِي غُرْفَتِهَا، أَغْلَقَتِ البَابَ بِشِدَّةٍ، وَأَمْسَكَتْ بِسَرِيرِهَا وَدَفَعَتْهُ وَرَاءَ البَابِ، وَبِذَلِكَ بَنَتْ لِنَفْسِهَا مُتْرَاسًا يُبْقِيهَا فِي أَمَانٍ مِنَ التِّمْسَاحِ. ارْتَاحَتْ وَتَنَفَّسَتِ الصُّعَدَاءَ.

لَكِنَّهَا تَرَدَّدَتْ، مَاذَا لَوْ كَانَ هَذَا الوَحْشُ بِكُلِّ بَسَاطَةٍ جَائِعًا؟ رُبَّمَا عَلَيْهَا أَنْ تُعْطِيَهُ شَيْئًا لِيَأْكُلَهُ كَيْ يُغَادِرَ.

نَظَرَتْ أَمِينَةُ ثَانِيَةً إِلَى مَجَلَّةِ الحَيَوَانِ، فَإِذَا كَانَ التِّمْسَاحُ قَدِ اسْتَطَاعَ أَنْ يَزْحَفَ خَارِجَ الصُّورَةِ، فَرُبَّمَا يُمْكِنُ لِلْحَيَوَانَاتِ الأُخْرَى أَنْ تَخْرُجَ مِنَ الصُّورَةِ أَيْضًا. تَصَفَّحَتْ أَمِينَةُ المَجَلَّةَ بِسُرْعَةٍ وَتَوَقَّفَتْ عِنْدَ سَرْبٍ مِنْ طُيُورِ البَجَعِ فِي مُسْتَنْقَعٍ بِالأَدْغَالِ، وَفَكَّرَتْ أَنَّ هَذَا هُوَ الصَّوَابُ.

بَدَتْ طُيُورُ البَجَعِ وَكَأَنَّهَا كَعْكَةُ عِيدِ مِيلَادٍ لِلتَّمَاسِيحِ. وَفَجْأَةً بَدَأَ طَرَفُ ذَيْلِ التِّمْسَاحِ يَضْرِبُ شُقُوقَ البَابِ مُصْدِرًا صَوْتًا عَالِيًا.

<img src="images&video/birds.png" alt="ليلة لا تصدق" style="width: 50%; border-radius: 8px; margin-top: 15px;">

حَمَلَتْ أَمِينَةُ بِسُرْعَةٍ صُورَةَ طُيُورِ البَجَعِ إِلَى ثُقْبِ البَابِ وَصَرَخَتْ بِأَعْلَى صَوْتِهَا: «اُخْرُجِي مِنَ المُسْتَنْقَعِ!» ثُمَّ رَمَتْ بِالصُّورَةِ مِنْ خِلَالِ الثُّقْبِ إِلَى المَمَرِّ، وَأَخَذَتْ تُصَفِّقُ بِيَدَيْهَا وَتَصْرُخُ.

وَبِصُعُوبَةٍ صَدَّقَتْ أَمِينَةُ مَا حَدَثَ بَعْدَ ذَلِكَ؛ فَقَدِ امْتَلَأَ المَمَرُّ بِطُيُورِ البَجَعِ وَهِيَ تَصِيحُ وَتَرْفْرِفُ بِأَجْنِحَتِهَا وَتَرْكُضُ بِسَاقَيْهَا الدَّقِيقَتَيْنِ فِي كُلِّ مَكَانٍ. رَأَتْ أَمِينَةُ أَحَدَ الطُّيُورِ مُتَمَسِّكًا بِمِنْقَارِهِ زَهْرَةَ دُوَّارِ الشَّمْسِ، وَآخَرَ خَطَفَ قُبَّعَةَ وَالِدَتِهَا مِنْ خُطَّافِهَا، كَمَا رَأَتْ طَائِرًا يَخْتَفِي فِي فَمِ التِّمْسَاحِ، وَبِقَضْمَتَيْنِ سَرِيعَتَيْنِ ابْتَلَعَهُ. وَبِسُرْعَةٍ تَبِعَهُ الآخَرُ الَّذِي كَانَ مُمْسِكًا بِزَهْرَةِ دُوَّارِ الشَّمْسِ.

بَعْدَ وُجْبَتَيْنِ مِنْ طُيُورِ البَجَعِ اكْتَفَى التِّمْسَاحُ وَاسْتَلْقَى مُرْتَاحًا فِي وَسَطِ المَمَرِّ. وَلَمَّا أَغْمَضَ عَيْنَيْهِ وَسَكَنَ، فَتَحَتْ أَمِينَةُ بَابَهَا بِهُدُوءٍ وَخَرَجَتْ إِلَى المَمَرِّ وَوَضَعَتْ غِلَافَ المَجَلَّةِ الفَارِغَ أَمَامَ أَنْفِ التِّمْسَاحِ وَهَمَسَتْ: «رَجَاءً… رَجَاءً ارْجِعْ إِلَى بَيْتِكَ». ثُمَّ عَادَتْ إِلَى غُرْفَتِهَا وَنَظَرَتْ مِنْ ثُقْبِ البَابِ، فَرَأَتِ التِّمْسَاحَ يَعُودُ إِلَى غِلَافِ المَجَلَّةِ.

ذَهَبَتْ الآنَ بِحَذَرٍ إِلَى غُرْفَةِ المَعِيشَةِ حَيْثُ ازْدَحَمَتْ طُيُورُ البَجَعِ حَوْلَ الأَرِيكَةِ وَعَلَى التِّلْفَازِ، فَفَتَحَتْ أَمِينَةُ المَجَلَّةَ عَلَى الصَّفْحَةِ الخَالِيَةِ مِنَ الصُّورَةِ وَقَالَتْ: «شُكْرًا… شُكْرًا كَثِيرًا لَكُمْ، يُمْكِنُكُمْ العَوْدَةُ الآنَ إِلَى المُسْتَنْقَعِ».

فِي الصَّبَاحِ كَانَ مِنَ الصَّعْبِ عَلَيْهَا أَنْ تَشْرَحَ لِوَالِدَيْهَا سَبَبَ بُقْعَةِ البَلَلِ الكَبِيرَةِ عَلَى الأَرْضِ وَالبَابِ المَكْسُورِ؛ لَمْ يَكُونَا مُقْتَنِعَيْنِ بِقِصَّةِ التِّمْسَاحِ مَعَ أَنَّ قُبَّعَةَ وَالِدَتِهَا مَا زَالَتْ مَفْقُودَةً.`;

        const questions = {
            "لغة عربية": {
                "فهم المقروء": [
                    { q: "ما هي أول إشارة تبين حدوث شيء غير عادي؟ (ارجع إلى الفقرة 2)", options: ["تحرك كومة الصحف والمجلات", "رؤية أمينة لغلاف المجلة", "باب غرفتها كان مكسوراً", "سماعها لصوت كالهسيس"], correct: 3, type: "multiple_choice", level: "استنتاج" },
                    { q: "من أين جاء التمساح؟ (ارجع إلى الفقرة 3)", options: ["الحمام", "غلاف المجلة", "تحت السرير", "النهر القريب"], correct: 1, type: "multiple_choice", level: "استرجاع" },
                    { q: "أي الكلمات تبين أن أمينة كانت خائفة؟", options: ["تجمدت أمينة في مكانها", "لم تصدق عينيها", "اتسعت عيناها كصحني فنجان", "صوت منخفض كالهسيس"], correct: 0, type: "multiple_choice", level: "تفسير" },
                    { q: "لماذا فكرت أمينة أن التمساح سوف يهجم؟", options: ["أظهر صف أسنانه الطويلة", "أصدر صوتاً كالهسيس", "بدأ يشخر وينخر", "حرك ذيله إلى الأمام والخلف"], correct: 3, type: "multiple_choice", level: "استنتاج" },
                    { q: "رتب هذه الجمل حسب ترتيب حدوثها في القصة", type: "ordering", items: ["رأت أمينة التمساح", "أكل التمساح طيرين من البجع", "حاولت أمينة أن تشرح لوالديها سبب كسر الباب", "بدأت أمينة مشيها إلى الحمام", "ركضت أمينة إلى غرفتها وأغلقت الباب"], correctOrder: ["بدأت أمينة مشيها إلى الحمام", "رأت أمينة التمساح", "ركضت أمينة إلى غرفتها وأغلقت الباب", "أكل التمساح طيرين من البجع", "حاولت أمينة أن تشرح لوالديها سبب كسر الباب"], level: "دمج المعلومات" },
                    { q: "لماذا نادت أمينة طيور البجع؟ اكتب سببًا واحدًا", type: "essay", modelAnswer: "(يقبل من الطالب ما يفيد المعنى) نادت أمينة طيور البجع لأنها فكرت أن التمساح جائع ويحتاج إلى طعام ليغادر البيت، وقد قرأت في مجلة الحيوان أن طيور البجع تشبه كعكة عيد الميلاد للتماسيح، فأرادت إطعامه حتى يشبع ويعود إلى مكانه في المجلة", level: "تفسير" },
                    { q: "ما سبب كسر الباب؟ (ارجع إلى الفقرة 7)", options: ["ضرب التمساح الباب بذيله فاخترقه", "ضربته المزهرية الكبيرة", "المنقار الحاد لطائر البجع اصطدم به", "اصطدم به السرير"], correct: 0, type: "multiple_choice", level: "استرجاع" },
                    { q: "كم عمر أمينة في القصة؟ (ارجع إلى الفقرة 1)", options: ["تسع سنوات", "عشر سنوات", "إحدى عشرة سنة", "ثماني سنوات"], correct: 1, type: "multiple_choice", level: "استرجاع" },
                    { q: 'اضغط على هذا الرابط واذكر معلومة واحدة جديدة عن التمساح: <a href="https://ar.wikipedia.org/wiki/%D8%AA%D9%85%D8%B3%D8%A7%D8%AD" target="_blank">اضغط هنا</a>', type: 'essay', modelAnswer: 'تقبل من الطالب جميع الإجابات', level: 'بحث وتطبيق' },
                    { q: "اختر كل ما ينطبق على الأشياء التي حدثت عندما ظهر التمساح", options: ["تساقطت الصحف والمجلات", "كسر المزهرية", "نثر أزهار دوار الشمس", "أكل الطعام من المطبخ", "ترك السجاد مبللاً", "خطف قبعة الأم"], correct: [0, 1, 2, 4], type: "multiple_select", level: "دمج المعلومات" },
                    { q: "صل بين الشخصية والفعل", type: "matching", leftColumn: ["أمينة", "التمساح", "طيور البجع", "الوالدان"], rightColumn: ["لم يصدقا القصة", "دفعت السرير خلف الباب", "أكل طائرين", "خطفت قبعة الأم"], correctMatches: {"أمينة": "دفعت السرير خلف الباب", "التمساح": "أكل طائرين", "طيور البجع": "خطفت قبعة الأم", "الوالدان": "لم يصدقا القصة"}, level: "دمج المعلومات" },
                    { q: "رتب الأحداث حسب تسلسلها في القصة", type: "ordering", items: ["خروج طيور البجع", "اكتشاف المجلة الفارغة", "سماع صوت الهسيس", "عودة التمساح للمجلة"], correctOrder: ["سماع صوت الهسيس", "اكتشاف المجلة الفارغة", "خروج طيور البجع", "عودة التمساح للمجلة"], level: "دمج المعلومات" },
                    { q: "لماذا لم تهتم أمينة بالصوت في البداية؟", options: ["لأنها كانت خائفة", "لأنها كانت نصف نائمة", "لأنها لم تسمعه جيداً", "لأنها اعتادت على الأصوات"], correct: 1, type: "multiple_choice", level: "استنتاج" },
                    { q: "اختر جميع الأشياء التي فعلتها أمينة للحماية من التمساح", options: ["أغلقت الباب بشدة", "دفعت السرير خلف الباب", "اختبأت تحت السرير", "نادت على والديها", "بنت متراساً", "فتحت النافذة"], correct: [0, 1, 4], type: "multiple_select", level: "دمج المعلومات" },
                    { q: "ماذا لاحظت أمينة في غلاف مجلة الحيوان؟ (ارجع إلى الفقرة 5)", type: "dropdown", options: ["أصبح النهر فارغاً من التمساح", "اختفت المجلة تماماً", "تغير لون الغلاف", "ظهرت حيوانات جديدة"], correct: 0, level: "استرجاع" },
                    { q: "اسحب النقطة إلى عدد طيور البجع التي أكلها التمساح (من 1-10) - ارجع إلى الفقرة 10", type: "click_drag", range: [1, 10], correct: 2, level: "استرجاع" },
                    { q: "ما رأيك في تصرف أمينة في حل المشكلة؟ ", type: "essay", modelAnswer: " تصرفت أمينة بذكاء كبير (يقبل من الطالب ما يفيد المعنى)", level: "تقويم" },
                    { q: "ما الذي جعل أمينة تفكر في إطعام التمساح؟", options: ["نصيحة من والديها", "قراءتها في مجلة الحيوان", "اعتقادها أنه جائع", "خوفها من التمساح"], correct: 2, type: "multiple_choice", level: "استنتاج" },
                    { q: "صل بين المكان والحدث", type: "matching", leftColumn: ["تحت منضدة الهاتف", "غرفة أمينة", "الممر", "غرفة المعيشة"], rightColumn: ["عودة طيور البجع للمجلة", "بناء المتراس", "أكل التمساح للطيور", "ظهور التمساح"], correctMatches: {"تحت منضدة الهاتف": "ظهور التمساح", "غرفة أمينة": "بناء المتراس", "الممر": "أكل التمساح للطيور", "غرفة المعيشة": "عودة طيور البجع للمجلة"}, level: "دمج المعلومات" },
                    { q: "رتب هذه الأشياء حسب ظهورها في القصة", type: "ordering", items: ["قبعة الأم المفقودة", "أزهار دوار الشمس", "المزهرية المكسورة", "بقعة البلل"], correctOrder: ["أزهار دوار الشمس", "المزهرية المكسورة", "قبعة الأم المفقودة", "بقعة البلل"], level: "دمج المعلومات" },
                    { q: "كيف عرفت أمينة أن التمساح خرج من المجلة؟", options: ["رأته يخرج مباشرة", "وجدت المجلة فارغة", "أخبرها والداها", "سمعت صوت خروجه"], correct: 1, type: "multiple_choice", level: "استنتاج" },
                    { q: "اختر كل ما ينطبق على الأدلة التي تركها التمساح في البيت", options: ["بقعة البلل على الأرض", "الباب المكسور", "المزهرية المكسورة", "النوافذ المفتوحة", "قبعة الأم المفقودة", "الأثاث المقلوب"], correct: [0, 1, 2, 4], type: "multiple_select", level: "دمج المعلومات" },
                    { q: "ماذا قالت أمينة للتمساح عندما أرادت إرجاعه؟ (ارجع إلى الفقرة 11)", options: ["اذهب بعيداً", "رجاء ارجع إلى بيتك", "لا تعد مرة أخرى", "أنت مخيف جداً"], correct: 1, type: "multiple_choice", level: "استرجاع" },
                    { q: "كيف تمكنت أمينة من إخراج طيور البجع من المجلة؟ (ارجع إلى الفقرة 9)", type: "dropdown", options: ["صرخت عليها لتخرج من المستنقع", "رسمتها بنفسها", "استخدمت العصا السحرية", "طلبت المساعدة من والديها"], correct: 0, level: "استرجاع" },
                    { q: "ما شعور أمينة عندما رأت التمساح لأول مرة؟", options: ["الفرح والسعادة", "الفضول والاهتمام", "الخوف والذهول", "الغضب والانزعاج"], correct: 2, type: "multiple_choice", level: "تفسير" },
                    { q: "لماذا لم يصدق والدا أمينة قصتها؟", options: ["لأنها كانت تكذب دائماً", "لأن القصة غير منطقية", "لأنهما لم يريا التمساح", "لأنها كانت نائمة"], correct: 1, type: "multiple_choice", level: "استنتاج" },
                    { q: "ما الذي فعلته طيور البجع عندما خرجت؟ (ارجع إلى الفقرة 10)", options: ["طارت خارج البيت فوراً", "صاحت ورفرفت وركضت في كل مكان", "اختبأت تحت الأثاث", "هاجمت أمينة"], correct: 1, type: "multiple_choice", level: "استرجاع" },
                    { q: "كيف انتهت مغامرة أمينة مع التمساح؟ (ارجع إلى الفقرة 11)", options: ["هرب التمساح من النافذة", "عاد التمساح إلى المجلة", "أخذه والداها إلى حديقة الحيوان", "بقي التمساح في البيت"], correct: 1, type: "multiple_choice", level: "استرجاع" },
                    { q: "ما الدرس الرئيس من القصة؟", options: ["يجب عدم القراءة ليلاً", "التفكير الإبداعي يساعد في حل المشاكل", "المجلات خطيرة ويجب تجنبها", "الوالدان لا يصدقان الأطفال أبداً"], correct: 1, type: "multiple_choice", level: "تقويم" },
                    { q: "معنى كلمة «مواربًا» كما وردت في النص أقرب إلى:", options: ["مفتوحًا على مصراعيه", "مغلقًا بإحكام", "نصف مفتوح", "مُضاء بالكامل"], correct: 2, type: "multiple_choice", level: "تفسير" }
                ]
            }
        };

        let currentTest = {
            subject: '',
            level: '',
            duration: 0,
            studentName: '',
            recipientEmail: '',
            questions: [],
            answers: [],
            currentQuestion: 0,
            startTime: null,
            timerInterval: null,
            scorePercentage: null,
            correctCount: 0,
            incorrectCount: 0,
            timeSpentSeconds: 0
        };

        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        }

        function updateUI() {
            document.getElementById('schoolName').textContent = currentConfig.school_name || defaultConfig.school_name;
            document.getElementById('welcomeText').textContent = currentConfig.welcome_text || defaultConfig.welcome_text;
            document.getElementById('instructionsTitle').textContent = currentConfig.instructions_title || defaultConfig.instructions_title;
            document.getElementById('resultsTitle').textContent = currentConfig.results_title || defaultConfig.results_title;

            const customFont = currentConfig.font_family || defaultConfig.font_family;
            const baseSize = currentConfig.font_size || defaultConfig.font_size;
            const baseFontStack = 'sans-serif';

            document.body.style.fontFamily = `'${customFont}', ${baseFontStack}`;
            document.body.style.fontSize = `${baseSize}px`;

            const bgColor = currentConfig.background_color || defaultConfig.background_color;
            const surfaceColor = currentConfig.surface_color || defaultConfig.surface_color;
            const textColor = currentConfig.text_color || defaultConfig.text_color;
            const primaryColor = currentConfig.primary_action_color || defaultConfig.primary_action_color;
            const secondaryColor = currentConfig.secondary_action_color || defaultConfig.secondary_action_color;

            document.body.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, 20)} 100%)`;

            document.querySelectorAll('.page').forEach(page => {
                page.style.background = surfaceColor;
                page.style.color = textColor;
            });

            document.querySelectorAll('.btn').forEach(btn => {
                if (!btn.classList.contains('btn-secondary')) {
                    btn.style.background = primaryColor;
                }
            });

            document.querySelectorAll('.btn-secondary').forEach(btn => {
                btn.style.background = secondaryColor;
            });

            document.querySelectorAll('.header h1').forEach(h1 => {
                h1.style.fontSize = `${baseSize * 2.5}px`;
            });

            document.querySelectorAll('.header p').forEach(p => {
                p.style.fontSize = `${baseSize * 1.1}px`;
            });
        }

        function adjustColor(color, percent) {
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1);
        }

        // تعيين المادة تلقائياً للغة العربية
        currentTest.subject = 'لغة عربية';

        document.getElementById('studentName').addEventListener('input', function() {
            currentTest.studentName = this.value.trim();
            checkFormComplete();
        });
        const defaultRecipient = 'kamel.fawwzia333@gmail.com';
        currentTest.recipientEmail = defaultRecipient;
        const levelSelect = document.getElementById('levelSelect');
        if (levelSelect) {
            const defaultLevel = 'فهم المقروء';
            levelSelect.value = defaultLevel;
            currentTest.level = defaultLevel;
            levelSelect.addEventListener('change', function() {
                currentTest.level = this.value;
                checkFormComplete();
            });
            checkFormComplete();
        }
        document.getElementById('durationSelect').addEventListener('change', function() {
            currentTest.duration = parseInt(this.value);
            checkFormComplete();
        });

        function checkFormComplete() {
            const name = currentTest.studentName;
            const subject = currentTest.subject;
            const level = currentTest.level;
            const btn = document.getElementById('continueBtn');

            if (name && subject && level) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        }

        document.getElementById('continueBtn').addEventListener('click', function() {
            currentTest.studentName = currentTest.studentName || document.getElementById('studentName').value.trim();
            currentTest.recipientEmail = defaultRecipient;
            document.getElementById('selectedLevel').textContent = currentTest.level;
            document.getElementById('selectedDuration').textContent = currentTest.duration === 0 ? 'بدون توقيت' : currentTest.duration + ' دقيقة';

            currentTest.questions = questions[currentTest.subject][currentTest.level];
            document.getElementById('totalQuestions').textContent = currentTest.questions.length;

            showPage('rulesPage');
        });

        document.getElementById('backToHomeBtn').addEventListener('click', function() {
            showPage('homePage');
        });

        document.getElementById('startTestBtn').addEventListener('click', function() {
            currentTest.answers = new Array(currentTest.questions.length).fill(null);
            currentTest.currentQuestion = 0;
            currentTest.startTime = Date.now();

            if (currentTest.duration > 0) {
                document.getElementById('timerContainer').style.display = 'block';
                startTimer();
            } else {
                document.getElementById('timerContainer').style.display = 'none';
            }

            showPage('testPage');
            displayQuestion();
        });

        function startTimer() {
            let timeLeft = currentTest.duration * 60;

            currentTest.timerInterval = setInterval(function() {
                timeLeft--;

                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                document.getElementById('timeRemaining').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                if (timeLeft <= 0) {
                    clearInterval(currentTest.timerInterval);
                    finishTest();
                }
            }, 1000);
        }

        function displayQuestion() {
            const q = currentTest.questions[currentTest.currentQuestion];
            const total = currentTest.questions.length;

            document.getElementById('currentQuestion').textContent = currentTest.currentQuestion + 1;
            document.getElementById('totalQuestionsTest').textContent = total;
            document.getElementById('questionNumber').textContent = `السؤال ${currentTest.currentQuestion + 1}`;
            
            // إضافة مستوى الفهم
            if (q.level) {
                const levelBadge = document.createElement('div');
                levelBadge.style.cssText = `
                    display: inline-block;
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.85em;
                    font-weight: 600;
                    margin-right: 10px;
                    border: 1px solid #bbdefb;
                `;
                levelBadge.textContent = `مستوى: ${q.level}`;
                document.getElementById('questionNumber').appendChild(levelBadge);
            }
            
            // إضافة النص للقراءة في مستوى فهم المقروء
            if (currentTest.level === 'فهم المقروء' && currentTest.currentQuestion === 0) {
                const readingDiv = document.createElement('div');
                readingDiv.id = 'readingPassage';
                readingDiv.style.cssText = `
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-right: 4px solid #4CAF50;
                    line-height: 1.8;
                    font-size: 1.05em;
                    max-height: 400px;
                    overflow-y: auto;
                `;
                readingDiv.innerHTML = `
                    <h3 style="color: #1e3c72; margin-top: 0; margin-bottom: 15px;">اقرأ النص التالي، ثم أجب على الأسئلة التي تليه :</h3>
                    <div style="white-space: pre-line;">${readingPassage}</div>
                `;
                
                const questionHeader = document.querySelector('.question-header');
                if (!document.getElementById('readingPassage')) {
                    questionHeader.insertBefore(readingDiv, questionHeader.firstChild);
                }
            }
            
            document.getElementById('questionText').innerHTML = q.q;

            const progress = ((currentTest.currentQuestion + 1) / total) * 100;
            document.getElementById('progressFill').style.width = progress + '%';

            const optionsContainer = document.getElementById('optionsContainer');
            optionsContainer.innerHTML = '';

            const questionType = q.type || 'multiple_choice';

            if (questionType === 'multiple_choice') {
                displayMultipleChoice(q, optionsContainer);
            } else if (questionType === 'drag_drop') {
                displayDragDrop(q, optionsContainer);
            } else if (questionType === 'dropdown') {
                displayDropdown(q, optionsContainer);
            } else if (questionType === 'click_drag') {
                displayClickDrag(q, optionsContainer);
            } else if (questionType === 'essay') {
                displayEssay(q, optionsContainer);
            } else if (questionType === 'matching') {
                displayMatching(q, optionsContainer);
            } else if (questionType === 'ordering') {
                displayOrdering(q, optionsContainer);
            } else if (questionType === 'multiple_select') {
                displayMultipleSelect(q, optionsContainer);
            }

            document.getElementById('prevBtn').disabled = currentTest.currentQuestion === 0;

            if (currentTest.currentQuestion === total - 1) {
                document.getElementById('nextBtn').style.display = 'none';
                document.getElementById('finishBtn').style.display = 'inline-block';
            } else {
                document.getElementById('nextBtn').style.display = 'inline-block';
                document.getElementById('finishBtn').style.display = 'none';
            }

            // إضافة زر عرض النص لمستوى فهم المقروء
            const existingShowTextBtn = document.getElementById('showTextBtn');
            if (currentTest.level === 'فهم المقروء') {
                if (!existingShowTextBtn) {
                    const showTextBtn = document.createElement('button');
                    showTextBtn.id = 'showTextBtn';
                    showTextBtn.className = 'btn btn-secondary';
                    showTextBtn.textContent = 'عرض النص';
                    showTextBtn.style.marginLeft = '10px';
                    
                    showTextBtn.addEventListener('click', function() {
                        const readingDiv = document.getElementById('readingPassage');
                        if (readingDiv) {
                            readingDiv.style.display = readingDiv.style.display === 'none' ? 'block' : 'none';
                            this.textContent = readingDiv.style.display === 'none' ? 'عرض النص' : 'إخفاء النص';
                        } else {
                            // إنشاء النص إذا لم يكن موجوداً
                            const newReadingDiv = document.createElement('div');
                            newReadingDiv.id = 'readingPassage';
                            newReadingDiv.style.cssText = `
                                background: #f8f9fa;
                                padding: 25px;
                                border-radius: 8px;
                                margin: 20px 0;
                                border-right: 4px solid #4CAF50;
                                line-height: 1.8;
                                font-size: 1.05em;
                                max-height: 400px;
                                overflow-y: auto;
                            `;
                            newReadingDiv.innerHTML = `
                                <h3 style="color: #1e3c72; margin-top: 0; margin-bottom: 15px;">النص المطلوب قراءته:</h3>
                                <div style="white-space: pre-line;">${readingPassage}</div>
                            `;
                            
                            const questionHeader = document.querySelector('.question-header');
                            questionHeader.insertBefore(newReadingDiv, questionHeader.firstChild);
                            this.textContent = 'إخفاء النص';
                        }
                    });
                    
                    const btnGroup = document.querySelector('.btn-group');
                    btnGroup.insertBefore(showTextBtn, btnGroup.firstChild);
                }
            } else if (existingShowTextBtn) {
                existingShowTextBtn.remove();
            }
        }

        function displayMultipleChoice(q, container) {
            q.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option';
                optionDiv.textContent = option;

                if (currentTest.answers[currentTest.currentQuestion] === index) {
                    optionDiv.classList.add('selected');
                }

                optionDiv.addEventListener('click', function() {
                    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    currentTest.answers[currentTest.currentQuestion] = index;
                    showAnswerNote();
                });

                container.appendChild(optionDiv);
            });
        }

        function displayDragDrop(q, container) {
            const dragDropDiv = document.createElement('div');
            dragDropDiv.className = 'drag-drop-container';

            const instruction = document.createElement('p');
            instruction.textContent = 'اسحب العناصر وأفلتها في المنطقة أدناه بالترتيب الصحيح';
            instruction.style.marginBottom = '15px';
            instruction.style.fontWeight = '600';
            dragDropDiv.appendChild(instruction);

            const dragItems = document.createElement('div');
            dragItems.className = 'drag-items';

            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            const itemsToShow = savedAnswer && Array.isArray(savedAnswer) ? q.items : q.items.slice().sort(() => Math.random() - 0.5);

            itemsToShow.forEach((item, index) => {
                const dragItem = document.createElement('div');
                dragItem.className = 'drag-item';
                dragItem.textContent = item;
                dragItem.draggable = true;
                dragItem.dataset.item = item;

                dragItem.addEventListener('dragstart', function(e) {
                    this.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item);
                });

                dragItem.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                });

                dragItems.appendChild(dragItem);
            });

            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.id = 'dropZone';

            if (savedAnswer && Array.isArray(savedAnswer)) {
                savedAnswer.forEach(item => {
                    const dragItem = document.createElement('div');
                    dragItem.className = 'drag-item';
                    dragItem.textContent = item;
                    dragItem.draggable = true;
                    dragItem.dataset.item = item;

                    dragItem.addEventListener('dragstart', function(e) {
                        this.classList.add('dragging');
                        e.dataTransfer.setData('text/plain', item);
                    });

                    dragItem.addEventListener('dragend', function() {
                        this.classList.remove('dragging');
                    });

                    dropZone.appendChild(dragItem);
                });
                dragItems.innerHTML = '';
            }

            dropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                const item = e.dataTransfer.getData('text/plain');
                const draggingElement = document.querySelector('.dragging');

                if (draggingElement) {
                    this.appendChild(draggingElement);
                    updateDragDropAnswer();
                }
            });

            dragItems.addEventListener('dragover', function(e) {
                e.preventDefault();
            });

            dragItems.addEventListener('drop', function(e) {
                e.preventDefault();
                const draggingElement = document.querySelector('.dragging');
                if (draggingElement && draggingElement.parentElement.id === 'dropZone') {
                    this.appendChild(draggingElement);
                    updateDragDropAnswer();
                }
            });

            function updateDragDropAnswer() {
                const droppedItems = Array.from(dropZone.children).map(el => el.dataset.item);
                currentTest.answers[currentTest.currentQuestion] = droppedItems;
                if (droppedItems.length > 0) {
                    showAnswerNote();
                }
            }

            dragDropDiv.appendChild(dragItems);
            dragDropDiv.appendChild(dropZone);
            container.appendChild(dragDropDiv);
        }

        function displayDropdown(q, container) {
            const dropdownDiv = document.createElement('div');
            dropdownDiv.className = 'dropdown-container';

            const select = document.createElement('select');
            select.className = 'dropdown-select';
            select.id = 'dropdownSelect';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'اختر الإجابة الصحيحة';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);

            q.options.forEach((option, index) => {
                const optionElement = document.createElement('option');
                optionElement.value = index;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });

            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            if (savedAnswer !== null && savedAnswer !== undefined) {
                select.value = savedAnswer;
                select.classList.add('answered');
            }

            select.addEventListener('change', function() {
                currentTest.answers[currentTest.currentQuestion] = parseInt(this.value);
                this.classList.add('answered');
                showAnswerNote();
            });

            dropdownDiv.appendChild(select);
            container.appendChild(dropdownDiv);
        }

        function displayClickDrag(q, container) {
            const clickDragDiv = document.createElement('div');
            clickDragDiv.className = 'click-drag-container';

            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';

            const instruction = document.createElement('p');
            instruction.textContent = 'اسحب المؤشر لاختيار الإجابة الصحيحة';
            instruction.style.marginBottom = '20px';
            instruction.style.fontWeight = '600';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'slider';
            slider.min = q.range[0];
            slider.max = q.range[1];
            slider.value = q.range[0];
            slider.id = 'clickDragSlider';

            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'slider-value';
            valueDisplay.textContent = `القيمة المختارة: ${slider.value}`;

            const labels = document.createElement('div');
            labels.className = 'slider-labels';
            labels.innerHTML = `<span>${q.range[0]}</span><span>${q.range[1]}</span>`;

            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            if (savedAnswer !== null && savedAnswer !== undefined) {
                slider.value = savedAnswer;
                valueDisplay.textContent = `القيمة المختارة: ${savedAnswer}`;
            }

            slider.addEventListener('input', function() {
                valueDisplay.textContent = `القيمة المختارة: ${this.value}`;
                currentTest.answers[currentTest.currentQuestion] = parseInt(this.value);
                showAnswerNote();
            });

            sliderContainer.appendChild(instruction);
            sliderContainer.appendChild(valueDisplay);
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(labels);
            clickDragDiv.appendChild(sliderContainer);
            container.appendChild(clickDragDiv);
        }

        function displayEssay(q, container) {
            const essayDiv = document.createElement('div');
            essayDiv.className = 'essay-container';

            const instructions = document.createElement('div');
            instructions.className = 'essay-instructions';
            instructions.innerHTML = `
                <strong>تعليمات:</strong><br>
                • اكتب إجابتك بوضوح ودقة<br>
                • لا يوجد حد أدنى أو أقصى لعدد الكلمات<br>
                • ركز على المحتوى والمعنى
            `;

            const textarea = document.createElement('textarea');
            textarea.className = 'essay-textarea';
            textarea.placeholder = 'اكتب إجابتك هنا...';
            textarea.id = 'essayTextarea';

            const wordCount = document.createElement('div');
            wordCount.className = 'word-count';
            wordCount.textContent = 'عدد الكلمات: 0';

            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            if (savedAnswer && typeof savedAnswer === 'string') {
                textarea.value = savedAnswer;
                textarea.classList.add('answered');
                updateWordCount();
            }

            function updateWordCount() {
                const text = textarea.value.trim();
                const words = text ? text.split(/\s+/).length : 0;
                wordCount.textContent = `عدد الكلمات: ${words}`;
                wordCount.className = 'word-count valid';
            }

            textarea.addEventListener('input', function() {
                currentTest.answers[currentTest.currentQuestion] = this.value;
                updateWordCount();
                
                if (this.value.trim()) {
                    this.classList.add('answered');
                    showAnswerNote();
                } else {
                    this.classList.remove('answered');
                }
            });

            essayDiv.appendChild(instructions);
            essayDiv.appendChild(textarea);
            essayDiv.appendChild(wordCount);
            container.appendChild(essayDiv);
        }

        function displayMatching(q, container) {
            const matchingDiv = document.createElement('div');
            matchingDiv.className = 'matching-container';

            const instruction = document.createElement('p');
            instruction.textContent = 'انقر على عنصر من العمود الأيسر ثم على العنصر المطابق له من العمود الأيمن';
            instruction.style.marginBottom = '20px';
            instruction.style.fontWeight = '600';
            instruction.style.textAlign = 'center';

            const columnsDiv = document.createElement('div');
            columnsDiv.className = 'matching-columns';
            columnsDiv.style.position = 'relative';

            const leftColumn = document.createElement('div');
            leftColumn.className = 'matching-column';
            leftColumn.innerHTML = '<h4>العمود الأول</h4>';

            const rightColumn = document.createElement('div');
            rightColumn.className = 'matching-column';
            rightColumn.innerHTML = '<h4>العمود الثاني</h4>';

            let selectedLeft = null;
            let matches = {};
            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            if (savedAnswer && typeof savedAnswer === 'object') {
                matches = { ...savedAnswer };
            }

            q.leftColumn.forEach((item, index) => {
                const leftItem = document.createElement('div');
                leftItem.className = 'matching-item';
                leftItem.textContent = item;
                leftItem.dataset.item = item;
                leftItem.dataset.side = 'left';

                if (matches[item]) {
                    leftItem.classList.add('matched');
                }

                leftItem.addEventListener('click', function() {
                    if (this.classList.contains('matched')) return;

                    document.querySelectorAll('.matching-item[data-side="left"]').forEach(el => {
                        el.classList.remove('selected');
                    });

                    this.classList.add('selected');
                    selectedLeft = item;
                });

                leftColumn.appendChild(leftItem);
            });

            q.rightColumn.forEach((item, index) => {
                const rightItem = document.createElement('div');
                rightItem.className = 'matching-item';
                rightItem.textContent = item;
                rightItem.dataset.item = item;
                rightItem.dataset.side = 'right';

                if (Object.values(matches).includes(item)) {
                    rightItem.classList.add('matched');
                }

                rightItem.addEventListener('click', function() {
                    if (this.classList.contains('matched') || !selectedLeft) return;

                    matches[selectedLeft] = item;
                    currentTest.answers[currentTest.currentQuestion] = matches;

                    // تحديث الواجهة
                    document.querySelector(`[data-item="${selectedLeft}"][data-side="left"]`).classList.add('matched');
                    document.querySelector(`[data-item="${selectedLeft}"][data-side="left"]`).classList.remove('selected');
                    this.classList.add('matched');

                    selectedLeft = null;
                    showAnswerNote();
                });

                rightColumn.appendChild(rightItem);
            });

            columnsDiv.appendChild(leftColumn);
            columnsDiv.appendChild(rightColumn);

            matchingDiv.appendChild(instruction);
            matchingDiv.appendChild(columnsDiv);
            container.appendChild(matchingDiv);
        }

        function displayOrdering(q, container) {
            const orderingDiv = document.createElement('div');
            orderingDiv.className = 'ordering-container';

            const instruction = document.createElement('p');
            instruction.textContent = 'اسحب العناصر لترتيبها بالتسلسل الصحيح';
            instruction.style.marginBottom = '20px';
            instruction.style.fontWeight = '600';
            instruction.style.textAlign = 'center';

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'ordering-items';

            const pinnedItem = Array.isArray(q.correctOrder) && q.correctOrder.length > 0
                ? q.correctOrder[0]
                : null;

            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            let itemsToShow;

            if (savedAnswer && Array.isArray(savedAnswer)) {
                const sanitizedAnswer = pinnedItem
                    ? savedAnswer.filter(item => item !== pinnedItem)
                    : [...savedAnswer];
                itemsToShow = pinnedItem ? [pinnedItem, ...sanitizedAnswer] : sanitizedAnswer;
            } else {
                const shuffledItems = q.items.slice().sort(() => Math.random() - 0.5);
                if (pinnedItem) {
                    const withoutPinned = shuffledItems.filter(item => item !== pinnedItem);
                    itemsToShow = [pinnedItem, ...withoutPinned];
                } else {
                    itemsToShow = shuffledItems;
                }
            }

            function updateOrderingNumbers() {
                const items = itemsContainer.querySelectorAll('.ordering-item');
                items.forEach((item, index) => {
                    const numberSpan = item.querySelector('.ordering-number');
                    numberSpan.textContent = index + 1;
                });
            }

            itemsToShow.forEach((item, index) => {
                const orderingItem = document.createElement('div');
                orderingItem.className = 'ordering-item';
                orderingItem.dataset.item = item;

                const isPinned = pinnedItem && item === pinnedItem;
                if (!isPinned) {
                    orderingItem.draggable = true;
                } else {
                    orderingItem.classList.add('fixed-ordering-item');
                    orderingItem.draggable = false;
                }

                const itemText = document.createElement('span');
                itemText.textContent = item;

                const numberSpan = document.createElement('span');
                numberSpan.className = 'ordering-number';
                numberSpan.textContent = index + 1;

                orderingItem.appendChild(itemText);
                orderingItem.appendChild(numberSpan);

                if (!isPinned) {
                    orderingItem.addEventListener('dragstart', function(e) {
                        this.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', item);
                    });

                    orderingItem.addEventListener('dragend', function() {
                        this.classList.remove('dragging');
                    });
                }

                itemsContainer.appendChild(orderingItem);
            });

            itemsContainer.addEventListener('dragover', function(e) {
                e.preventDefault();
                const dragging = document.querySelector('.ordering-item.dragging');
                if (!dragging) return;
                const afterElement = getDragAfterElement(itemsContainer, e.clientY);
                const fixedElement = itemsContainer.querySelector('.fixed-ordering-item');
                let targetElement = afterElement;

                if (fixedElement && targetElement === fixedElement) {
                    targetElement = fixedElement.nextElementSibling;
                }
                
                if (targetElement == null) {
                    itemsContainer.appendChild(dragging);
                } else {
                    itemsContainer.insertBefore(dragging, targetElement);
                }
                
                updateOrderingNumbers();
                updateOrderingAnswer();
            });

            function getDragAfterElement(container, y) {
                const draggableElements = [...container.querySelectorAll('.ordering-item:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }

            function updateOrderingAnswer() {
                const orderedItems = Array.from(itemsContainer.children).map(el => el.dataset.item);
                if (pinnedItem) {
                    const filtered = orderedItems.filter(item => item !== pinnedItem);
                    currentTest.answers[currentTest.currentQuestion] = [pinnedItem, ...filtered];
                } else {
                    currentTest.answers[currentTest.currentQuestion] = orderedItems;
                }
                showAnswerNote();
            }

            updateOrderingNumbers();

            orderingDiv.appendChild(instruction);
            orderingDiv.appendChild(itemsContainer);
            container.appendChild(orderingDiv);
        }

        function displayMultipleSelect(q, container) {
            const multiSelectDiv = document.createElement('div');
            multiSelectDiv.className = 'multiple-select-container';

            const instructions = document.createElement('div');
            instructions.className = 'multiple-select-instructions';
            instructions.textContent = 'اختر كل ما ينطبق';

            const savedAnswer = currentTest.answers[currentTest.currentQuestion];
            let selectedOptions = [];
            if (savedAnswer && Array.isArray(savedAnswer)) {
                selectedOptions = [...savedAnswer];
            }

            q.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'multiple-select-option';
                
                if (selectedOptions.includes(index)) {
                    optionDiv.classList.add('selected');
                }

                const checkbox = document.createElement('div');
                checkbox.className = 'multiple-select-checkbox';
                if (selectedOptions.includes(index)) {
                    checkbox.textContent = '✓';
                }

                const text = document.createElement('span');
                text.textContent = option;

                optionDiv.appendChild(checkbox);
                optionDiv.appendChild(text);

                optionDiv.addEventListener('click', function() {
                    const isSelected = this.classList.contains('selected');
                    
                    if (isSelected) {
                        this.classList.remove('selected');
                        checkbox.textContent = '';
                        selectedOptions = selectedOptions.filter(i => i !== index);
                    } else {
                        this.classList.add('selected');
                        checkbox.textContent = '✓';
                        selectedOptions.push(index);
                    }

                    currentTest.answers[currentTest.currentQuestion] = selectedOptions;
                    if (selectedOptions.length > 0) {
                        showAnswerNote();
                    }
                });

                multiSelectDiv.appendChild(optionDiv);
            });

            container.appendChild(instructions);
            container.appendChild(multiSelectDiv);
        }

        function showAnswerNote() {
            const note = document.getElementById('answerNote');
            note.style.display = 'block';
            setTimeout(() => {
                note.style.display = 'none';
            }, 2000);
        }

        document.getElementById('prevBtn').addEventListener('click', function() {
            if (currentTest.currentQuestion > 0) {
                currentTest.currentQuestion--;
                displayQuestion();
            }
        });

        document.getElementById('nextBtn').addEventListener('click', function() {
            if (currentTest.currentQuestion < currentTest.questions.length - 1) {
                currentTest.currentQuestion++;
                displayQuestion();
            }
        });

        document.getElementById('saveProgressBtn').addEventListener('click', function() {
            if (currentTest.timerInterval) {
                clearInterval(currentTest.timerInterval);
            }
            alert('تم حفظ تقدمك! يمكنك العودة لاحقاً لإكمال الاختبار.');
            showPage('homePage');
        });

        document.getElementById('finishBtn').addEventListener('click', finishTest);

        function checkEssayAnswer(userAnswer, modelAnswer) {
            // تنظيف النصوص وتحويلها للأحرف الصغيرة
            const cleanUser = userAnswer.trim().toLowerCase()
                .replace(/[،؛:.!؟]/g, '') // إزالة علامات الترقيم
                .replace(/\s+/g, ' '); // توحيد المسافات
            
            const cleanModel = modelAnswer.trim().toLowerCase()
                .replace(/[،؛:.!؟]/g, '')
                .replace(/\s+/g, ' ');

            // استخراج الكلمات المفتاحية من الإجابة النموذجية
            const modelWords = cleanModel.split(' ').filter(word => word.length > 2);
            const userWords = cleanUser.split(' ');

            // حساب نسبة التطابق
            let matchCount = 0;
            modelWords.forEach(modelWord => {
                if (userWords.some(userWord => 
                    userWord.includes(modelWord) || modelWord.includes(userWord) ||
                    Math.abs(userWord.length - modelWord.length) <= 1
                )) {
                    matchCount++;
                }
            });

            // إذا كانت نسبة التطابق أكثر من 40% نعتبر الإجابة صحيحة
            const matchPercentage = (matchCount / modelWords.length) * 100;
            return matchPercentage >= 40;
        }

        function formatDurationDisplay(seconds) {
            if (!Number.isFinite(seconds)) {
                return '0 د 0 ث';
            }
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes} د ${remainingSeconds} ث`;
        }

        function formatDurationEmail(seconds) {
            if (!Number.isFinite(seconds)) {
                return 'غير محسوب';
            }
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes} دقيقة ${remainingSeconds} ثانية`;
        }

        function buildResultSummary() {
            const lines = [
                `اسم الطالب: ${currentTest.studentName || 'غير محدد'}`,
                `المادة: ${currentTest.subject || 'غير محددة'}`,
                `المستوى: ${currentTest.level || 'غير محدد'}`,
                `النتيجة: ${typeof currentTest.scorePercentage === 'number' ? currentTest.scorePercentage + '%' : 'غير متوفرة'}`,
                `عدد الإجابات الصحيحة: ${currentTest.correctCount}`,
                `عدد الإجابات الخاطئة: ${currentTest.incorrectCount}`,
                `الوقت المستغرق: ${formatDurationEmail(currentTest.timeSpentSeconds)}`,
                '',
                `تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}`,
                '',
                'تم إنشاء هذه النتيجة بواسطة منصة الاختبارات التعليمية.'
            ];

            return lines.join('\n');
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        async function finishTest() {
            if (currentTest.timerInterval) {
                clearInterval(currentTest.timerInterval);
            }

            const timeSpent = Math.floor((Date.now() - currentTest.startTime) / 1000);
            let correctCount = 0;

            currentTest.questions.forEach((q, index) => {
                const userAnswer = currentTest.answers[index];
                const questionType = q.type || 'multiple_choice';

                if (questionType === 'multiple_choice') {
                    if (userAnswer === q.correct) {
                        correctCount++;
                    }
                } else if (questionType === 'drag_drop') {
                    if (Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(q.correctOrder)) {
                        correctCount++;
                    }
                } else if (questionType === 'dropdown') {
                    if (userAnswer === q.correct) {
                        correctCount++;
                    }
                } else if (questionType === 'click_drag') {
                    if (userAnswer === q.correct) {
                        correctCount++;
                    }
                } else if (questionType === 'essay') {
                    // للأسئلة المقالية، نقارن مع الإجابة النموذجية
                    if (userAnswer && typeof userAnswer === 'string' && q.modelAnswer) {
                        if (checkEssayAnswer(userAnswer, q.modelAnswer)) {
                            correctCount++;
                        }
                    }
                } else if (questionType === 'matching') {
                    if (userAnswer && typeof userAnswer === 'object') {
                        let allCorrect = true;
                        for (const [key, value] of Object.entries(q.correctMatches)) {
                            if (userAnswer[key] !== value) {
                                allCorrect = false;
                                break;
                            }
                        }
                        if (allCorrect && Object.keys(userAnswer).length === Object.keys(q.correctMatches).length) {
                            correctCount++;
                        }
                    }
                } else if (questionType === 'ordering') {
                    if (Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(q.correctOrder)) {
                        correctCount++;
                    }
                } else if (questionType === 'multiple_select') {
                    if (Array.isArray(userAnswer) && Array.isArray(q.correct)) {
                        const sortedUser = [...userAnswer].sort((a, b) => a - b);
                        const sortedCorrect = [...q.correct].sort((a, b) => a - b);
                        if (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)) {
                            correctCount++;
                        }
                    }
                }
            });

            const totalQuestions = currentTest.questions.length;
            const score = (correctCount / totalQuestions) * 100;

            currentTest.scorePercentage = Math.round(score);
            currentTest.correctCount = correctCount;
            currentTest.incorrectCount = totalQuestions - correctCount;
            currentTest.timeSpentSeconds = timeSpent;

            document.getElementById('scorePercentage').textContent = `${currentTest.scorePercentage}%`;
            document.getElementById('correctCount').textContent = currentTest.correctCount;
            document.getElementById('incorrectCount').textContent = currentTest.incorrectCount;
            document.getElementById('timeSpent').textContent = formatDurationDisplay(currentTest.timeSpentSeconds);

            displayReview();
            showPage('resultsPage');
        }

        function displayReview() {
            const reviewContainer = document.getElementById('reviewContainer');
            reviewContainer.innerHTML = '';

            currentTest.questions.forEach((q, index) => {
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';

                const questionDiv = document.createElement('div');
                questionDiv.className = 'review-question';
                questionDiv.innerHTML = `<strong>السؤال ${index + 1}:</strong> ${q.q}`;
                reviewItem.appendChild(questionDiv);

                const userAnswer = currentTest.answers[index];
                const userAnswerDiv = document.createElement('div');
                userAnswerDiv.className = 'review-answer user-answer';
                
                const correctAnswerDiv = document.createElement('div');
                correctAnswerDiv.className = 'review-answer correct-answer';

                let isCorrect = false;
                const questionType = q.type || 'multiple_choice';

                if (questionType === 'multiple_choice') {
                    isCorrect = userAnswer === q.correct;
                    userAnswerDiv.textContent = `إجابتك: ${userAnswer !== null ? q.options[userAnswer] : 'لم تجب'}`;
                    correctAnswerDiv.textContent = `الإجابة الصحيحة: ${q.options[q.correct]}`;
                } else if (questionType === 'drag_drop' || questionType === 'ordering') {
                    isCorrect = Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(q.correctOrder);
                    userAnswerDiv.textContent = `ترتيبك: ${userAnswer ? userAnswer.join(', ') : 'لم تجب'}`;
                    correctAnswerDiv.textContent = `الترتيب الصحيح: ${q.correctOrder.join(', ')}`;
                } else if (questionType === 'dropdown') {
                    isCorrect = userAnswer === q.correct;
                    userAnswerDiv.textContent = `اختيارك: ${userAnswer !== null ? q.options[userAnswer] : 'لم تجب'}`;
                    correctAnswerDiv.textContent = `الاختيار الصحيح: ${q.options[q.correct]}`;
                } else if (questionType === 'click_drag') {
                    isCorrect = userAnswer === q.correct;
                    userAnswerDiv.textContent = `اختيارك: ${userAnswer !== null ? userAnswer : 'لم تجب'}`;
                    correctAnswerDiv.textContent = `الاختيار الصحيح: ${q.correct}`;
                } else if (questionType === 'essay') {
                    isCorrect = userAnswer && typeof userAnswer === 'string' && q.modelAnswer && checkEssayAnswer(userAnswer, q.modelAnswer);
                    userAnswerDiv.innerHTML = `إجابتك: <p style="white-space: pre-wrap; background: #f0f0f0; padding: 10px; border-radius: 4px;">${userAnswer || 'لم تجب'}</p>`;
                    correctAnswerDiv.innerHTML = `الإجابة النموذجية: <p style="white-space: pre-wrap; background: #e8f5e9; padding: 10px; border-radius: 4px;">${q.modelAnswer}</p>`;
                } else if (questionType === 'matching') {
                    if (userAnswer && typeof userAnswer === 'object') {
                        let allCorrect = true;
                        for (const [key, value] of Object.entries(q.correctMatches)) {
                            if (userAnswer[key] !== value) {
                                allCorrect = false;
                                break;
                            }
                        }
                        isCorrect = allCorrect && Object.keys(userAnswer).length === Object.keys(q.correctMatches).length;
                    }
                    
                    const userAnswerText = userAnswer ? Object.entries(userAnswer).map(([k, v]) => `${k} -> ${v}`).join('<br>') : 'لم تجب';
                    userAnswerDiv.innerHTML = `مطابقتك:<br>${userAnswerText}`;
                    
                    const correctAnswerText = Object.entries(q.correctMatches).map(([k, v]) => `${k} -> ${v}`).join('<br>');
                    correctAnswerDiv.innerHTML = `المطابقة الصحيحة:<br>${correctAnswerText}`;
                } else if (questionType === 'multiple_select') {
                    if (Array.isArray(userAnswer) && Array.isArray(q.correct)) {
                        const sortedUser = [...userAnswer].sort((a, b) => a - b);
                        const sortedCorrect = [...q.correct].sort((a, b) => a - b);
                        isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
                    }
                    
                    const userAnswerText = userAnswer ? userAnswer.map(i => q.options[i]).join(', ') : 'لم تجب';
                    userAnswerDiv.textContent = `اختياراتك: ${userAnswerText}`;
                    
                    const correctAnswerText = q.correct.map(i => q.options[i]).join(', ');
                    correctAnswerDiv.textContent = `الاختيارات الصحيحة: ${correctAnswerText}`;
                }

                if (isCorrect) {
                    reviewItem.classList.add('correct');
                    reviewItem.appendChild(correctAnswerDiv);
                } else {
                    reviewItem.classList.add('incorrect');
                    reviewItem.appendChild(userAnswerDiv);
                    reviewItem.appendChild(correctAnswerDiv);
                }

                reviewContainer.appendChild(reviewItem);
            });
        }

        document.getElementById('newTestBtn').addEventListener('click', function() {
            // إعادة تعيين كل شيء
            currentTest = {
                subject: '',
                level: '',
                duration: 0,
                studentName: '',
                recipientEmail: defaultRecipient,
                questions: [],
                answers: [],
                currentQuestion: 0,
                startTime: null,
                timerInterval: null,
                scorePercentage: null,
                correctCount: 0,
                incorrectCount: 0,
                timeSpentSeconds: 0
            };
            
            // إعادة تعيين حقول النموذج
            document.getElementById('studentName').value = '';
            document.getElementById('recipientEmail').value = defaultRecipient;
            document.getElementById('levelSelect').value = '';
            document.getElementById('durationSelect').value = '0';
            document.getElementById('continueBtn').disabled = true;
            
            // تعيين المادة تلقائياً
            currentTest.subject = 'لغة عربية';
            
            showPage('homePage');
        });

        document.getElementById('sendResultBtn').addEventListener('click', function() {
            if (typeof currentTest.scorePercentage !== 'number') {
                alert('يرجى إكمال الاختبار أولاً قبل إرسال النتيجة.');
                return;
            }

            const email = defaultRecipient;

            const subject = encodeURIComponent(`نتيجة اختبار ${currentTest.studentName || 'طالب'}`);
            const body = encodeURIComponent(buildResultSummary());

            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        });

        // تحميل الإعدادات من data_sdk.js
        if (typeof window.getTestConfig === 'function') {
            window.getTestConfig().then(config => {
                currentConfig = { ...defaultConfig, ...config };
                updateUI();
            }).catch(error => {
                console.error("Failed to load config:", error);
                updateUI();
            });
        } else {
            updateUI();
        }

        // تحميل بيانات الاختبار من data_sdk.js
        if (typeof window.getTestData === 'function') {
            window.getTestData().then(data => {
                allTestData = data;
                // يمكنك هنا دمج بيانات الاختبار المحملة مع البيانات الموجودة
                // على سبيل المثال: Object.assign(questions, data);
            }).catch(error => {
                console.error("Failed to load test data:", error);
            });
        }
    
