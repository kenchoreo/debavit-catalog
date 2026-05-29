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

// --- Вспомогательная функция для путей ---
const getImgPath = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : (path.startsWith('.') ? path : `./${path}`);
};

// --- ЛОГИКА ЕДИНОГО КАТАЛОГА (ГЛАВНАЯ СТРАНИЦА) ---
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('main-catalog-grid');
    if (!grid) return; // Выполняем только на главной странице

    let allProducts = [];
    let filteredProducts = [];
    let displayedCount = 0;
    const ITEMS_PER_PAGE = 12;

    const searchInput = document.getElementById('catalog-search');
    const sentinel = document.getElementById('catalog-sentinel');
    const loader = document.getElementById('catalog-loader');
    const endMessage = document.getElementById('catalog-end-message');

    // Шаг 1: Загрузка базы
    try {
        const response = await fetch('./assets/data/products.json');
        if (response.ok) {
            const data = await response.json();
            allProducts = data.items || [];
            filteredProducts = [...allProducts];
            
            renderNextBatch();
            initInfiniteScroll();
        } else {
            grid.innerHTML = '<p class="text-gray-500 col-span-full">Не удалось загрузить каталог...</p>';
        }
    } catch (error) {
        console.error("Ошибка инициализации каталога:", error);
    }

    // Шаг 2: Отрисовка
    function renderNextBatch() {
        if (displayedCount >= filteredProducts.length) {
            hideLoader(true);
            return;
        }

        hideLoader(false);

        const nextBatch = filteredProducts.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);
        
        let htmlBuffer = '';
        nextBatch.forEach(product => {
            htmlBuffer += `
                <div class="group cursor-pointer flex flex-col h-full bg-white">
                    <div class="aspect-[4/5] bg-gray-50 mb-4 overflow-hidden relative rounded-sm border border-gray-100">
                        <img src="${getImgPath(product.image)}" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                    </div>
                    <h3 class="text-sm md:text-base font-medium text-brand-dark mb-4 leading-tight min-h-[40px] flex items-center group-hover:text-brand-green transition-colors">
                        ${product.title}
                    </h3>
                    <a href="product.html?id=${product.id}" class="inline-block w-full border border-black text-black px-6 py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm text-center mt-auto">
                        Подробнее
                    </a>
                </div>`;
        });

        grid.innerHTML += htmlBuffer;
        displayedCount += nextBatch.length;

        if (displayedCount >= filteredProducts.length) {
            hideLoader(true);
        }
    }

    // Шаг 3: Лоадер
    function hideLoader(isEnd) {
        if (isEnd) {
            if (loader) loader.classList.add('hidden');
            if (endMessage && filteredProducts.length > 0) endMessage.classList.remove('hidden');
        } else {
            if (loader) loader.classList.remove('hidden');
            if (endMessage) endMessage.classList.add('hidden');
        }
    }

    // Шаг 4: Бесконечный скролл
    function initInfiniteScroll() {
        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && displayedCount < filteredProducts.length) {
                    setTimeout(() => {
                        renderNextBatch();
                    }, 300);
                }
            });
        }, { rootMargin: '100px' });

        observer.observe(sentinel);
    }

    // Шаг 5: Живой поиск
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            filteredProducts = allProducts.filter(product => {
                const titleMatch = (product.title || '').toLowerCase().includes(query);
                const descMatch = (product.description || '').toLowerCase().includes(query);
                return titleMatch || descMatch;
            });

            grid.innerHTML = '';
            displayedCount = 0;

            if (filteredProducts.length === 0) {
                grid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-12 font-light">По вашему запросу ничего не найдено...</p>';
                if (loader) loader.classList.add('hidden');
                if (endMessage) endMessage.classList.add('hidden');
            } else {
                renderNextBatch();
            }
        });
    }
});

