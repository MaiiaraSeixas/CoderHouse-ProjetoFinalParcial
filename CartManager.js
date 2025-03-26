const fs = require('fs').promises;
const path = require('path');

class CartManager {
  #carts;
  #nextId = 1;

  constructor() {
    this.filePath = path.join(__dirname, 'carrito.json');
    this.#carts = [];
  }

  async loadCarts() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      this.#carts = JSON.parse(data) || [];
      this.#nextId = this.#carts.reduce((max, cart) => (cart.id > max ? cart.id : max), 0) + 1;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.#carts = [];
        this.#nextId = 1;
        await this.saveCarts();
      } else {
        console.error("Erro ao carregar carrinhos:", error);
      }
    }
  }

  async saveCarts() {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.#carts, null, 2));
    } catch (error) {
      console.error("Erro ao salvar carrinhos:", error);
    }
  }

  async createCart() {
    await this.loadCarts();
    const newCart = {
      id: this.#nextId++,
      products: []
    };
    this.#carts.push(newCart);
    await this.saveCarts();
    return newCart;
  }

  async getCartById(id) {
    await this.loadCarts();
    const cart = this.#carts.find(cart => cart.id === Number(id)) || null;
    return cart ? { id: cart.id, products: cart.products || [] } : null;
  }

  async addProductToCart(cartId, productId) {
    await this.loadCarts();
    const cartIndex = this.#carts.findIndex(cart => cart.id === Number(cartId));
    if (cartIndex === -1) {
      throw new Error("Carrinho não encontrado");
    }
    
    const cart = this.#carts[cartIndex];
    if (!cart.products) cart.products = [];
    
    const prodIndex = cart.products.findIndex(item => item.product === Number(productId));
    if (prodIndex !== -1) {
      cart.products[prodIndex].quantity += 1;
    } else {
      cart.products.push({ product: Number(productId), quantity: 1 });
    }
    
    this.#carts[cartIndex] = cart;
    await this.saveCarts();
    return cart;
  }
}

module.exports = CartManager;
