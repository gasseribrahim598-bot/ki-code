const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');
fs.mkdirSync(DATA_DIR, {recursive:true});
fs.mkdirSync(UPLOAD_DIR, {recursive:true});

app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:false, limit:'1mb'}));
app.use(session({
  name:'kicode.sid',
  secret:process.env.SESSION_SECRET || 'DEV-ONLY-change-this-session-secret-before-deploying-please',
  resave:false, saveUninitialized:false,
  cookie:{httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV === 'production', maxAge: 1000*60*60*8}
}));
app.use('/api/auth', rateLimit({windowMs:15*60*1000, limit:40, standardHeaders:true, legacyHeaders:false}));
app.use(express.static(path.join(ROOT,'public')));

const dbFile = path.join(DATA_DIR,'db.json');
const seedCourses = [
 ['أساسيات البرمجة من الصفر','basics','مناسب تمامًا لمن لم يكتب سطر كود من قبل.',299,'🌱','مفاهيم البرمجة، الخوارزميات، المتغيرات، الشروط، الحلقات، الدوال وحل المشكلات.'],
 ['HTML و CSS وتصميم المواقع','web','أنشئ أول صفحة ويب ثم صمم مواقع متجاوبة.',399,'🎨','بناء الصفحات، العناصر، التنسيق، Flexbox، Grid، Responsive Design وإتاحة الاستخدام.'],
 ['JavaScript من الصفر للاحتراف','web','اجعل صفحاتك تفاعلية وافهم لغة الويب الأساسية.',699,'⚡','القيم والأنواع، الدوال، DOM، الأحداث، البرمجة غير المتزامنة، الوحدات والاختبارات.'],
 ['تطوير الواجهات بـ React','web','ابنِ واجهات حديثة بمكونات قابلة لإعادة الاستخدام.',799,'⚛️','Components، Props، State، Hooks، التوجيه، النماذج، جلب البيانات وأفضل الممارسات.'],
 ['Node.js و Express','backend','أنشئ خوادم وواجهات API باستخدام JavaScript.',799,'🧩','HTTP، Express، Middleware، التحقق، الجلسات، المصادقة، رفع الملفات والأمان.'],
 ['Python للمبتدئين','languages','تعلم بايثون بأمثلة عملية سهلة.',499,'🐍','المتغيرات، الأنواع، الشروط، الحلقات، الدوال، الملفات، المكتبات والاستثناءات.'],
 ['Python للمستوى المتقدم','languages','اكتب برامج منظمة واختبرها.',699,'🧠','OOP، Iterators، Generators، Decorators، Type Hints، Testing وتنظيم المشاريع.'],
 ['قواعد البيانات و SQL','database','صمم قاعدة بيانات واستعلم عن البيانات.',599,'🗄️','الجداول، العلاقات، SELECT، JOIN، القيود، الفهارس، المعاملات والتصميم.'],
 ['Git و GitHub','tools','احفظ تاريخ مشروعك وتعاون مع فريق.',249,'🌿','Repositories، Commits، Branches، Merge، Pull Requests وحل التعارضات.'],
 ['لغة C من الأساسيات','languages','افهم الذاكرة وأنواع البيانات ومبادئ البرمجة.',599,'©️','الأنواع، المؤشرات، المصفوفات، الدوال، الذاكرة والملفات.'],
 ['C++ وهياكل البيانات','languages','تعلم البرمجة الكائنية وهياكل البيانات.',799,'➕','Classes، STL، المؤشرات الذكية، القوائم، الأشجار، الرسوم البيانية والتعقيد.'],
 ['Java من الصفر','languages','تعلم Java وبناء تطبيقات منظمة.',699,'☕','Syntax، OOP، Collections، Exceptions، Generics، Streams والاختبارات.'],
 ['Kotlin وتطبيقات Android','mobile','ابدأ تطوير تطبيقات أندرويد.',799,'📱','Kotlin، Coroutines، Jetpack Compose، التنقل، الشبكات والتخزين.'],
 ['Flutter وتطبيقات الهاتف','mobile','تطبيق واحد يعمل على أكثر من منصة.',899,'🦋','Dart، Widgets، Layout، State Management، APIs، التخزين والنشر.'],
 ['PHP وتطوير الويب','backend','أنشئ مواقع وخدمات خلفية.',599,'🐘','Syntax، Forms، Sessions، PDO، قواعد البيانات، الأمان وبناء API.'],
 ['Laravel عمليًا','backend','إطار PHP لبناء تطبيقات ويب منظمة.',899,'🚀','Routing، Controllers، Eloquent، Migrations، Auth، Validation والاختبارات.'],
 ['TypeScript للمشاريع الكبيرة','web','اكتب JavaScript بأنواع أوضح وأخطاء أقل.',599,'🔷','Types، Interfaces، Generics، Narrowing، Modules وإعداد المشاريع.'],
 ['الأمن السيبراني للمبتدئين','security','مبادئ دفاعية وأخلاقيات حماية الأنظمة.',799,'🛡️','الشبكات، Linux، التهديدات، إدارة كلمات المرور، مختبرات قانونية والدفاع.'],
 ['أساسيات الشبكات و Linux','tools','افهم أنظمة التشغيل والشبكات من البداية.',499,'🐧','الطرفية، الملفات والصلاحيات، IP، DNS، HTTP، SSH وأدوات التشخيص.'],
 ['الذكاء الاصطناعي وتعلم الآلة بـ Python','ai','مدخل عملي إلى البيانات والنماذج.',999,'🤖','NumPy، Pandas، تنظيف البيانات، التدريب، التقييم، الانحياز والأخلاقيات.'],
 ['هندسة البرمجيات والاختبارات','advanced','خطط واختبر وحافظ على مشاريع قابلة للتطوير.',699,'🧪','Clean Code، Design، Unit Tests، Integration، CI/CD والتوثيق.'],
 ['الخوارزميات وحل المشكلات','advanced','طور طريقة تفكيرك في حل المسائل.',699,'🧮','Big O، البحث، الفرز، Recursion، Greedy، Dynamic Programming والرسوم البيانية.']
].map((c,i)=>({id:'c'+(i+1),title:c[0],category:c[1],description:c[2],price:c[3],icon:c[4],overview:c[5],active:true,lessons:[
 {title:'مقدمة قبل أن تبدأ',duration:'8 دقائق',content:`أهلًا بك في كورس ${c[0]}. سنبدأ بهدوء من المفاهيم الأساسية، ثم ننتقل خطوة خطوة إلى التطبيق. لا تحتاج إلى خبرة سابقة؛ اقرأ كل جزء وجرّب المثال بنفسك.`},
 {title:'المصطلحات الأساسية',duration:'15 دقيقة',content:'أي لغة برمجة لها قواعد (Syntax) ومعانٍ (Semantics). اقرأ الكود ببطء، وحدد المدخلات والخطوات والنتيجة. لا تحفظ الكلمات فقط؛ افهم لماذا نستخدمها.'},
 {title:'أول مثال عملي',duration:'20 دقيقة',content:'اكتب مثالًا صغيرًا، شغّله، ثم غيّر قيمة واحدة ولاحظ النتيجة. عند ظهور خطأ اقرأ رسالة الخطأ، وحدد السطر والسبب، ثم أصلحه وأعد التجربة.'},
 {title:'تدريب ومراجعة',duration:'15 دقيقة',content:'اكتب ملخصًا لما تعلمته، ونفّذ تمرينًا صغيرًا دون نسخ الحل. قسّم المشكلة إلى خطوات أصغر، ثم اختبر الحل بحالات مختلفة.'}
]}));
function loadDB(){
 if(fs.existsSync(dbFile)){try{return JSON.parse(fs.readFileSync(dbFile,'utf8'));}catch(e){}}
 const initial={users:[],courses:seedCourses,orders:[],messages:[],settings:{siteName:'KI Code',tagline:'ابدأ من الصفر، واصنع مستقبلك بالكود',orangeCash:process.env.ORANGE_CASH_NUMBER||'01208549411',supportText:'نحن هنا لمساعدتك في رحلتك التعليمية',heroTitle:'البرمجة مش صعبة… ابدأ خطوة بخطوة',heroText:'تعلم من الصفر، طبّق بإيدك، وابنِ مشاريع حقيقية.',announcement:'ابدأ رحلتك البرمجية اليوم',maintenance:false}};
 fs.writeFileSync(dbFile,JSON.stringify(initial,null,2));return initial;
}
let db=loadDB();
function save(){fs.writeFileSync(dbFile,JSON.stringify(db,null,2));}
const safeUser=u=>({id:u.id,name:u.name,phone:u.phone,email:u.email});
function requireUser(req,res,next){if(!req.session.userId)return res.status(401).json({error:'سجل الدخول أولًا'});const u=db.users.find(x=>x.id===req.session.userId);if(!u)return res.status(401).json({error:'الجلسة غير صالحة'});req.user=u;next();}
function requireAdmin(req,res,next){if(!req.session.isAdmin)return res.status(401).json({error:'غير مصرح لك'});next();}
const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,UPLOAD_DIR),filename:(req,file,cb)=>cb(null,crypto.randomBytes(16).toString('hex')+path.extname(file.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>{if(/^image\/(jpeg|png|webp)$/.test(file.mimetype))cb(null,true);else cb(new Error('ارفع صورة JPG أو PNG أو WEBP فقط'));}});

