// ==========================================
// 🛒 إدارة سلة التسوق والمنتجات (app.js)
// ==========================================

// مصفوفة السلة المحلية
let cart = [];

// 1. تحميل المنتجات حياً من قاعدة البيانات Firebase
function loadClientProducts() {
    let container = document.getElementById('products_container');
    if (!container) return;

    db.collection("products").onSnapshot((snapshot) => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#666;">لا توجد منتجات متاحة حالياً في المتجر.</p>';
            return;
        }

        snapshot.forEach(doc => {
            let p = doc.data();
            let isOutOfStock = p.quantity <= 0;

            container.innerHTML += `
                <div class="box" style="width: 200px; margin: 10px; text-align: center; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 5px 0;">${p.name}</h4>
                    <p style="color: #28a745; font-weight: bold; margin: 5px 0;">السعر: ${p.price} ج.م</p>
                    <p style="font-size: 12px; color: #666;">المتاح: ${p.quantity} قطعة</p>
                    <button 
                        onclick="addToCart('${p.name}', ${p.price}, ${p.quantity})" 
                        style="background: ${isOutOfStock ? '#ccc' : '#28a745'}; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'};"
                        ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'نفد من المخزن' : '🛒 أضف للسلة'}
                    </button>
                </div>
            `;
        });
    });
}

// 2. إضافة منتج للسلة
function addToCart(pName, pPrice, maxQty) {
    let existingItem = cart.find(item => item.name === pName);
    
    if (existingItem) {
        if (existingItem.qty >= maxQty) {
            alert("عفواً، لقد وصلت للحد الأقصى للكمية المتاحة في المخزن لهذا المنتج!");
            return;
        }
        existingItem.qty += 1;
    } else {
        cart.push({ name: pName, price: Number(pPrice), qty: 1, maxStock: maxQty });
    }

    updateCartUI();
    alert(`تمت إضافة "${pName}" إلى السلة 🛒`);
}

// 3. تغيير الكمية (+ أو -)
function changeQty(pName, delta) {
    let item = cart.find(i => i.name === pName);
    if (item) {
        if (delta > 0 && item.qty >= item.maxStock) {
            alert("لا يمكن إضافة المزيد، هذه أقصى كمية متاحة!");
            return;
        }
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.name !== pName); // حذف الصنف عند وصول الكمية للصفر
        }
    }
    updateCartUI();
}

// 4. تحديث واجهة السلة وإجمالي الحساب
function updateCartUI() {
    // تحديث شارة العداد فوق زر السلة العائم
    let totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    let countBadge = document.getElementById('cart-count');
    if (countBadge) countBadge.innerText = totalCount;

    let container = document.getElementById('cart-items-list');
    let grandTotalEl = document.getElementById('cart-grand-total');
    if (!container) return;

    container.innerHTML = '';
    let grandTotal = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding: 15px 0;">عربة التسوق فارغة حالياً</p>';
    } else {
        cart.forEach(item => {
            let itemTotal = item.price * item.qty;
            grandTotal += itemTotal;

            container.innerHTML += `
                <div class="cart-item-row">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color:#666;">سعر القطعة: ${item.price} ج.م</small>
                    </div>
                    <div>
                        <button class="qty-btn" onclick="changeQty('${item.name}', -1)">-</button>
                        <span style="margin: 0 8px; font-weight:bold;">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
                    </div>
                    <div>
                        <strong style="color: #28a745;">${itemTotal} ج.م</strong>
                    </div>
                </div>
            `;
        });
    }

    if (grandTotalEl) grandTotalEl.innerText = grandTotal + ' ج.م';
}

// 5. فتح / إغلاق نافذة السلة (مع تعبئة البيانات تلقائياً للمستخدم)
function toggleCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) return;

    let isOpening = modal.style.display !== 'block';
    modal.style.display = isOpening ? 'block' : 'none';

    // لو المستخدم مسجل دخوله مسبقاً، املأ بيانات التوصيل أوتوماتيكياً
    if (isOpening && typeof currentUser !== 'undefined' && currentUser) {
        if (currentUser.name && !document.getElementById('cust_name').value) {
            document.getElementById('cust_name').value = currentUser.name;
        }
        if (currentUser.phone && !document.getElementById('cust_phone').value) {
            document.getElementById('cust_phone').value = currentUser.phone;
        }
        if (currentUser.address && !document.getElementById('cust_address').value) {
            document.getElementById('cust_address').value = currentUser.address;
        }
    }
}

