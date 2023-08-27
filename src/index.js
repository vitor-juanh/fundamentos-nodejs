const express = require('express');
const { v4: uuidv4 } =  require("uuid");

const app = express();

app.use(express.json());

const customers = [];
// Middleware

function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.params;

    const customer = customers.find(
        customer => customer.cpf === cpf
    );

    if (!customer) {
        response.status(400).json({ error: "Customer not found!" });
    }

    request.customer = customer;

    return next();
}

// Routes

// Create an account
/**
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */
app.post('/account', (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        response.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send();
});

// Search statement
/**
 * cpf - string
 */
app.get('/statement/:cpf', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

app.listen(3333);