app.get('/api/settings',(req,res)=>{const s={...db.settings};delete s.adminPassword;res.json(s);});
app.get('/api/courses',(req,res)=>res.json(db.courses.filter(c=>c.active).map(({lessons,...c})=>({...c,lessonCount:(lessons||[]).length}))));
app.get('/api/me',(req,res)=>{const u=db.users.find(x=>x.id===req.session.userId);if(!u)return res.json({user:null,orders:[]});res.json({user:safeUser(u),orders:db.orders.filter(o=>o.userId===u.id).map(o=>({...o,proof:undefined,payerPhone:undefined}))});});
app.post('/api/auth/register',async(req,res)=>{try{const {name,phone,email,password}=req.body||{};if(!name||!phone||!password||password.length<8)return res.status(400).json({error:'اكتب الاسم ورقم الهاتف وكلمة مرور من 8 أحرف على الأقل'});if(db.users.some(u=>u.phone===phone|| (email&&u.email===email)))return res.status(409).json({error:'رقم الهاتف أو البريد مستخدم بالفعل'});const u={id:crypto.randomUUID(),name:String(name).slice(0,100),phone:String(phone).slice(0,30),email:String(email||'').slice(0,150),passwordHash:await bcrypt.hash(password,12),createdAt:new Date().toISOString()};db.users.push(u);save();req.session.userId=u.id;res.json({user:safeUser(u)});}catch(e){res.status(500).json({error:'تعذر إنشاء الحساب'});}});
app.post('/api/auth/login',async(req,res)=>{const {phone,password}=req.body||{};const u=db.users.find(x=>x.phone===phone);if(!u||!await bcrypt.compare(password||'',u.passwordHash))return res.status(401).json({error:'بيانات الدخول غير صحيحة'});req.session.regenerate(err=>{if(err)return res.status(500).json({error:'تعذر تسجيل الدخول'});req.session.userId=u.id;res.json({user:safeUser(u)});});});
app.post('/api/auth/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/courses/:id',requireUser,(req,res)=>{const c=db.courses.find(x=>x.id===req.params.id&&x.active);if(!c)return res.status(404).json({error:'الكورس غير موجود'});const unlocked=db.orders.some(o=>o.userId===req.user.id&&o.courseId===c.id&&o.status==='مكتمل');res.json({course:{...c,lessons:unlocked?c.lessons:undefined},unlocked});});
app.post('/api/orders',requireUser,upload.single('proof'),(req,res)=>{const {courseId,payerPhone}=req.body;const c=db.courses.find(x=>x.id===courseId&&x.active);if(!c)return res.status(404).json({error:'الكورس غير متاح'});if(!req.file)return res.status(400).json({error:'صورة إثبات الدفع مطلوبة'});if(!payerPhone||String(payerPhone).trim().length<7)return res.status(400).json({error:'رقم الهاتف الذي تم التحويل منه مطلوب'});const order={id:crypto.randomUUID(),orderNumber:'KC-'+Date.now().toString().slice(-8),userId:req.user.id,userName:req.user.name,userPhone:req.user.phone,courseId:c.id,courseTitle:c.title,amount:c.price,payerPhone:String(payerPhone).slice(0,30),proof:'/uploads/'+req.file.filename,status:'قيد المراجعة',createdAt:new Date().toISOString(),adminNote:''};db.orders.unshift(order);save();res.json({order:{...order,userId:undefined}});});
app.post('/api/support', (req,res)=>{const {name,phone,message}=req.body||{};if(!name||!phone||!message)return res.status(400).json({error:'اكتب الاسم ورقم الهاتف والرسالة'});const m={id:crypto.randomUUID(),name:String(name).slice(0,100),phone:String(phone).slice(0,30),message:String(message).slice(0,2000),reply:'',createdAt:new Date().toISOString()};db.messages.unshift(m);save();res.json({ok:true});});
app.get('/api/support/mine',requireUser,(req,res)=>res.json(db.messages.filter(m=>m.phone===req.user.phone)));
app.get('/api/admin/me',(req,res)=>res.json({isAdmin:!!req.session.isAdmin}));
app.post('/api/admin/login',async(req,res)=>{const username=process.env.ADMIN_USERNAME||'ki code';const hash=process.env.ADMIN_PASSWORD_HASH;if(!hash)return res.status(503).json({error:'إعداد ADMIN_PASSWORD_HASH مطلوب في متغيرات الاستضافة قبل تفعيل لوحة الإدارة'});if(req.body.username!==username||!await bcrypt.compare(req.body.password||'',hash))return res.status(401).json({error:'اسم المستخدم أو كلمة المرور غير صحيحة'});req.session.regenerate(err=>{if(err)return res.status(500).json({error:'تعذر تسجيل الدخول'});req.session.isAdmin=true;res.json({ok:true});});});
app.post('/api/admin/logout',requireAdmin,(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/admin/dashboard',requireAdmin,(req,res)=>res.json({courses:db.courses,orders:db.orders,messages:db.messages,settings:db.settings,users:db.users.map(safeUser)}));
app.put('/api/admin/settings',requireAdmin,(req,res)=>{const allowed=['siteName','tagline','orangeCash','supportText','heroTitle','heroText','announcement','maintenance'];for(const k of allowed)if(req.body[k]!==undefined)db.settings[k]=typeof req.body[k]==='string'?req.body[k].slice(0,1000):!!req.body[k];save();res.json({ok:true,settings:db.settings});});
app.post('/api/admin/courses',requireAdmin,(req,res)=>{const {title,category,description,price,icon,overview}=req.body||{};if(!title||!Number.isFinite(Number(price))||Number(price)<0)return res.status(400).json({error:'اسم الكورس والسعر الصحيح مطلوبان'});const c={id:'c'+crypto.randomUUID(),title:String(title).slice(0,150),category:String(category||'general'),description:String(description||''),price:Number(price),icon:String(icon||'💻'),overview:String(overview||''),active:true,lessons:[]};db.courses.unshift(c);save();res.json(c);});
app.put('/api/admin/courses/:id',requireAdmin,(req,res)=>{const c=db.courses.find(x=>x.id===req.params.id);if(!c)return res.status(404).json({error:'الكورس غير موجود'});for(const k of ['title','category','description','icon','overview'])if(req.body[k]!==undefined)c[k]=String(req.body[k]).slice(0,2000);if(req.body.price!==undefined&&Number.isFinite(Number(req.body.price))&&Number(req.body.price)>=0)c.price=Number(req.body.price);if(req.body.active!==undefined)c.active=!!req.body.active;if(Array.isArray(req.body.lessons))c.lessons=req.body.lessons.map(l=>({title:String(l.title||'درس').slice(0,200),duration:String(l.duration||''),content:String(l.content||'').slice(0,20000)}));save();res.json(c);});
app.delete('/api/admin/courses/:id',requireAdmin,(req,res)=>{db.courses=db.courses.filter(c=>c.id!==req.params.id);save();res.json({ok:true});});
app.patch('/api/admin/orders/:id',requireAdmin,(req,res)=>{const o=db.orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:'الطلب غير موجود'});const allowed=['قيد المراجعة','جاري التنفيذ','مكتمل','مرفوض'];if(!allowed.includes(req.body.status))return res.status(400).json({error:'حالة غير صحيحة'});o.status=req.body.status;if(req.body.adminNote!==undefined)o.adminNote=String(req.body.adminNote).slice(0,1000);save();res.json(o);});
app.patch('/api/admin/messages/:id',requireAdmin,(req,res)=>{const m=db.messages.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({error:'الرسالة غير موجودة'});m.reply=String(req.body.reply||'').slice(0,2000);m.repliedAt=new Date().toISOString();save();res.json(m);});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'KI Code'}));
app.use((err,req,res,next)=>{if(err instanceof multer.MulterError)return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'حجم الصورة يجب ألا يتجاوز 5 ميجابايت':'تعذر رفع الصورة'});if(err)return res.status(400).json({error:err.message||'حدث خطأ'});next();});
app.listen(PORT,'0.0.0.0',()=>console.log(`KI Code running on port ${PORT}`));
