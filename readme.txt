قبل انشاء فرع جديد
لتأكد من أنك على الفرع الرئيسي وتحديثه:
git checkout main
git pull origin main

انشاء فرع جديد في جيت هاب
git checkout -b 
git push -u origin new-branch-name
==================================
to delete branch:
git branch -D branch-name from localy
git push origin --delete branch-name
=======================================
نصيحة للفريق:
بعد أن يقوم زميلك بحذف فرع من السيرفر، قد يظل اسم الفرع يظهر عندك في القائمة المحلية. لتنظيف جهازك من أسماء الفروع المحذوفة، استخدم هذا الأمر:

Bash

git fetch --prune


3. قواعد ذهبية للفريق عند التعامل مع الفروع:
الابتعاد عن الفرع الرئيسي: لا يرفع أي عضو كوده مباشرة على main. الكل يرفع على فرعه الخاص أولاً.

استخدام الـ Pull Requests: بعد انتهاء العضو من فرعه، يقوم بعمل Pull Request ليقوم بقية الفريق بمراجعة الكود قبل الدمج.

أسماء واضحة: تجنبوا الأسماء الغامضة مثل test1 أو update أو new-work.

تحديث الفرع: اطلب من الفريق دائماً عمل git pull origin main داخل فروعهم بشكل دوري لضمان أن كودهم متوافق مع آخر تحديثات بقية الزملاء.


العضو,المهمة المتوقعة,اسم الفرع المقترح

عضو 1,برمجة منطق البحث والـ API,feat/search-functionality
عضو 2,تحسين التصميم والـ CSS,style/responsive-layout
عضو 3,معالجة الأخطاء والتأكد من الأداء,refactor/optimize-performance
عضو 4,إضافة صفحات جديدة (مثل تفاصيل الفيلم),feat/movie-details-page


===============
قبل ما تبدأ كل مرة 🔄
عشان ما يحصلش تعارض:
git checkout main
git pull origin main
git checkout kareem-navbar
git merge main
