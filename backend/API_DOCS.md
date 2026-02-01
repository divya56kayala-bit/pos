# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login user | No |
| POST | `/auth/register` | Create new staff/admin | Yes (Admin) |
| GET | `/auth/users` | List all users | Yes (Admin) |

## Products
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | List all products | Yes |
| GET | `/products/:id` | Get product details | Yes |
| POST | `/products` | Create product | Yes (Admin) |
| PUT | `/products/:id` | Update product | Yes (Admin) |
| DELETE | `/products/:id` | Delete product | Yes (Admin) |

## Categories
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | List all categories | Yes |
| GET | `/categories/:id` | Get category details | Yes |
| POST | `/categories` | Create category | Yes (Admin) |
| PUT | `/categories/:id` | Update category | Yes (Admin) |
| DELETE | `/categories/:id` | Delete category | Yes (Admin) |

## Customers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/customers` | List all customers | Yes |
| GET | `/customers/:id` | Get customer details | Yes |
| POST | `/customers` | Create customer | Yes |
| PUT | `/customers/:id` | Update customer | Yes |
| DELETE | `/customers/:id` | Delete customer | Yes |

## Billing
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bills` | Create invoice & reduce stock | Yes |
| GET | `/bills` | List all invoices | Yes |
| GET | `/bills/:id` | Get invoice details | Yes |

## Reports
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/reports/daily` | Daily sales (Query: `?date=YYYY-MM-DD`) | Yes (Admin) |
| GET | `/reports/monthly` | Monthly sales (Query: `?year=2024&month=5`) | Yes (Admin) |

## Switching to MongoDB
1. Set `USE_MONGO=true` in `.env`.
2. Set valid `MONGO_URI` in `.env`.
3. Restart server.
4. The system will automatically use MongoDB via Mongoose Models.
