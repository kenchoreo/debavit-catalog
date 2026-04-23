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

    // 2. Логика для страницы КАТАЛОГА
    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = ''; // Очищаем HTML-заглушки
        
        if (products.length === 0) {
            grid.innerHTML = '<p class="text-gray-500 col-span-full">Товары скоро появятся...</p>';
        } else {
            products.forEach(product => {
                // Создаем карточку товара
                const card = `
                <div class="group cursor-pointer">
                    <div class="aspect-[4/5] bg-[#1a2a1d] mb-4 overflow-hidden relative rounded-sm">
                        <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
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
        const productId = urlParams.get('id'); // Получаем ID из адресной строки
        const product = products.find(p => p.id === productId);

        if (product) {
            // Подставляем данные
            document.title = `${product.title} — Debavit`;
            document.getElementById('breadcrumb-name').textContent = product.title;
            titleEl.textContent = product.title;
            
            // Если фото загружено, вставляем его
            if(product.image) {
                document.getElementById('main-image').src = product.image;
            }
            
            // Заменяем переносы строк на теги <br> для красивого отображения
            if(document.getElementById('product-description')) {
                document.getElementById('product-description').innerHTML = product.description.replace(/\n/g, '<br>');
            }
            if(document.getElementById('product-composition')) {
                document.getElementById('product-composition').innerHTML = product.composition.replace(/\n/g, '<br>');
            }

            // Умная ссылка на WhatsApp
            const waBtn = document.getElementById('order-btn');
            const message = `Здравствуйте! Меня интересует товар: ${product.title}. Подскажите по наличию и доставке?`;
            waBtn.href = `https://wa.me/77002221780?text=${encodeURIComponent(message)}`;
        } else {
            titleEl.textContent = "Товар не найден";
            document.getElementById('product-description').textContent = "Пожалуйста, вернитесь в каталог и выберите товар.";
            document.getElementById('order-btn').style.display = 'none';
        }
    }
});

// Логика мобильного меню
const menuOpenBtn = document.getElementById('menu-open');
const menuCloseBtn = document.getElementById('menu-close');
const mobileMenu = document.getElementById('mobile-menu');
const body = document.body;

function toggleMenu() {
    mobileMenu.classList.toggle('translate-x-full');
    // Блокируем скролл страницы при открытом меню
    body.classList.toggle('overflow-hidden');
}

if(menuOpenBtn && menuCloseBtn) {
    menuOpenBtn.addEventListener('click', toggleMenu);
    menuCloseBtn.addEventListener('click', toggleMenu);
}

// Закрываем меню при клике на ссылку (важно для одностраничных переходов)
const menuLinks = mobileMenu.querySelectorAll('a');
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        body.classList.remove('overflow-hidden');
    });
});

// --- Функция для рекомендаций (добавить в конец app.js) ---
document.addEventListener("DOMContentLoaded", () => {
    const isProductPage = document.getElementById('recommendations-grid');
    if (isProductPage) {
        // Подхватываем текущий ID товара из ссылки
        const urlParams = new URLSearchParams(window.location.search);
        const currentId = urlParams.get('id');

        fetch('./assets/data/products.json')
            .then(res => res.json())
            .then(data => {
                const products = data.items || [];
                const grid = document.getElementById('recommendations-grid');
                
                // Исключаем текущий товар и перемешиваем остальные
                const otherProducts = products.filter(p => p.id !== currentId);
                const shuffled = otherProducts.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4); // Берем 4 штуки

                grid.innerHTML = ''; // Очищаем контейнер

                // Рендерим карточки (вся карточка - это тег <a>)
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
                    grid.appendChild(card);
                });
            })
            .catch(err => console.error("Ошибка загрузки рекомендаций:", err));
    }
});

// --- ЛОГИКА ДЛЯ ГЛАВНОЙ СТРАНИЦЫ (index.html) ---
document.addEventListener("DOMContentLoaded", () => {
    // Проверяем, находимся ли мы на главной странице
    const popularGrid = document.getElementById('popular-products-grid');
    
    if (popularGrid) {
        fetch('./assets/data/products.json')
            .then(res => res.json())
            .then(data => {
                const products = data.items || [];
                
                // Берем первые 4 товара для блока "Популярные"
                const popularProducts = products.slice(0, 4);

                popularGrid.innerHTML = ''; // Очищаем контейнер

                popularProducts.forEach(item => {
                    // Подготавливаем правильный путь к картинке
                    const imgPath = item.image ? (item.image.startsWith('.') ? item.image : `./${item.image}`) : '';
                    
                    // Создаем кликабельную карточку-ссылку
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
            .catch(err => console.error("Ошибка загрузки популярных товаров:", err));
    }
});
