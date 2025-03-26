const express = require('express');
const ProductManager = require('./ProductManager');
const CartManager = require('./CartManager');

const app = express();
app.use(express.json());

const productManager = new ProductManager();
const cartManager = new CartManager();

// Rotas de produtos
const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        const limitedProducts = req.query.limit 
            ? products.slice(0, Number(req.query.limit)) 
            : products;
        res.json(limitedProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

productsRouter.get('/:pid', async (req, res) => {
    try {
        const product = await productManager.getProductById(Number(req.params.pid));
        res.json(product);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

productsRouter.post('/', async (req, res) => {
    try {
        const newProduct = await productManager.addProduct(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

productsRouter.put('/:pid', async (req, res) => {
    try {
        const updatedProduct = await productManager.updateProduct(
            Number(req.params.pid),
            req.body
        );
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

productsRouter.delete('/:pid', async (req, res) => {
    try {
        await productManager.deleteProduct(Number(req.params.pid));
        res.status(204).end();
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Rotas de carrinhos
const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

cartsRouter.get('/:cid', async (req, res) => {
    try {
        const cart = await cartManager.getCartById(Number(req.params.cid));
        res.json(cart.products);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const products = await cartManager.addProductToCart(
            Number(req.params.cid),
            Number(req.params.pid)
        );
        res.json(products);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Registrar rotas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Iniciar servidor
app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080');
});