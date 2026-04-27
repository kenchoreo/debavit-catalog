// Функция для смены главного изображения (вынесена в window, чтобы работать из HTML)
window.changeMainImage = function(url) {
    const mainImg = document.getElementById('main-image');
    if (mainImg) {
        mainImg.src = url;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Скачиваем базу товаров
    let products = [];
    try {
        const response = await fetch('./assets/data/products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.items || [];
        }
    } catch (error) {
        console.log("База товаров пока пуста или не найдена.");
    }

    // Вспомогательная функция для путей картинок
    const getImgPath = (path) => {
        if (!path) return '';
        return path.startsWith('.') ? path : `./${path}`;
    };

    // 2. Логика для страницы КАТАЛОГА
    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<p class="text-gray-500 col-span-full">Товары скоро появятся...</p>';
        } else {
            products.forEach(product => {
                const card = `
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
                grid.innerHTML += card;
            });
        }
    }

    // 3. Логика для страницы ТОВАРА
    const titleEl = document.getElementById('product-title');
    if (titleEl) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.title} — Debavit`;
            const breadcrumb = document.getElementById('breadcrumb-name');
            if(breadcrumb) breadcrumb.textContent = product.title;
            titleEl.textContent = product.title;
            
            // --- ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ---
            const mainImgEl = document.getElementById('main-image');
            if (mainImgEl && product.image) {
                mainImgEl.src = getImgPath(product.image);
                // Делаем главное фото кликабельным (открытие в новой вкладке)
                mainImgEl.style.cursor = 'zoom-in';
                mainImgEl.onclick = () => window.open(mainImgEl.src, '_blank');
            }

            // Создаем блок превью (миниатюр)
            const thumbContainer = document.getElementById('thumbnails-container');
            if (thumbContainer) {
                thumbContainer.innerHTML = '';
                const images = [product.image, product.image2, product.image3].filter(img => img);
                
                if (images.length > 1) {
                    images.forEach(imgUrl => {
                        const fullPath = getImgPath(imgUrl);
                        const thumb = document.createElement('div');
                        thumb.className = "w-20 h-20 border border-gray-200 rounded-sm overflow-hidden cursor-pointer hover:border-black transition-all";
                        thumb.innerHTML = `<img src="${fullPath}" class="w-full h-full object-cover" onclick="changeMainImage('${fullPath}')">`;
                        thumbContainer.appendChild(thumb);
                    });
                }
            }
            
            if(document.getElementById('product-description')) {
                document.getElementById('product-description').innerHTML = product.description.replace(/\n/g, '<br>');
            }
            if(document.getElementById('product-composition')) {
                document.getElementById('product-composition').innerHTML = product.composition.replace(/\n/g, '<br>');
            }

            // --- УМНАЯ ССЫЛКА НА WHATSAPP ---
            const waBtn = document.getElementById('order-btn');
            if (waBtn) {
                const message = `Здравствуйте! Хочу заказать: ${product.title}`;
                waBtn.href = `https://wa.me/77002221780?text=${encodeURIComponent(message)}`;
            }
        } else {
            titleEl.textContent = "Товар не найден";
            const desc = document.getElementById('product-description');
            if(desc) desc.textContent = "Пожалуйста, вернитесь в каталог и выберите товар.";
            const btn = document.getElementById('order-btn');
            if(btn) btn.style.display = 'none';
        }
    }
});

// Логика мобильного меню
const menuOpenBtn = document.getElementById('menu-open');
const menuCloseBtn = document.getElementById('menu-close');
const mobileMenu = document.getElementById('mobile-menu');
const body = document.body;

function toggleMenu() {
    if(!mobileMenu) return;
    mobileMenu.classList.toggle('translate-x-full');
    body.classList.toggle('overflow-hidden');
}

if(menuOpenBtn && menuCloseBtn) {
    menuOpenBtn.addEventListener('click', toggleMenu);
    menuCloseBtn.addEventListener('click', toggleMenu);
}

if(mobileMenu) {
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('translate-x-full');
            body.classList.remove('overflow-hidden');
        });
    });
}

// --- РЕКОМЕНДАЦИИ ---
document.addEventListener("DOMContentLoaded", () => {
    const recGrid = document.getElementById('recommendations-grid');
    if (recGrid) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentId = urlParams.get('id');

        fetch('./assets/data/products.json')
            .then(res => res.json())
            .then(data => {
                const products = data.items || [];
                const otherProducts = products.filter(p => p.id !== currentId);
                const shuffled = otherProducts.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4);

                recGrid.innerHTML = '';
                selected.forEach(item => {
                    const imgPath = item.image ? (item.image.startsWith('.') ? item.image : `./${item.image}`) : '';
                    const card = document.createElement('a');
                    card.href = `product.html?id=${item.id}`;
                    card.className = "group block cursor-pointer flex flex-col h-full bg-white rounded-sm"; 
                    card.innerHTML = `
                        <div class="aspect-[4/5] bg-gray-50 mb-3 overflow-hidden relative rounded-sm">
                            <img src="${imgPath}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                        </div>
                        <h3 class="font-heading text-lg md:text-xl uppercase font-bold text-brand-dark mb-1 group-hover:text-brand-green transition">${item.title}</h3>
                        <span class="text-[10px] font-bold text-brand-green uppercase tracking-widest mt-auto">Смотреть</span>
                    `;
                    recGrid.appendChild(card);
                });
            })
            .catch(err => console.error("Ошибка рекомендаций:", err));
    }
});

// --- ПОПУЛЯРНЫЕ НА ГЛАВНОЙ ---
document.addEventListener("DOMContentLoaded", () => {
    const popularGrid = document.getElementById('popular-products-grid');
    if (popularGrid) {
        fetch('./assets/data/products.json')
            .then(res => res.json())
            .then(data => {
                const products = data.items || [];
                const popularProducts = products.slice(0, 4);
                popularGrid.innerHTML = '';
                popularProducts.forEach(item => {
                    const imgPath = item.image ? (item.image.startsWith('.') ? item.image : `./${item.image}`) : '';
                    const card = document.createElement('a');
                    card.href = `product.html?id=${item.id}`;
                    card.className = "group block cursor-pointer flex flex-col h-full"; 
                    card.innerHTML = `
                        <div class="aspect-[4/5] bg-[#1a2a1d] mb-4 overflow-hidden relative rounded-sm">
                            <img src="${imgPath}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                        </div>
                        <h3 class="text-sm md:text-base font-medium text-brand-dark mb-4 leading-tight min-h-[40px] flex items-center group-hover:text-brand-green transition-colors">
                            ${item.title}
                        </h3>
                        <span class="inline-block w-full md:w-auto border border-black text-black px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest group-hover:bg-black group-hover:text-white transition-all rounded-sm text-center mt-auto">
                            Подробнее
                        </span>
                    `;
                    popularGrid.appendChild(card);
                });
            })
            .catch(err => console.error("Ошибка популярных:", err));
    }
});
