// إعدادات مشروعك الخاصة بـ Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC3CH3NkVc34auhVnLeZTVFVlaiMpphhPY",
    authDomain: "my-store-94782.firebaseapp.com",
    projectId: "my-store-94782",
    storageBucket: "my-store-94782.firebasestorage.app",
    messagingSenderId: "676676616216",
    appId: "1:676676616216:web:f6a8941249bc910772436d",
    measurementId: "G-BW011482T9"
};

// تشغيل التهيئة لمرة واحدة فقط
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// تعريف متغير قاعدة البيانات بشكل عام ليقرأه الجميع
const db = firebase.firestore();

console.log("تم الاتصال بسيرفر Firebase بنجاح! 🚀");
// ==========================================
// 🔐 إدارة الهوية والشاشات (auth.js)
// ==========================================

// المتغير الخاص بالمستخدم الحالي
let currentUser = null;

// 1. دالة التنقل بين الشاشات (حل خطأ showScreen)
function showScreen(screenId) {
    // إخفاء جميع كروت الشاشات أولاً
    const screens = ['main_auth_box', 'login_box', 'register_box', 'forgot_box'];
    screens.forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // إظهار الشاشة المطلوبة فقط
    let target = document.getElementById(screenId);
    if (target) {
        target.style.display = 'block';
    }
}

// 2. الدخول كزائر (حل خطأ enterAsGuest)
function enterAsGuest() {
    currentUser = {
        name: "زائر",
        phone: "",
        address: ""
    };

    // إخفاء شاشات تسجيل الدخول
    showScreen(''); 
    
    // إظهار قسم المتجر ورابط الترحيب
    document.getElementById('main_auth_box').style.display = 'none';
    document.getElementById('store_section').style.display = 'block';
    document.getElementById('user_bar').style.display = 'flex';
    document.getElementById('client_welcome_name').innerText = currentUser.name;
}

// 3. تسجيل حساب جديد
async function registerProcess() {
    let name = document.getElementById('reg_name').value.trim();
    let phone = document.getElementById('reg_phone').value.trim();
    let password = document.getElementById('reg_password').value.trim();
    let city = document.getElementById('reg_city').value.trim();
    let area = document.getElementById('reg_area').value.trim();
    let address = document.getElementById('reg_address').value.trim();
    let question = document.getElementById('reg_question').value;
    let answer = document.getElementById('reg_answer').value.trim().toLowerCase();

    if (!name || !phone || !password || !address || !answer) {
        return alert("يرجى ملء كافة البيانات المطلوبة!");
    }

    try {
        let fullAddress = `${city} - ${area} - ${address}`;
        let userData = {
            name: name,
            phone: phone,
            password: password,
            address: fullAddress,
            question: question,
            answer: answer,
            createdAt: new Date().toLocaleString('ar-EG')
        };

        // حفظ بيانات المستخدم في Firestore بـ ID هو رقم الهاتف
        await db.collection("users").doc(phone).set(userData);
        alert("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
        showScreen('login_box');
    } catch (e) {
        alert("حدث خطأ أثناء إنشاء الحساب: " + e.message);
    }
}

// 4. عملية تسجيل الدخول
async function loginProcess() {
    let phone = document.getElementById('login_phone').value.trim();
    let password = document.getElementById('login_password').value.trim();

    if (!phone || !password) return alert("يرجى إدخال رقم الهاتف وكلمة المرور!");

    try {
        let userDoc = await db.collection("users").doc(phone).get();
        if (!userDoc.exists) {
            return alert("رقم الهاتف غير مسجل!");
        }

        let userData = userDoc.data();
        if (userData.password !== password) {
            return alert("كلمة المرور غير صحيحة!");
        }

        // نجاح تسجيل الدخول
        currentUser = userData;
        document.getElementById('main_auth_box').style.display = 'none';
        document.getElementById('login_box').style.display = 'none';
        document.getElementById('store_section').style.display = 'block';
        document.getElementById('user_bar').style.display = 'flex';
        document.getElementById('client_welcome_name').innerText = currentUser.name;

    } catch (e) {
        alert("حدث خطأ أثناء تسجيل الدخول: " + e.message);
    }
}

// 5. البحث عن حساب لاسترجاع كلمة المرور
async function checkForgotPhone() {
    let phone = document.getElementById('forgot_phone').value.trim();
    if (!phone) return alert("أدخل رقم الهاتف للبحث!");

    try {
        let userDoc = await db.collection("users").doc(phone).get();
        if (!userDoc.exists) {
            return alert("هذا الرقم غير مسجل لدينا!");
        }

        let userData = userDoc.data();
        document.getElementById('forgot_question_text').innerText = userData.question;
        document.getElementById('forgot_step2').style.display = 'block';
    } catch (e) {
        alert("خطأ أثناء البحث: " + e.message);
    }
}

// 6. إعادة تعيين كلمة المرور
async function resetPasswordProcess() {
    let phone = document.getElementById('forgot_phone').value.trim();
    let answer = document.getElementById('forgot_answer').value.trim().toLowerCase();
    let newPassword = document.getElementById('forgot_new_password').value.trim();

    if (!answer || !newPassword) return alert("أدخل إجابة السؤال وكلمة المرور الجديدة!");

    try {
        let userDoc = await db.collection("users").doc(phone).get();
        let userData = userDoc.data();

        if (userData.answer !== answer) {
            return alert("إجابة السؤال السري غير صحيحة!");
        }

        await db.collection("users").doc(phone).update({ password: newPassword });
        alert("تم تغيير كلمة المرور بنجاح! سجل دخولك الآن.");
        showScreen('login_box');
    } catch (e) {
        alert("خطأ أثناء استرجاع الحساب: " + e.message);
    }
}

// 7. تسجيل الخروج
function logout() {
    currentUser = null;
    document.getElementById('store_section').style.display = 'none';
    document.getElementById('user_bar').style.display = 'none';
    showScreen('main_auth_box');
}