// --- СТРАНИЦА ОДНОГО ТОВАРА (product.html) ---
document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('product-title');
    if (!titleEl) return; // Выполняем только на странице товара

    try {
        const response = await fetch('./assets/data/products.json');
        if (response.ok) {
            const data = await response.json();
            const products = data.items || [];
            
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            const product = products.find(p => p.id === productId);

            if (product) {
                document.title = `${product.title} — Debavit`;
                if (document.getElementById('breadcrumb-name')) {
                    document.getElementById('breadcrumb-name').textContent = product.title;
                }
                titleEl.textContent = product.title;
                
                // Инициализация галереи
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

                // Отзывы и рейтинги
                const reviewsSection = document.getElementById('reviews-section');
                const marketplacesRating = document.getElementById('marketplaces-rating');
                const allReviewsLinks = document.getElementById('all-reviews-links');
                const reviewsGrid = document.getElementById('reviews-grid');

                if (reviewsSection && marketplacesRating && allReviewsLinks && reviewsGrid) {
                    let showReviewsSection = false;

                    if (product.kaspi_rating || product.wb_rating) {
                        marketplacesRating.classList.remove('hidden');
                        showReviewsSection = true;

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

                    if (product.reviews && product.reviews.length > 0) {
                        showReviewsSection = true;
                        reviewsGrid.innerHTML = ''; 

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

                    if (showReviewsSection) {
                        reviewsSection.classList.remove('hidden');
                    }
                }
                
                // Секция рекомендаций
                const recGrid = document.getElementById('recommendations-grid');
                if (recGrid) {
                    const otherProducts = products.filter(p => p.id !== productId);
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
            } else {
                titleEl.textContent = "Товар не найден";
            }
            
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.classList.add('loaded');
        }
    } catch (error) {
        console.error("Ошибка загрузки товара:", error);
    }
});

// --- ЛОГИКА НОВОСТЕЙ И АКЦИЙ ---
document.addEventListener('DOMContentLoaded', async () => {
    let newsItems = [];

    try {
        const response = await fetch('./assets/data/news.json');
        if (response.ok) {
            const data = await response.json();
            newsItems = data.items || [];
        }
    } catch (error) {
        console.log("Нет новостей для загрузки.");
    }

    if (newsItems.length === 0) return;

    // 1. Карусель на ГЛАВНОЙ
    const carouselContainer = document.getElementById('promo-carousel');
    const carouselSection = document.getElementById('promo-carousel-section');
    
    if (carouselContainer && carouselSection) {
        const bannerItems = newsItems.filter(item => item.banner_image);
        
        if (bannerItems.length > 0) {
            carouselSection.classList.remove('hidden'); 
            
            bannerItems.forEach(item => {
                const bannerHTML = `
                    <a href="article.html?id=${item.id}" class="block snap-center shrink-0 w-full h-[180px] md:h-[450px] lg:h-[600px] bg-gray-100 overflow-hidden relative">
                        <img src="${getImgPath(item.banner_image)}" alt="${item.title}" class="w-full h-full object-cover">
                    </a>
                `;
                carouselContainer.innerHTML += bannerHTML;
            });

            const nextBtn = document.getElementById('next-slide');
            const prevBtn = document.getElementById('prev-slide');
            let currentSlide = 0;
            const totalSlides = bannerItems.length;
            let slideInterval;

            const goToSlide = (index) => {
                if (index >= totalSlides) index = 0; 
                if (index < 0) index = totalSlides - 1; 
                currentSlide = index;
                
                const slideWidth = carouselContainer.clientWidth;
                carouselContainer.scrollTo({ left: slideWidth * currentSlide, behavior: 'smooth' });
            };

            if (totalSlides > 1) {
                if (nextBtn && prevBtn) {
                    nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); resetInterval(); });
                    prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); resetInterval(); });
                }

                const startInterval = () => { slideInterval = setInterval(() => { goToSlide(currentSlide + 1); }, 5000); };
                const resetInterval = () => { clearInterval(slideInterval); startInterval(); };

                startInterval();

                carouselSection.addEventListener('mouseenter', () => clearInterval(slideInterval));
                carouselSection.addEventListener('mouseleave', startInterval);
                
            } else {
                if(nextBtn) nextBtn.classList.add('hidden');
                if(prevBtn) prevBtn.classList.add('hidden');
            }
        }
    }

    // 2. Страница НОВОСТЕЙ (news.html)
    const newsGrid = document.getElementById('news-grid');
    const promosGrid = document.getElementById('promos-grid');
    
    if (newsGrid || promosGrid) {
        const createCard = (item) => `
            <a href="article.html?id=${item.id}" class="group block bg-gray-50 border border-gray-100 p-4 rounded-sm hover:shadow-lg transition-all">
                <div class="aspect-[16/9] bg-gray-200 mb-4 overflow-hidden rounded-sm">
                    <img src="${getImgPath(item.main_image)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="text-[10px] text-brand-green font-bold uppercase tracking-widest mb-2">${item.type}</div>
                <h3 class="font-heading text-xl uppercase text-brand-dark leading-tight group-hover:text-brand-green transition">${item.title}</h3>
            </a>
        `;

        const news = newsItems.filter(i => i.type === 'Новость');
        const promos = newsItems.filter(i => i.type === 'Акция');

        if (newsGrid) newsGrid.innerHTML = news.length ? news.map(createCard).join('') : '<p class="text-gray-400 text-sm">Новостей пока нет.</p>';
        if (promosGrid) promosGrid.innerHTML = promos.length ? promos.map(createCard).join('') : '<p class="text-gray-400 text-sm">Акций пока нет.</p>';
    }

    // 3. Страница СТАТЬИ (article.html)
    const articleTitle = document.getElementById('article-title');
    if (articleTitle) {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        const article = newsItems.find(a => a.id === articleId);

        if (article) {
            document.title = `${article.title} — Debavit`;
            articleTitle.textContent = article.title;
            document.getElementById('article-badge').textContent = article.type;
            
            if (article.main_image) {
                document.getElementById('article-image').src = getImgPath(article.main_image);
                document.getElementById('article-img-container').classList.remove('hidden');
            }

            document.getElementById('article-content').innerHTML = (article.content || '').replace(/\n/g, '<br>');

            if (article.btn_text && article.btn_link) {
                const btn = document.getElementById('article-btn');
                btn.textContent = article.btn_text;
                btn.href = article.btn_link;
                btn.classList.remove('hidden');
            }
        } else {
            articleTitle.textContent = "Публикация не найдена";
            document.getElementById('article-content').textContent = "Пожалуйста, вернитесь в раздел новостей.";
            document.getElementById('article-badge').classList.add('hidden');
        }
    }
});

// --- МОБИЛЬНОЕ МЕНЮ ---
const menuOpenBtn = document.getElementById('menu-open');
const menuCloseBtn = document.getElementById('menu-close');
const mobileMenu = document.getElementById('mobile-menu');

function toggleMenu() {
    if (!mobileMenu) return;
    
    if (mobileMenu.classList.contains('translate-x-full') || mobileMenu.classList.contains('transition-transform')) {
        mobileMenu.classList.toggle('translate-x-full');
    } else {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
    }
    
    document.body.classList.toggle('overflow-hidden');
}

if (menuOpenBtn) menuOpenBtn.addEventListener('click', toggleMenu);
if (menuCloseBtn) menuCloseBtn.addEventListener('click', toggleMenu);

if (mobileMenu) {
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!mobileMenu.classList.contains('hidden') && !mobileMenu.classList.contains('translate-x-full')) {
                toggleMenu();
            }
        });
    });
}
