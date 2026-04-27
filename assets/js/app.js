// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ГАЛЕРЕИ ---
let currentProductImages = [];
let currentIndex = 0;

// Обновление интерфейса галереи (главное фото, модалка, миниатюры)
window.updateGalleryUI = function() {
    const mainImg = document.getElementById('main-image');
    const modalImg = document.getElementById('modal-img');
    const fullPath = currentProductImages[currentIndex];

    if (mainImg && fullPath) mainImg.src = fullPath;
    if (modalImg && fullPath) modalImg.src = fullPath;

    // Подсветка активной миниатюры
    document.querySelectorAll('.thumb-img-wrapper').forEach((el, idx) => {
        if (idx === currentIndex) {
            el.classList.add('border-black');
            el.classList.remove('border-gray-200');
        } else {
            el.classList.remove('border-black');
            el.classList.add('border-gray-200');
        }
    });
};

// Навигация
window.nextImage = function(e) {
    if (e) e.stopPropagation();
    if (currentProductImages.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentProductImages.length;
    updateGalleryUI();
};

window.prevImage = function(e) {
    if (e) e.stopPropagation();
    if (currentProductImages.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentProductImages.length) % currentProductImages.length;
    updateGalleryUI();
};

// Управление модальным окном
window.openModal = function() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

window.setCurrentImage = function(index) {
    currentIndex = index;
    updateGalleryUI();
};

// Обработка клавиш (Esc, Стрелки)
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('image-modal');
    if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    }
});

// --- ОСНОВНАЯ ЛОГИКА ЗАГРУЗКИ ---
document.addEventListener('DOMContentLoaded', async () => {
    let products = [];
    
    // Вспомогательная функция для путей
    const getImgPath = (path) => {
        if (!path) return '';
        return path.startsWith('.') ? path : `./${path}`;
    };

    try {
        const response = await fetch('./assets/data/products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.items || [];
        }
    } catch (error) {
        console.error("Ошибка загрузки базы товаров.");
    }

    // 1. СТРАНИЦА КАТАЛОГА
    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<p class="text-gray-500 col-span-full">Товары скоро появятся...</p>';
        } else {
            products.forEach(product => {
                grid.innerHTML += `
                <div class="group cursor-pointer">
                    <div class="aspect-[4/5] bg-[#1a2a1d] mb-4 overflow-hidden relative rounded-sm">
                        <img src="${getImgPath(product.image)}" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                    </div>
                    <h3 class="text-sm md:text-base font-medium text-brand-dark mb-4 leading-tight min-h-[40px] flex items-center">
                        ${product.title}
                    </h3>
                    <a href="product.html?id=${product.id}" class="inline-block w-full border border-black text-black px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm text-center">
                        Подробнее
                    </a>
                </div>`;
            });
        }
    }

    // 2. СТРАНИЦА ТОВАРА
    const titleEl = document.getElementById('product-title');
    if (titleEl) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.title} — Debavit`;
            if (document.getElementById('breadcrumb-name')) {
                document.getElementById('breadcrumb-name').textContent = product.title;
            }
            titleEl.textContent = product.title;
            
            // Инициализация массива фото для галереи
            currentProductImages = [product.image, product.image2, product.image3]
                .filter(img => img)
                .map(img => getImgPath(img));
            
            currentIndex = 0;
            updateGalleryUI();

            // Генерация миниатюр
            const thumbContainer = document.getElementById('thumbnails-container');
            if (thumbContainer && currentProductImages.length > 1) {
                thumbContainer.innerHTML = '';
                currentProductImages.forEach((imgUrl, idx) => {
                    const thumb = document.createElement('div');
                    thumb.className = `thumb-img-wrapper w-20 h-20 border-2 border-gray-200 rounded-sm overflow-hidden cursor-pointer transition-all`;
                    thumb.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover" onclick="setCurrentImage(${idx})">`;
                    thumbContainer.appendChild(thumb);
                });
                updateGalleryUI();
            }

            // Текстовые данные
            if(document.getElementById('product-description')) {
                document.getElementById('product-description').innerHTML = (product.description || '').replace(/\n/g, '<br>');
            }
            if(document.getElementById('product-composition')) {
                document.getElementById('product-composition').innerHTML = (product.composition || '').replace(/\n/g, '<br>');
            }

            // WhatsApp
            const waBtn = document.getElementById('order-btn');
            if (waBtn) {
                const message = `Здравствуйте! Хочу заказать: ${product.title}`;
                waBtn.href = `https://wa.me/77002221780?text=${encodeURIComponent(message)}`;
            }
        } else {
            titleEl.textContent = "Товар не найден";
        }
    }

    // 3. РЕКОМЕНДАЦИИ
    const recGrid = document.getElementById('recommendations-grid');
    if (recGrid) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentId = urlParams.get('id');
        const otherProducts = products.filter(p => p.id !== currentId);
        const selected = otherProducts.sort(() => 0.5 - Math.random()).slice(0, 4);

        recGrid.innerHTML = '';
        selected.forEach(item => {
            recGrid.innerHTML += `
                <a href="product.html?id=${item.id}" class="group block cursor-pointer flex flex-col h-full bg-white rounded-sm">
                    <div class="aspect-[4/5] bg-gray-50 mb-3 overflow-hidden relative rounded-sm">
                        <img src="${getImgPath(item.image)}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                    </div>
                    <h3 class="font-heading text-lg md:text-xl uppercase font-bold text-brand-dark mb-1 group-hover:text-brand-green transition">${item.title}</h3>
                    <span class="text-[10px] font-bold text-brand-green uppercase tracking-widest mt-auto">Смотреть</span>
                </a>`;
        });
    }

    // 4. ПОПУЛЯРНЫЕ НА ГЛАВНОЙ
    const popularGrid = document.getElementById('popular-products-grid');
    if (popularGrid) {
        const popularProducts = products.slice(0, 4);
        popularGrid.innerHTML = '';
        popularProducts.forEach(item => {
            popularGrid.innerHTML += `
                <a href="product.html?id=${item.id}" class="group block cursor-pointer flex flex-col h-full">
                    <div class="aspect-[4/5] bg-[#1a2a1d] mb-4 overflow-hidden relative rounded-sm">
                        <img src="${getImgPath(item.image)}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                    </div>
                    <h3 class="text-sm md:text-base font-medium text-brand-dark mb-4 leading-tight min-h-[40px] flex items-center group-hover:text-brand-green transition-colors">
                        ${item.title}
                    </h3>
                    <span class="inline-block w-full md:w-auto border border-black text-black px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest group-hover:bg-black group-hover:text-white transition-all rounded-sm text-center mt-auto">
                        Подробнее
                    </span>
                </a>`;
        });
    }
});

// --- МОБИЛЬНОЕ МЕНЮ ---
const menuOpenBtn = document.getElementById('menu-open');
const menuCloseBtn = document.getElementById('menu-close');
const mobileMenu = document.getElementById('mobile-menu');

function toggleMenu() {
    if(!mobileMenu) return;
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
    document.body.classList.toggle('overflow-hidden');
}

if(menuOpenBtn && menuCloseBtn) {
    menuOpenBtn.addEventListener('click', toggleMenu);
    menuCloseBtn.addEventListener('click', toggleMenu);
}
