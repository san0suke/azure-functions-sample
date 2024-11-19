import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

type Product = {
    id: string;
    name: string;
    price: number;
};

const products: Record<string, Product> = {};

export async function product(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`HTTP function processed request for url "${request.url}"`);

    const method = request.method.toUpperCase();
    const productId = request.query.get("id");

    switch (method) {
        case "GET": {
            if (productId) {
                const product = products[productId];
                if (product) {
                    return { body: JSON.stringify({ success: true, data: product }), status: 200 };
                } else {
                    return { body: JSON.stringify({ success: false, message: `Product with ID "${productId}" not found.` }), status: 404 };
                }
            } else {
                return { body: JSON.stringify({ success: true, data: Object.values(products) }), status: 200 };
            }
        }
        case "POST": {
            const { id, name, price } = (await request.json()) as Product;
            if (!id || !name || !price) {
                return { body: JSON.stringify({ success: false, message: "Invalid product data. 'id', 'name', and 'price' are required." }), status: 400 };
            }
            products[id] = { id, name, price };
            return { body: JSON.stringify({ success: true, message: `Product with ID "${id}" created.` }), status: 201 };
        }
        case "PUT": {
            if (!productId) {
                return { body: JSON.stringify({ success: false, message: "Product ID is required for updating." }), status: 400 };
            }
            const { name, price } = (await request.json()) as Partial<Product>;
            const product = products[productId];
            if (!product) {
                return { body: JSON.stringify({ success: false, message: `Product with ID "${productId}" not found.` }), status: 404 };
            }
            if (name) product.name = name;
            if (price) product.price = price;
            return { body: JSON.stringify({ success: true, message: `Product with ID "${productId}" updated.` }), status: 200 };
        }
        case "DELETE": {
            if (!productId) {
                return { body: JSON.stringify({ success: false, message: "Product ID is required for deletion." }), status: 400 };
            }
            const product = products[productId];
            if (!product) {
                return { body: JSON.stringify({ success: false, message: `Product with ID "${productId}" not found.` }), status: 404 };
            }
            delete products[productId];
            return { body: JSON.stringify({ success: true, message: `Product with ID "${productId}" deleted.` }), status: 200 };
        }
        default: {
            return { body: JSON.stringify({ success: false, message: `Method ${method} not allowed.` }), status: 405 };
        }
    }
}

app.http('product', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    handler: product
});
