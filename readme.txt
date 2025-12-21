قبل انشاء فرع جديد
لتأكد من أنك على الفرع الرئيسي وتحديثه:
git checkout main
git pull origin main

انشاء فرع جديد في جيت هاب
git checkout -b negitwbranch
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


…or create a new repository on the command line
echo "# Movies-List" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/MoustafaGaber/Movies-List.git

git clone https://github.com/MoustafaGaber/Movies-List.git

git push -u origin main
…or push an existing repository from the command line
git remote add origin https://github.com/MoustafaGaber/Movies-List.git
git branch -M main
git push -u origin main

2. حل الـ Rebase (للحفاظ على تاريخ نظيف)
بدلاً من الدمج التقليدي، يمكنك وضع تعديلاتك "فوق" التعديلات الجديدة: git pull --rebase origin main ثم ارفع ملفاتك بـ git push.

3. حل الـ Force Push (استخدمه بحذر شديد!)
إذا كنت متأكداً 100% أنك تريد مسح ما هو موجود على السيرفر واستبداله بملفاتك الحالية (مثلاً لو كنت تعمل وحدك تماماً والتعديلات القديمة لا تهمك): git push -f origin main

تنبيه: هذا الأمر قد يمسح شغل زملائك إذا كنت تعمل ضمن فريق، لذا لا تستخدمه إلا في الضرورة القصوى.