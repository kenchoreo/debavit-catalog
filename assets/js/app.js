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
            waBtn.href = `https://wa.me/77777777777?text=${encodeURIComponent(message)}`;
        } else {
            titleEl.textContent = "Товар не найден";
            document.getElementById('product-description').textContent = "Пожалуйста, вернитесь в каталог и выберите товар.";
            document.getElementById('order-btn').style.display = 'none';
        }
    }
});