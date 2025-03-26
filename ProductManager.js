const fs = require('fs').promises;
const path = require('path');

class ProductManager {
	#products;
	#nextId = 1;

	constructor() { // Alterado para nome fixo
		this.filePath = path.join(__dirname, 'produtos.json');
		this.#products = [];
	}

	async loadProducts() {
		try {
			const data = await fs.readFile(this.filePath, 'utf-8');
			this.#products = JSON.parse(data);
			// Gera o próximo id baseado no maior id existente
			this.#nextId = this.#products.reduce((max, prod) => (prod.id > max ? prod.id : max), 0) + 1;
		} catch (error) {
			if (error.code === 'ENOENT') {
				this.#products = [];
				this.#nextId = 1;
				await fs.writeFile(this.filePath, JSON.stringify(this.#products, null, 2));
			} else {
				console.error("Erro ao carregar produtos:", error);
			}
		}
	}

	async saveProducts() {
		try {
			await fs.writeFile(this.filePath, JSON.stringify(this.#products, null, 2));
		} catch (error) {
			console.error("Erro ao salvar produtos:", error);
		}
	}
	async addProduct(productData) {
      
    // Desestruture os dados para continuar com a criação do produto
    const { title, description, code, price, stock, category, thumbnails } = productData;

		// Validação de tipos numéricos (Novo)
		if (typeof price !== 'number' || typeof stock !== 'number') {
			throw new Error("Preço e estoque devem ser números");
		}

		// Verifica se os campos obrigatórios estão presentes
		if (!title || !description || !code || price === undefined || stock === undefined || !category) {
			throw new Error("Campos obrigatórios ausentes");
		}

		if (this.#products.some(product => product.code === code)) {
			throw new Error("Código do produto já existe");
		}

		const newProduct = {
			id: this.#nextId++,
			title,
			description,
			code,
			price,
			status: true, // true por padrão
			stock,
			category,
			thumbnails: Array.isArray(thumbnails) ? thumbnails : []
		};

		this.#products.push(newProduct);
		await this.saveProducts();
		return newProduct;
	}

	async getProducts() {
		await this.loadProducts();
		return this.#products;
	}

	async getProductById(id) {
		await this.loadProducts();
		return this.#products.find(product => product.id === Number(id)) || null;
	}

	async updateProduct(id, updatedFields) {
		await this.loadProducts();
		const index = this.#products.findIndex(product => product.id === Number(id));
		if (index === -1) {
			throw new Error("Produto não encontrado");
		}
		// Impede atualização do id
		if ('id' in updatedFields) delete updatedFields.id;
		const updatedProduct = { ...this.#products[index], ...updatedFields };
		this.#products[index] = updatedProduct;
		await this.saveProducts();
		return updatedProduct;
	}

	async deleteProduct(id) {
		await this.loadProducts();
		const index = this.#products.findIndex(product => product.id === Number(id));
		if (index === -1) {
			throw new Error("Produto não encontrado");
		}
		const deletedProduct = this.#products.splice(index, 1)[0];
		await this.saveProducts();
		return deletedProduct;
	}
}

module.exports = ProductManager;
