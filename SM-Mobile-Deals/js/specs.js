/* ==========================================================================
   SECOND-HAND SPECS — real technical specifications per model.

   WHY THIS EXISTS
   Second-hand listings were generated in bulk, so every one of the 500 units
   carried only the same three generic lines:

       ["Second Hand", "Inspected 32-point check", "Original Apple unit"]

   That tells a buyer nothing about the actual device — no storage, RAM,
   display, processor or camera. A customer comparing two used iPhones had
   no way to tell them apart beyond the price. This module supplies the real
   spec sheet for each model so the second-hand listings carry the same level
   of detail as the new ones.

   HOW IT WORKS
   Lookup is by "Brand|Model" against the exact names used in the catalog.
   If a model isn't listed (a new one gets added later), the resolver falls
   back to a brand/keyword-based guess rather than showing nothing, and the
   condition lines are always appended on top of the technical specs.

   Figures are the common Indian retail configuration for each model. Where
   a model shipped in several storage tiers, the most widely sold variant is
   listed — the exact unit's storage is confirmed in-store before purchase.
   ========================================================================== */

const SecondHandSpecs = (() => {

  /* ---------------- phones: [storage, RAM, display, chip, camera] --------- */
  const PHONES = {
    'Apple|iPhone 11':            ['64GB', '4GB RAM', '6.1" Liquid Retina', 'A13 Bionic', '12MP Dual'],
    'Apple|iPhone 12':            ['64GB', '4GB RAM', '6.1" Super Retina XDR', 'A14 Bionic', '12MP Dual'],
    'Apple|iPhone 12 Mini':       ['64GB', '4GB RAM', '5.4" Super Retina XDR', 'A14 Bionic', '12MP Dual'],
    'Apple|iPhone 12 Pro':        ['128GB', '6GB RAM', '6.1" Super Retina XDR', 'A14 Bionic', '12MP Triple'],
    'Apple|iPhone 12 Pro Max':    ['128GB', '6GB RAM', '6.7" Super Retina XDR', 'A14 Bionic', '12MP Triple'],
    'Apple|iPhone 13':            ['128GB', '4GB RAM', '6.1" Super Retina XDR', 'A15 Bionic', '12MP Dual'],
    'Apple|iPhone 13 Pro':        ['128GB', '6GB RAM', '6.1" ProMotion XDR', 'A15 Bionic', '12MP Triple'],
    'Apple|iPhone 13 Pro Max':    ['256GB', '6GB RAM', '6.7" ProMotion XDR', 'A15 Bionic', '12MP Triple'],
    'Apple|iPhone 14':            ['128GB', '6GB RAM', '6.1" Super Retina XDR', 'A15 Bionic', '12MP Dual'],
    'Apple|iPhone 14 Pro':        ['256GB', '6GB RAM', '6.1" ProMotion XDR', 'A16 Bionic', '48MP Triple'],
    'Apple|iPhone 14 Pro Max':    ['256GB', '6GB RAM', '6.7" ProMotion XDR', 'A16 Bionic', '48MP Triple'],
    'Apple|iPhone 15':            ['128GB', '6GB RAM', '6.1" Super Retina XDR', 'A16 Bionic', '48MP Dual'],
    'Apple|iPhone 15 Pro':        ['256GB', '8GB RAM', '6.1" ProMotion XDR', 'A17 Pro', '48MP Triple'],
    'Apple|iPhone 16':            ['128GB', '8GB RAM', '6.1" Super Retina XDR', 'A18', '48MP Dual'],
    'Apple|iPhone SE (2022)':     ['64GB', '4GB RAM', '4.7" Retina HD', 'A15 Bionic', '12MP Single'],
    'Apple|iPhone XR':            ['64GB', '3GB RAM', '6.1" Liquid Retina', 'A12 Bionic', '12MP Single'],

    'Samsung|Galaxy S20':          ['128GB', '8GB RAM', '6.2" Dynamic AMOLED', 'Exynos 990', '64MP Triple'],
    'Samsung|Galaxy S20 FE':       ['128GB', '8GB RAM', '6.5" Super AMOLED', 'Snapdragon 865', '12MP Triple'],
    'Samsung|Galaxy S21':          ['128GB', '8GB RAM', '6.2" Dynamic AMOLED 2X', 'Exynos 2100', '64MP Triple'],
    'Samsung|Galaxy S21 Ultra':    ['256GB', '12GB RAM', '6.8" Dynamic AMOLED 2X', 'Exynos 2100', '108MP Quad'],
    'Samsung|Galaxy S22':          ['128GB', '8GB RAM', '6.1" Dynamic AMOLED 2X', 'Snapdragon 8 Gen 1', '50MP Triple'],
    'Samsung|Galaxy S22 Ultra':    ['256GB', '12GB RAM', '6.8" Dynamic AMOLED 2X', 'Snapdragon 8 Gen 1', '108MP Quad'],
    'Samsung|Galaxy S23':          ['128GB', '8GB RAM', '6.1" Dynamic AMOLED 2X', 'Snapdragon 8 Gen 2', '50MP Triple'],
    'Samsung|Galaxy S23 Ultra':    ['256GB', '12GB RAM', '6.8" Dynamic AMOLED 2X', 'Snapdragon 8 Gen 2', '200MP Quad'],
    'Samsung|Galaxy S24':          ['256GB', '8GB RAM', '6.2" Dynamic AMOLED 2X', 'Exynos 2400', '50MP Triple'],
    'Samsung|Galaxy S24 Ultra':    ['256GB', '12GB RAM', '6.8" Dynamic AMOLED 2X', 'Snapdragon 8 Gen 3', '200MP Quad'],
    'Samsung|Galaxy Note 20 Ultra':['256GB', '12GB RAM', '6.9" Dynamic AMOLED 2X', 'Exynos 990', '108MP Triple'],
    'Samsung|Galaxy A54':          ['128GB', '8GB RAM', '6.4" Super AMOLED', 'Exynos 1380', '50MP Triple'],
    'Samsung|Galaxy Z Flip 5':     ['256GB', '8GB RAM', '6.7" Foldable AMOLED', 'Snapdragon 8 Gen 2', '12MP Dual'],
    'Samsung|Galaxy Z Fold 5':     ['256GB', '12GB RAM', '7.6" Foldable AMOLED', 'Snapdragon 8 Gen 2', '50MP Triple'],

    'OnePlus|8 Pro':               ['128GB', '8GB RAM', '6.78" Fluid AMOLED', 'Snapdragon 865', '48MP Quad'],
    'OnePlus|8T':                  ['128GB', '8GB RAM', '6.55" Fluid AMOLED', 'Snapdragon 865', '48MP Quad'],
    'OnePlus|9RT':                 ['128GB', '8GB RAM', '6.62" Fluid AMOLED', 'Snapdragon 888', '50MP Triple'],
    'OnePlus|Nord 2':              ['128GB', '8GB RAM', '6.43" Fluid AMOLED', 'Dimensity 1200-AI', '50MP Triple'],

    'Xiaomi|10T':                  ['128GB', '8GB RAM', '6.67" LCD 144Hz', 'Snapdragon 865', '64MP Triple'],
    'Xiaomi|11 Lite':              ['128GB', '6GB RAM', '6.55" AMOLED', 'Snapdragon 732G', '64MP Triple'],
    'Xiaomi|11X':                  ['128GB', '6GB RAM', '6.67" AMOLED', 'Snapdragon 870', '48MP Triple'],
    'Xiaomi|12':                   ['256GB', '8GB RAM', '6.28" AMOLED', 'Snapdragon 8 Gen 1', '50MP Triple'],
    'Xiaomi|13 Pro':               ['256GB', '12GB RAM', '6.73" LTPO AMOLED', 'Snapdragon 8 Gen 2', '50MP Triple'],
    'Xiaomi|Mi 11X':               ['128GB', '6GB RAM', '6.67" AMOLED', 'Snapdragon 870', '48MP Triple'],
    'Xiaomi|Poco X5':              ['128GB', '6GB RAM', '6.67" AMOLED', 'Snapdragon 695', '48MP Triple'],

    'Redmi|10':                    ['64GB', '4GB RAM', '6.5" LCD 90Hz', 'Helio G88', '50MP Quad'],
    'Redmi|12':                    ['128GB', '6GB RAM', '6.79" LCD 90Hz', 'Helio G88', '50MP Dual'],
    'Redmi|K50i':                  ['128GB', '6GB RAM', '6.6" LCD 144Hz', 'Dimensity 8100', '64MP Triple'],
    'Redmi|Note 11':               ['128GB', '6GB RAM', '6.43" AMOLED', 'Snapdragon 680', '50MP Quad'],
    'Redmi|Note 11 Pro':           ['128GB', '6GB RAM', '6.67" AMOLED', 'Helio G96', '108MP Quad'],
    'Redmi|Note 12':               ['128GB', '6GB RAM', '6.67" AMOLED', 'Snapdragon 4 Gen 1', '48MP Triple'],
    'Redmi|Note 13 Pro':           ['256GB', '8GB RAM', '6.67" AMOLED 120Hz', 'Snapdragon 7s Gen 2', '200MP Triple'],

    'Poco|F3':                     ['128GB', '6GB RAM', '6.67" AMOLED 120Hz', 'Snapdragon 870', '48MP Triple'],
    'Poco|M2 Pro':                 ['64GB', '4GB RAM', '6.67" LCD', 'Snapdragon 720G', '48MP Quad'],
    'Poco|X3':                     ['128GB', '6GB RAM', '6.67" LCD 120Hz', 'Snapdragon 732G', '64MP Quad'],

    'Vivo|T2':                     ['128GB', '8GB RAM', '6.38" AMOLED', 'Snapdragon 695', '64MP Dual'],
    'Vivo|V21':                    ['128GB', '8GB RAM', '6.44" AMOLED', 'Dimensity 800U', '64MP Triple'],
    'Vivo|V23':                    ['128GB', '8GB RAM', '6.44" AMOLED', 'Dimensity 920', '64MP Triple'],
    'Vivo|V27':                    ['128GB', '8GB RAM', '6.78" AMOLED', 'Dimensity 7200', '50MP Triple'],
    'Vivo|V29':                    ['256GB', '8GB RAM', '6.78" AMOLED', 'Snapdragon 778G', '50MP Triple'],
    'Vivo|X70 Pro':                ['256GB', '8GB RAM', '6.56" AMOLED', 'Dimensity 1200', '50MP Quad'],
    'Vivo|X90':                    ['256GB', '8GB RAM', '6.78" AMOLED', 'Dimensity 9200', '50MP Triple'],
    'Vivo|Y100':                   ['128GB', '8GB RAM', '6.38" AMOLED', 'Snapdragon 695', '64MP Dual'],
    'Vivo|Y56':                    ['128GB', '8GB RAM', '6.56" LCD', 'Dimensity 700', '50MP Dual'],
    'Vivo|Y75':                    ['128GB', '8GB RAM', '6.58" AMOLED', 'Helio G96', '50MP Triple'],

    'Oppo|A78':                    ['128GB', '8GB RAM', '6.43" AMOLED', 'Snapdragon 680', '50MP Dual'],
    'Oppo|A96':                    ['128GB', '8GB RAM', '6.59" LCD 90Hz', 'Snapdragon 680', '50MP Dual'],
    'Oppo|F19 Pro':                ['128GB', '8GB RAM', '6.43" AMOLED', 'Helio P95', '48MP Quad'],
    'Oppo|F23':                    ['128GB', '8GB RAM', '6.72" LCD 120Hz', 'Snapdragon 695', '64MP Triple'],
    'Oppo|Find X6':                ['256GB', '12GB RAM', '6.74" AMOLED', 'Dimensity 9200', '50MP Triple'],
    'Oppo|Reno 6':                 ['128GB', '8GB RAM', '6.43" AMOLED', 'Dimensity 900', '64MP Triple'],
    'Oppo|Reno 7 Pro':             ['256GB', '12GB RAM', '6.55" AMOLED', 'Dimensity 1200', '50MP Triple'],
    'Oppo|Reno 8':                 ['128GB', '8GB RAM', '6.43" AMOLED', 'Dimensity 1300', '50MP Triple'],
    'Oppo|Reno 10':                ['256GB', '8GB RAM', '6.7" AMOLED', 'Snapdragon 778G', '64MP Triple'],

    'Realme|8 Pro':                ['128GB', '8GB RAM', '6.4" AMOLED', 'Snapdragon 720G', '108MP Quad'],
    'Realme|9':                    ['128GB', '8GB RAM', '6.4" AMOLED', 'Snapdragon 680', '108MP Triple'],
    'Realme|10':                   ['128GB', '8GB RAM', '6.4" AMOLED', 'Helio G99', '50MP Dual'],
    'Realme|11 Pro':               ['128GB', '8GB RAM', '6.7" Curved AMOLED', 'Dimensity 7050', '100MP Dual'],
    'Realme|C55':                  ['64GB', '4GB RAM', '6.72" LCD 90Hz', 'Helio G88', '64MP Dual'],
    'Realme|GT Master Edition':    ['128GB', '8GB RAM', '6.43" AMOLED', 'Snapdragon 778G', '64MP Triple'],
    'Realme|GT Neo':               ['128GB', '8GB RAM', '6.43" AMOLED', 'Dimensity 1200', '64MP Triple'],
    'Realme|X50 Pro':              ['128GB', '8GB RAM', '6.44" AMOLED', 'Snapdragon 865', '64MP Quad'],

    'iQOO|7 Legend':               ['256GB', '12GB RAM', '6.62" AMOLED 120Hz', 'Snapdragon 888', '48MP Triple'],
    'iQOO|9':                      ['256GB', '12GB RAM', '6.56" AMOLED', 'Snapdragon 888+', '50MP Triple'],
    'iQOO|Z6 Lite':                ['128GB', '6GB RAM', '6.58" LCD 120Hz', 'Snapdragon 4 Gen 1', '50MP Dual'],

    'Google|Pixel 4a 5G':          ['128GB', '6GB RAM', '6.2" OLED', 'Snapdragon 765G', '12MP Dual'],
    'Google|Pixel 5':              ['128GB', '8GB RAM', '6.0" OLED 90Hz', 'Snapdragon 765G', '12MP Dual'],
    'Google|Pixel 6a':             ['128GB', '6GB RAM', '6.1" OLED', 'Google Tensor', '12MP Dual'],

    'Motorola|Edge 30':            ['128GB', '8GB RAM', '6.5" pOLED 144Hz', 'Snapdragon 778G+', '50MP Triple'],
    'Motorola|Moto G60':           ['128GB', '6GB RAM', '6.8" LCD 120Hz', 'Snapdragon 732G', '108MP Triple'],
    'Motorola|One Fusion+':        ['128GB', '6GB RAM', '6.5" LCD', 'Snapdragon 730G', '64MP Quad'],

    'Nothing|Phone (1) 128GB':     ['128GB', '8GB RAM', '6.55" OLED 120Hz', 'Snapdragon 778G+', '50MP Dual'],
    'Nothing|Phone (2) 128GB':     ['128GB', '8GB RAM', '6.7" LTPO OLED', 'Snapdragon 8+ Gen 1', '50MP Dual'],

    'Infinix|Note 11':             ['64GB', '6GB RAM', '6.7" AMOLED', 'Helio G88', '50MP Triple'],
    'Infinix|Note 12 Pro':         ['128GB', '8GB RAM', '6.7" AMOLED', 'Helio G99', '108MP Triple'],
    'Infinix|Zero 20':             ['256GB', '8GB RAM', '6.7" AMOLED', 'Helio G99', '108MP Triple'],

    'Tecno|Camon 17':              ['128GB', '6GB RAM', '6.6" LCD 90Hz', 'Helio G85', '48MP Quad'],
    'Tecno|Phantom X':             ['256GB', '8GB RAM', '6.7" AMOLED', 'Helio G95', '50MP Triple'],
    'Tecno|Spark 9 Pro':           ['128GB', '4GB RAM', '6.6" LCD 90Hz', 'Helio G85', '50MP Dual'],

    'Lava|Agni':                   ['128GB', '8GB RAM', '6.78" LCD 90Hz', 'Dimensity 810', '64MP Quad']
  };

  /* ------------- laptops: [processor, RAM, storage, graphics, display] ---- */
  const LAPTOPS = {
    'Apple|MacBook Air 2020':      ['Core i3 10th Gen', '8GB RAM', '256GB SSD', 'Intel Iris Plus', '13.3" Retina'],
    'Apple|MacBook Air M1':        ['Apple M1', '8GB RAM', '256GB SSD', '7-core GPU', '13.3" Retina'],
    'Apple|MacBook Air M2':        ['Apple M2', '8GB RAM', '256GB SSD', '8-core GPU', '13.6" Liquid Retina'],
    'Apple|MacBook Pro 13" M1':    ['Apple M1', '8GB RAM', '256GB SSD', '8-core GPU', '13.3" Retina'],
    'Apple|MacBook Pro 14" M2':    ['Apple M2 Pro', '16GB RAM', '512GB SSD', '16-core GPU', '14.2" Liquid Retina XDR'],
    'Apple|MacBook Pro 16" M2':    ['Apple M2 Pro', '16GB RAM', '512GB SSD', '19-core GPU', '16.2" Liquid Retina XDR'],

    'Dell|XPS 13':                 ['Core i7-1250U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '13.4" FHD+'],
    'Dell|XPS 15':                 ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3050', '15.6" FHD+'],
    'Dell|XPS 17':                 ['Core i9-12900HK', '32GB RAM', '1TB SSD', 'RTX 3060', '17" UHD+'],
    'Dell|Inspiron 13 5000':       ['Core i5-1135G7', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '13.3" FHD'],
    'Dell|Inspiron 14 Plus':       ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3050', '14" 2.2K'],
    'Dell|Inspiron 15 3000':       ['Core i3-1115G4', '8GB RAM', '256GB SSD', 'Intel UHD', '15.6" FHD'],
    'Dell|Inspiron 16':            ['Core i5-1235U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '16" FHD+'],
    'Dell|Latitude 5410':          ['Core i5-10310U', '8GB RAM', '256GB SSD', 'Intel UHD', '14" FHD'],
    'Dell|Latitude 7420':          ['Core i7-1185G7', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Dell|Precision 3560':         ['Core i7-1165G7', '16GB RAM', '512GB SSD', 'NVIDIA T500', '15.6" FHD'],
    'Dell|Precision 5570':         ['Core i7-12700H', '32GB RAM', '1TB SSD', 'RTX A1000', '15.6" FHD+'],
    'Dell|Vostro 3400':            ['Core i5-1135G7', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '14" HD'],
    'Dell|Vostro 5410':            ['Core i5-11320H', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Dell|G3 15':                  ['Core i5-10300H', '8GB RAM', '512GB SSD', 'GTX 1650', '15.6" FHD 120Hz'],
    'Dell|G15 Gaming':             ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3060', '15.6" FHD 165Hz'],
    'Dell|Alienware m15':          ['Core i7-12700H', '16GB RAM', '1TB SSD', 'RTX 3070 Ti', '15.6" QHD 240Hz'],
    'Dell|Alienware x15':          ['Core i9-12900H', '32GB RAM', '1TB SSD', 'RTX 3080 Ti', '15.6" QHD 240Hz'],

    'HP|Pavilion 15':              ['Core i5-1235U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'HP|Pavilion x360':            ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD Touch'],
    'HP|Pavilion Gaming 15':       ['Ryzen 5 5600H', '8GB RAM', '512GB SSD', 'GTX 1650', '15.6" FHD 144Hz'],
    'HP|Envy 13':                  ['Core i5-1135G7', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '13.3" FHD'],
    'HP|Envy 15':                  ['Core i7-12700H', '16GB RAM', '1TB SSD', 'RTX 3050 Ti', '15.6" OLED 4K'],
    'HP|Envy x360 15':             ['Ryzen 7 5825U', '16GB RAM', '512GB SSD', 'AMD Radeon', '15.6" FHD Touch'],
    'HP|Spectre x360 13':          ['Core i7-1255U', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '13.5" 3K2K OLED'],
    'HP|Spectre x360 16':          ['Core i7-12700H', '16GB RAM', '1TB SSD', 'Intel Arc A370M', '16" 3K+ OLED'],
    'HP|Omen 15':                  ['Ryzen 7 5800H', '16GB RAM', '512GB SSD', 'RTX 3060', '15.6" FHD 144Hz'],
    'HP|Omen 16':                  ['Core i7-12700H', '16GB RAM', '1TB SSD', 'RTX 3070 Ti', '16.1" QHD 165Hz'],
    'HP|Victus 16':                ['Core i5-12450H', '16GB RAM', '512GB SSD', 'RTX 3050', '16.1" FHD 144Hz'],
    'HP|EliteBook 840':            ['Core i7-1185G7', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'HP|EliteBook 850':            ['Core i7-1165G7', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'HP|ProBook 440':              ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'HP|ProBook 450':              ['Core i5-1235U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'HP|ZBook Firefly':            ['Core i7-1165G7', '16GB RAM', '512GB SSD', 'NVIDIA T500', '15.6" FHD'],
    'HP|Chromebook x360':          ['Celeron N4020', '4GB RAM', '64GB eMMC', 'Intel UHD', '14" HD Touch'],

    'Lenovo|IdeaPad 3':            ['Ryzen 5 5500U', '8GB RAM', '512GB SSD', 'AMD Radeon', '15.6" FHD'],
    'Lenovo|IdeaPad 5':            ['Core i5-1235U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Lenovo|IdeaPad Flex 5':       ['Ryzen 5 5500U', '8GB RAM', '512GB SSD', 'AMD Radeon', '14" FHD Touch'],
    'Lenovo|IdeaPad Gaming 3':     ['Ryzen 5 6600H', '8GB RAM', '512GB SSD', 'RTX 3050', '15.6" FHD 120Hz'],
    'Lenovo|Legion 5':             ['Ryzen 7 6800H', '16GB RAM', '512GB SSD', 'RTX 3060', '15.6" FHD 165Hz'],
    'Lenovo|Legion 5 Pro':         ['Ryzen 7 6800H', '16GB RAM', '1TB SSD', 'RTX 3070', '16" QHD 165Hz'],
    'Lenovo|Legion 7':             ['Ryzen 9 6900HX', '32GB RAM', '1TB SSD', 'RTX 3080', '16" QHD 165Hz'],
    'Lenovo|Legion Slim 5':        ['Ryzen 7 7840HS', '16GB RAM', '512GB SSD', 'RTX 4060', '16" WQXGA 165Hz'],
    'Lenovo|Legion Y540':          ['Core i5-9300H', '8GB RAM', '512GB SSD', 'GTX 1650', '15.6" FHD 144Hz'],
    'Lenovo|ThinkPad E14':         ['Core i5-1235U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Lenovo|ThinkPad L14':         ['Core i5-1145G7', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Lenovo|ThinkPad T14':         ['Core i7-1165G7', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Lenovo|ThinkPad X1 Carbon':   ['Core i7-1260P', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '14" WUXGA'],
    'Lenovo|ThinkBook 14':         ['Core i5-1235U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Lenovo|ThinkBook 15':         ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'Lenovo|Yoga 7i':              ['Core i5-1240P', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" 2.8K OLED Touch'],
    'Lenovo|Yoga Slim 7':          ['Ryzen 7 5800U', '16GB RAM', '512GB SSD', 'AMD Radeon', '14" FHD'],

    'Asus|Vivobook 15':            ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'Asus|Vivobook S14':           ['Core i5-1240P', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Asus|Vivobook Pro 15':        ['Ryzen 7 5800H', '16GB RAM', '512GB SSD', 'RTX 3050', '15.6" FHD OLED'],
    'Asus|Vivobook Ultra':         ['Ryzen 5 5600H', '8GB RAM', '512GB SSD', 'AMD Radeon', '14" FHD'],
    'Asus|Zenbook 13':             ['Core i7-1165G7', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '13.3" FHD OLED'],
    'Asus|Zenbook 14':             ['Core i5-1240P', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" 2.8K OLED'],
    'Asus|Zenbook Flip 14':        ['Core i7-1260P', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '14" 2.8K OLED Touch'],
    'Asus|Zenbook Duo':            ['Core i7-1355U', '16GB RAM', '1TB SSD', 'Intel Iris Xe', 'Dual 14" OLED'],
    'Asus|ExpertBook B1':          ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Asus|ExpertBook B9':          ['Core i7-1255U', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '14" FHD'],
    'Asus|TUF Gaming A15':         ['Ryzen 7 6800H', '16GB RAM', '512GB SSD', 'RTX 3060', '15.6" FHD 144Hz'],
    'Asus|TUF Gaming F15':         ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3050', '15.6" FHD 144Hz'],
    'Asus|ROG Strix G15':          ['Ryzen 7 6800H', '16GB RAM', '512GB SSD', 'RTX 3060', '15.6" FHD 300Hz'],
    'Asus|ROG Strix G17':          ['Ryzen 9 6900HX', '16GB RAM', '1TB SSD', 'RTX 3070 Ti', '17.3" QHD 240Hz'],
    'Asus|ROG Zephyrus G14':       ['Ryzen 9 6900HS', '16GB RAM', '1TB SSD', 'RX 6800S', '14" QHD 120Hz'],
    'Asus|ROG Zephyrus M16':       ['Core i9-12900H', '32GB RAM', '1TB SSD', 'RTX 3070 Ti', '16" QHD 165Hz'],
    'Asus|ROG Flow X13':           ['Ryzen 9 6900HS', '16GB RAM', '1TB SSD', 'RTX 3050 Ti', '13.4" FHD+ Touch'],

    'Acer|Aspire 3':               ['Ryzen 3 7320U', '8GB RAM', '256GB SSD', 'AMD Radeon', '15.6" FHD'],
    'Acer|Aspire 5':               ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'Acer|Aspire 7':               ['Ryzen 5 5500U', '8GB RAM', '512GB SSD', 'GTX 1650', '15.6" FHD'],
    'Acer|Swift 3':                ['Core i5-1240P', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'Acer|Swift 5':                ['Core i7-1260P', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '14" 2.8K Touch'],
    'Acer|Spin 3':                 ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD Touch'],
    'Acer|Spin 5':                 ['Core i7-1260P', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '14" WQXGA Touch'],
    'Acer|Nitro 5':                ['Core i5-12500H', '16GB RAM', '512GB SSD', 'RTX 3050', '15.6" FHD 144Hz'],
    'Acer|Nitro 7':                ['Core i7-9750H', '16GB RAM', '512GB SSD', 'GTX 1660 Ti', '15.6" FHD 144Hz'],
    'Acer|Predator Helios 300':    ['Core i7-12700H', '16GB RAM', '1TB SSD', 'RTX 3060', '15.6" QHD 165Hz'],
    'Acer|Predator Helios 300 SE': ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3060', '14" QHD 165Hz'],
    'Acer|Predator Triton 500':    ['Core i9-11900H', '32GB RAM', '1TB SSD', 'RTX 3080', '15.6" QHD 240Hz'],
    'Acer|ConceptD 3':             ['Core i7-11800H', '16GB RAM', '1TB SSD', 'GTX 1650', '14" FHD'],
    'Acer|TravelMate P2':          ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'Acer|TravelMate P4':          ['Core i7-1260P', '16GB RAM', '1TB SSD', 'Intel Iris Xe', '14" WUXGA'],

    'MSI|Modern 14':               ['Core i5-1235U', '8GB RAM', '512GB SSD', 'Intel Iris Xe', '14" FHD'],
    'MSI|Modern 15':               ['Core i7-1255U', '16GB RAM', '512GB SSD', 'Intel Iris Xe', '15.6" FHD'],
    'MSI|Prestige 14':             ['Core i7-1280P', '16GB RAM', '1TB SSD', 'RTX 3050', '14" QHD+'],
    'MSI|Summit E14':              ['Core i7-1260P', '16GB RAM', '1TB SSD', 'RTX 3050', '14" FHD Touch'],
    'MSI|Bravo 15':                ['Ryzen 7 5800H', '16GB RAM', '512GB SSD', 'RX 6550M', '15.6" FHD 144Hz'],
    'MSI|GF63 Thin':               ['Core i5-11400H', '8GB RAM', '512GB SSD', 'RTX 3050', '15.6" FHD 144Hz'],
    'MSI|Katana GF66':             ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3060', '15.6" FHD 144Hz'],
    'MSI|Pulse GL66':              ['Core i7-12700H', '16GB RAM', '512GB SSD', 'RTX 3070', '15.6" FHD 144Hz'],
    'MSI|Sword 15':                ['Core i7-12650H', '16GB RAM', '512GB SSD', 'RTX 3050 Ti', '15.6" FHD 144Hz'],
    'MSI|GE76 Raider':             ['Core i9-12900HK', '32GB RAM', '1TB SSD', 'RTX 3080 Ti', '17.3" QHD 240Hz'],
    'MSI|GS66 Stealth':            ['Core i9-12900H', '32GB RAM', '1TB SSD', 'RTX 3080 Ti', '15.6" QHD 240Hz']
  };

  /* Fallbacks so a model added later still shows something sensible rather
     than an empty spec list. */
  function guessPhone(brand, name){
    const n = (name || '').toLowerCase();
    const pro = /pro|ultra|plus|\+|max/.test(n);
    return [
      pro ? '256GB' : '128GB',
      pro ? '12GB RAM' : '8GB RAM',
      pro ? '6.7" AMOLED' : '6.5" display',
      `${brand} flagship chipset`,
      pro ? '50MP Triple' : '50MP Dual'
    ];
  }
  function guessLaptop(brand, name){
    const n = (name || '').toLowerCase();
    const gaming = /rog|tuf|legion|nitro|predator|omen|victus|katana|pulse|raider|stealth|alienware|gaming|sword|bravo/.test(n);
    return [
      gaming ? 'Core i7 H-series' : 'Core i5 U-series',
      gaming ? '16GB RAM' : '8GB RAM',
      '512GB SSD',
      gaming ? 'RTX dedicated graphics' : 'Integrated graphics',
      gaming ? '15.6" FHD 144Hz' : '14" FHD'
    ];
  }

  /** Technical specs for a product, or null if it isn't a second-hand item. */
  function forProduct(p){
    if (!p) return null;
    const key = `${p.brand}|${p.name}`;
    if (p.category === 'second-hand-mobiles'){
      return PHONES[key] || guessPhone(p.brand, p.name);
    }
    if (p.category === 'second-hand-laptops'){
      return LAPTOPS[key] || guessLaptop(p.brand, p.name);
    }
    return null;
  }

  /** Coverage report — used by the build check to prove nothing was missed. */
  function coverage(products){
    let total = 0, exact = 0;
    products.forEach(p => {
      if (p.category !== 'second-hand-mobiles' && p.category !== 'second-hand-laptops') return;
      total++;
      const key = `${p.brand}|${p.name}`;
      if (PHONES[key] || LAPTOPS[key]) exact++;
    });
    return { total, exact, fallback: total - exact };
  }

  return { forProduct, coverage, PHONES, LAPTOPS };
})();
