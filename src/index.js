const express = require('express');
const { v4: uuidv4 } =  require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(
        customer => customer.cpf === cpf
    );

    if (!customer) {
        response.status(400).json({ error: "Customer not found!" });
    }

    request.customer = customer;

    return next();
}

// Get balance
/**
 * statement - []
 */
function getBalance(statement) {

    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
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

// Modify an account
/**
 * name - string
 */
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

// Get an account
app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
});

// Delete an account
app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    // splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

// Get balance
app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});

// Search statement
/**
 * cpf - string
 */
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

// Search statement by date
/**
 * cpf - string
 * date - date
 */
app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) =>
        statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.json(statement);
});

// Deposit
/**
 * description - string
 * amount - number
 * type - string
 * created_at - date
 */
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        type: "credit",
        created_at: new Date(),
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

// Withdraw
/**
 * amount - number
 * type - string
 * created_at - date
 */
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        response.status(400).json({ error: "Insufficient funds!" });
    }

    const statementOperation = {
        amount,
        type: "debit",
        created_at: new Date(),
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.listen(3333);