// 6. تأكيد الطلب وإرساله لـ Firebase
async function submitOrder() {
    if (cart.length === 0) return alert("سلة التسوق فارغة!");

    let name = document.getElementById('cust_name').value.trim();
    let phone = document.getElementById('cust_phone').value.trim();
    let address = document.getElementById('cust_address').value.trim();

    if (!name || !phone || !address) {
        return alert("يرجى ملء جميع بيانات التوصيل (الاسم، الهاتف، والعنوان)!");
    }

    let grandTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    let orderData = {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty, total: i.price * i.qty })),
        totalAmount: grandTotal,
        createdAt: new Date().toLocaleString('ar-EG'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // حفظ الطلب في مجموعة orders داخل Firebase
        await db.collection("orders").add(orderData);

        // عرض الفاتورة الإلكترونية
        showInvoice(orderData);

        // تفريغ السلة وتصفير المدخلات
        cart = [];
        updateCartUI();

    } catch (e) {
        alert("حدث خطأ أثناء إرسال الطلب: " + e.message);
    }
}

// 7. عرض الفاتورة الإلكترونية
function showInvoice(order) {
    document.getElementById('invoice-cust-name').innerText = order.customerName;
    document.getElementById('invoice-cust-phone').innerText = order.customerPhone;
    document.getElementById('invoice-cust-address').innerText = order.customerAddress;
    document.getElementById('invoice-date').innerText = order.createdAt;

    let itemsContainer = document.getElementById('invoice-items-list');
    itemsContainer.innerHTML = '';

    // حساب الأصناف بالشكل المطلوب: صنف * العدد = الإجمالي
    order.items.forEach(item => {
        itemsContainer.innerHTML += `
            <div class="invoice-item-line">
                <span>• ${item.name} (${item.price} ج.م × ${item.qty})</span>
                <strong>= ${item.total} ج.م</strong>
            </div>
        `;
    });

    document.getElementById('invoice-total').innerText = order.totalAmount + ' ج.م';

    // إغلاق نافذة السلة وفتح الفاتورة
    document.getElementById('cart-modal').style.display = 'none';
    document.getElementById('invoice-modal').style.display = 'block';
}

// 8. إغلاق الفاتورة
function closeInvoiceModal() {
    document.getElementById('invoice-modal').style.display = 'none';
}

// تشغيل جلب المنتجات فور فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
    loadClientProducts();
});
// ==========================================
// 📜 عرض سجل طلبات العميل
// ==========================================

// 7. تأكيد الطلب وإرساله لـ Firebase (نسخة تشخيصية دقيقة)
async function submitOrder() {
    console.log("🛒 بدء عملية إرسال الطلب...");

    // 1. التاكد من ان السلة بها منتجات
    if (!cart || cart.length === 0) {
        alert("⚠️ تنبيه: سلة التسوق فارغة! أضف منتجات أولاً قبل الإرسال.");
        return;
    }

    // 2. قراءة عناصر المدخلات من الصفحة
    let nameInput = document.getElementById('cust_name');
    let phoneInput = document.getElementById('cust_phone');
    let addressInput = document.getElementById('cust_address');

    if (!nameInput || !phoneInput || !addressInput) {
        alert("❌ خطأ برمجي: لم يتم العثور على خانات بيانات التوصيل في صفحة HTML!");
        return;
    }

    let name = nameInput.value.trim();
    let phone = phoneInput.value.trim();
    let address = addressInput.value.trim();

    // 3. التحقق من ملء البيانات
    if (!name) {
        alert("⚠️ يرجى كتابة (الاسم بالكامل) في السلة!");
        nameInput.focus();
        return;
    }
    if (!phone) {
        alert("⚠️ يرجى كتابة (رقم الهاتف) في السلة!");
        phoneInput.focus();
        return;
    }
    if (!address) {
        alert("⚠️ يرجى كتابة (العنوان بالتفصيل) في السلة!");
        addressInput.focus();
        return;
    }

    // 4. تجهيز بيانات الطلب
    let grandTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    let orderData = {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        items: cart.map(i => ({ name: i.name, price: Number(i.price), qty: Number(i.qty), total: Number(i.price * i.qty) })),
        totalAmount: grandTotal,
        createdAt: new Date().toLocaleString('ar-EG'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // 5. حفظ الطلب في Firebase
        let docRef = await db.collection("orders").add(orderData);
        alert("✅ تم إرسال طلبك بنجاح للأنظمة!");

        // 6. عرض الفاتورة وتفريغ السلة
        showInvoice(orderData);
        cart = [];
        updateCartUI();

    } catch (e) {
        console.error("خطأ أثناء الإرسال:", e);
        alert("❌ حدث خطأ من السيرفر أثناء حفظ الطلب: " + e.message);
    }
}

function closeMyOrders() {
    document.getElementById('orders-modal').style.display = 'none';
}