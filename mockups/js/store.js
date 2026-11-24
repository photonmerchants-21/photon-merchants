const Photon = (() => {
  const STATUSES = [
    { id: "placed", label: "Order placed" },
    { id: "paid", label: "Payment confirmed" },
    { id: "processing", label: "Order being processed" },
    { id: "packed", label: "Packed and ready for dispatch" },
    { id: "dispatched", label: "Dispatched" },
    { id: "out", label: "Out for delivery" },
    { id: "delivered", label: "Delivered" },
  ];

  const AREAS = [
    { id: "parklands", label: "Parklands", fee: 250 },
    { id: "westlands", label: "Westlands", fee: 350 },
    { id: "cbd", label: "Nairobi CBD", fee: 300 },
    { id: "kilimani", label: "Kilimani", fee: 350 },
    { id: "eastlands", label: "Eastlands", fee: 450 },
  ];

  const PRODUCTS = [
    {
      id: "rift-duvet",
      name: "Rift Linen Duvet Set",
      category: "beddings",
      catLabel: "Beddings",
      price: 8900,
      compare: 12500,
      stock: 14,
      img: "duvet-set.jpg",
      gallery: ["duvet-set.jpg", "duvet-detail.jpg", "hero-bedroom.jpg"],
      blurb: "Stonewashed oat linen with a terracotta throw-in. Cool in the heat, warm enough for Nairobi nights.",
      specs: "King or Queen. 100% European flax linen, stonewashed. Duvet cover, two pillowcases, and a throw. Machine wash 40°C.",
      featured: true,
      sale: true,
      newest: true,
      sold: 86,
      sizes: ["Queen", "King"],
    },
    {
      id: "cloud-pillows",
      name: "Cloud Cotton Pillow Pair",
      category: "beddings",
      catLabel: "Beddings",
      price: 2450,
      img: "pillow-pair.jpg",
      gallery: ["pillow-pair.jpg"],
      blurb: "Two medium-loft pillows in a tight cotton tick. Soft without collapsing.",
      specs: "Standard 50 × 75 cm. Cotton cover, hollowfibre fill. Pair of two.",
      featured: true,
      newest: true,
      sold: 124,
    },
    {
      id: "sand-sheets",
      name: "Sand Cotton Sheet Set",
      category: "beddings",
      catLabel: "Beddings",
      price: 4200,
      img: "sheet-set.jpg",
      gallery: ["sheet-set.jpg"],
      blurb: "Percale sheets in a warm sand. Crisp on the first night, softer after every wash.",
      specs: "Fitted sheet, flat sheet, two pillowcases. 200 thread count percale.",
      sold: 61,
    },
    {
      id: "ember-throw",
      name: "Ember Cotton Throw",
      category: "beddings",
      catLabel: "Beddings",
      price: 2850,
      img: "throw.jpg",
      gallery: ["throw.jpg"],
      blurb: "A heavy terracotta throw for the foot of the bed or the armchair by the window.",
      specs: "130 × 180 cm. Cotton. Fringed ends.",
      newest: true,
      sold: 40,
    },
    {
      id: "stone-cookware",
      name: "Stone Cookware Trio",
      category: "kitchenware",
      catLabel: "Kitchenware",
      price: 9800,
      img: "cookware-set.jpg",
      gallery: ["cookware-set.jpg", "kitchen-scene.jpg"],
      blurb: "Casserole, saucepan, and skillet in stainless steel. Built for a gas or electric hob.",
      specs: "Stainless steel, oven-safe to 220°C. Induction compatible.",
      featured: true,
      sold: 38,
    },
    {
      id: "safari-blender",
      name: "Safari Chef Blender 1000W",
      category: "kitchenware",
      catLabel: "Kitchenware",
      price: 6750,
      compare: 7990,
      img: "blender.jpg",
      gallery: ["blender.jpg"],
      blurb: "Glass jug, charcoal base, and enough power for soup, juice, or a Saturday smoothie.",
      specs: "1000W. 1.5 litre glass jug. Two speeds plus pulse.",
      sale: true,
      sold: 73,
    },
    {
      id: "copper-kettle",
      name: "Copper Kettle 1.7L",
      category: "kitchenware",
      catLabel: "Kitchenware",
      price: 2890,
      img: "kettle.jpg",
      gallery: ["kettle.jpg"],
      blurb: "Brushed copper that looks like it belongs on the counter, even when it is off.",
      specs: "1.7 litres. Auto shut-off. 360° base.",
      newest: true,
      sold: 91,
    },
    {
      id: "photon-tv",
      name: "Photon LED Smart TV 43\"",
      category: "electronics",
      catLabel: "Electronics",
      price: 28900,
      compare: 34900,
      img: "smart-tv.jpg",
      gallery: ["smart-tv.jpg"],
      blurb: "A slim 43-inch set for the sitting room. HDMI, USB, and Wi-Fi, without the extra boxes.",
      specs: "43\" Full HD. 3 × HDMI, 2 × USB. Android TV.",
      featured: true,
      sale: true,
      sold: 22,
    },
    {
      id: "breeze-fan",
      name: "Breeze Pedestal Fan 16\"",
      category: "electronics",
      catLabel: "Electronics",
      price: 4200,
      img: "fan.jpg",
      gallery: ["fan.jpg"],
      blurb: "Quiet enough for a bedroom. Three speeds and a wide sweep for a Nairobi afternoon.",
      specs: "16 inch. Height adjustable. Oscillating.",
      newest: true,
      sold: 55,
    },
  ];

  const root = () => document.body.dataset.root || ".";
  const img = (file) => `${root()}/img/${file}`;
  const page = (file) => `${root()}/${file}`;

  const kes = (n) =>
    "KES " + Number(n).toLocaleString("en-KE");

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const cart = () => read("photon-cart", []);
  const setCart = (items) => {
    write("photon-cart", items);
    paintBadges();
  };

  const addToCart = (id, size, qty = 1) => {
    const items = cart();
    const i = items.findIndex((x) => x.id === id && x.size === size);
    if (i >= 0) items[i].qty += qty;
    else items.push({ id, size: size || "", qty });
    setCart(items);
  };

  const product = (id) => PRODUCTS.find((p) => p.id === id);

  const cartTotal = () =>
    cart().reduce((sum, line) => {
      const p = product(line.id);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);

  const mark = () => `
    <svg class="mark" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <path d="M18 7.5v21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M18 7.5c6 5 8.5 9 8.5 10.5S24 23 18 28.5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/>
    </svg>`;

  const logo = () => `
    <a class="logo" href="${page("index.html")}">
      ${mark()}
      <span class="wordmark"><strong>Photon</strong><small>Merchants</small></span>
    </a>`;

  const paintBadges = () => {
    const count = cart().reduce((n, l) => n + l.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
  };

  const chrome = (active) => {
    const q = new URLSearchParams(location.search).get("q") || "";
    document.getElementById("chrome-header").innerHTML = `
      <div class="topbar">
        <div>Parklands, Nairobi · Open 8:30–18:00</div>
        <div><a href="https://wa.me/254741220118">WhatsApp 0741 220 118</a> <span>·</span> M-Pesa and cards</div>
      </div>
      <div class="header">
        <div class="header-row">
          ${logo()}
          <form class="search" action="${page("search.html")}">
            <input name="q" value="${q.replaceAll('"', "&quot;")}" placeholder="Search linen, kettles, fans…" aria-label="Search">
            <button type="submit">Search</button>
          </form>
          <div class="header-actions">
            <a class="icon-btn" href="${page("track.html")}">Orders</a>
            <a class="icon-btn" href="${page("cart.html")}">Bag<span class="badge" data-cart-count hidden>0</span></a>
          </div>
        </div>
        <nav class="cats">
          <a href="${page("category.html")}?c=beddings" class="${active === "beddings" ? "is-on" : ""}">Beddings</a>
          <a href="${page("category.html")}?c=kitchenware" class="${active === "kitchenware" ? "is-on" : ""}">Kitchenware</a>
          <a href="${page("category.html")}?c=electronics" class="${active === "electronics" ? "is-on" : ""}">Electronics</a>
          <a href="${page("index.html")}#offers">Offers</a>
        </nav>
      </div>`;

    document.getElementById("chrome-footer").innerHTML = `
      <footer class="footer">
        <div class="footer-grid">
          <div>
            ${logo()}
            <p>Home, kitchen, and light for Nairobi houses. Collect from Parklands or we bring it to your gate.</p>
            <a class="wa" href="https://wa.me/254741220118">Chat on WhatsApp</a>
          </div>
          <div>
            <h4>Shop</h4>
            <p><a href="${page("category.html")}?c=beddings">Beddings</a><br>
            <a href="${page("category.html")}?c=kitchenware">Kitchenware</a><br>
            <a href="${page("category.html")}?c=electronics">Electronics</a></p>
          </div>
          <div>
            <h4>Visit</h4>
            <p>Photon Merchants<br>Ring Road, Parklands<br>Nairobi<br>0741 220 118</p>
          </div>
          <div>
            <h4>Follow</h4>
            <p>Facebook<br>Instagram<br>TikTok</p>
            <p style="margin-top:18px"><a href="${page("desk/index.html")}" style="color:#cbbfaa">Staff desk</a></p>
          </div>
        </div>
      </footer>
      <a class="float-wa" href="https://wa.me/254741220118">WhatsApp</a>
      <nav class="bottom-nav">
        <a class="${active === "home" ? "is-on" : ""}" href="${page("index.html")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"/></svg>
          Home
        </a>
        <a class="${["beddings","kitchenware","electronics"].includes(active) ? "is-on" : ""}" href="${page("category.html")}?c=beddings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          Shop
        </a>
        <a class="${active === "cart" ? "is-on" : ""}" href="${page("cart.html")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 7h15l-1.4 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L5 4H3"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>
          Bag
        </a>
        <a class="${active === "track" ? "is-on" : ""}" href="${page("track.html")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>
          Track
        </a>
      </nav>`;
    paintBadges();
  };

  const card = (p) => `
    <a class="card" href="${page("product.html")}?id=${p.id}">
      <div class="card-img">
        ${p.sale ? '<span class="pill-sale">Offer</span>' : ""}
        <img src="${img(p.img)}" alt="${p.name}">
      </div>
      <div class="card-body">
        <p class="kicker">${p.catLabel}</p>
        <h3>${p.name}</h3>
        <p class="price">${p.compare ? `<s>${kes(p.compare)}</s>` : ""}<b>${kes(p.price)}</b></p>
      </div>
    </a>`;

  const checkout = () =>
    read("photon-checkout", {
      name: "Amina Otieno",
      phone: "0741 220 118",
      email: "amina.otieno@email.com",
      method: "delivery",
      area: "westlands",
      address: "12 School Lane, Westlands",
    });

  const order = () => read("photon-order", null);

  return {
    PRODUCTS,
    STATUSES,
    AREAS,
    root,
    img,
    page,
    kes,
    cart,
    setCart,
    addToCart,
    product,
    cartTotal,
    chrome,
    card,
    checkout,
    setCheckout: (c) => write("photon-checkout", c),
    order,
    setOrder: (o) => write("photon-order", o),
    paintBadges,
    mark,
  };
})();
