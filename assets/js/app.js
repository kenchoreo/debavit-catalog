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

            // --- ЗАГРУЗКА ОТЗЫВОВ И РЕЙТИНГОВ ---
            const reviewsSection = document.getElementById('reviews-section');
            const marketplacesRating = document.getElementById('marketplaces-rating');
            const allReviewsLinks = document.getElementById('all-reviews-links');
            const reviewsGrid = document.getElementById('reviews-grid');

            if (reviewsSection && marketplacesRating && allReviewsLinks && reviewsGrid) {
                let showReviewsSection = false;

                // Рейтинги и бейджи маркетплейсов
                if (product.kaspi_rating || product.wb_rating) {
                    marketplacesRating.classList.remove('hidden');
                    showReviewsSection = true;

                    // Логика для Kaspi
                    if (product.kaspi_rating && product.kaspi_link) {
                        const kaspiBadge = document.getElementById('kaspi-badge');
                        const kaspiVal = document.getElementById('kaspi-rating-value');
                        if (kaspiBadge && kaspiVal) {
                            kaspiVal.textContent = product.kaspi_rating;
                            kaspiBadge.href = product.kaspi_link;
                            kaspiBadge.classList.remove('hidden');
                            kaspiBadge.classList.add('inline-flex');
                            
                            allReviewsLinks.classList.remove('hidden');
                            allReviewsLinks.innerHTML += `
                                <a href="${product.kaspi_link}" target="_blank" class="border border-[#f14635] text-[#f14635] px-6 py-3 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-[#f14635] hover:text-white transition-all rounded-sm text-center">
                                    Все отзывы на Kaspi
                                </a>
                            `;
                        }
                    }

                    // Логика для Wildberries
                    if (product.wb_rating && product.wb_link) {
                        const wbBadge = document.getElementById('wb-badge');
                        const wbVal = document.getElementById('wb-rating-value');
                        if (wbBadge && wbVal) {
                            wbVal.textContent = product.wb_rating;
                            wbBadge.href = product.wb_link;
                            wbBadge.classList.remove('hidden');
                            wbBadge.classList.add('inline-flex');

                            allReviewsLinks.classList.remove('hidden');
                            allReviewsLinks.innerHTML += `
                                <a href="${product.wb_link}" target="_blank" class="border border-[#cb11ab] text-[#cb11ab] px-6 py-3 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-[#cb11ab] hover:text-white transition-all rounded-sm text-center">
                                    Все отзывы на WB
                                </a>
                            `;
                        }
                    }
                }

                // Карточки с текстами отзывов
                if (product.reviews && product.reviews.length > 0) {
                    showReviewsSection = true;
                    reviewsGrid.innerHTML = ''; 

                    // Ограничиваем до 3 отзывов, чтобы сетка была ровной
                    const reviewsToShow = product.reviews.slice(0, 3);

                    reviewsToShow.forEach(review => {
                        let sourceColor = "bg-gray-100 text-gray-500";
                        if (review.source === "Kaspi") sourceColor = "bg-[#f14635]/10 text-[#f14635]";
                        if (review.source === "Wildberries") sourceColor = "bg-[#cb11ab]/10 text-[#cb11ab]";

                        const reviewCard = document.createElement('div');
                        reviewCard.className = "bg-gray-50 p-6 rounded-sm border border-gray-100 flex flex-col";
                        reviewCard.innerHTML = `
                            <div class="flex justify-between items-start mb-4">
                                <div class="font-bold text-brand-dark">${review.author || 'Гость'}</div>
                                <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${sourceColor}">${review.source || 'Отзыв'}</span>
                            </div>
                            <div class="flex text-[#FFB800] mb-4">
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            </div>
                            <p class="text-sm text-gray-600 font-light leading-relaxed flex-grow italic">"${review.text}"</p>
                        `;
                        reviewsGrid.appendChild(reviewCard);
                    });
                }

                // Открываем секцию, если есть хоть что-то
                if (showReviewsSection) {
                    reviewsSection.classList.remove('hidden');
                }
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
