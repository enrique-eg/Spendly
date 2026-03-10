# Database Documentation

This document explains the database structure used in the project.
The backend is implemented using **Supabase**, which provides:

* PostgreSQL database
* Authentication
* API access
* Row Level Security (RLS)

All application data is stored in PostgreSQL tables under the **public schema**.

---

# Architecture Overview

Authentication is handled by Supabase.

```
auth.users
    ↓
profiles
    ↓
accounts
    ↓
transactions
```

Each authenticated user has:

* one **profile**
* multiple **accounts**
* multiple **transactions**
* budgets
* saving goals
* subscriptions

Row Level Security ensures that users can only access **their own data**.

---

# Tables

## profiles

Stores additional user information linked to Supabase authentication.

| Column           | Type        | Description                             |
| ---------------- | ----------- | --------------------------------------- |
| id               | uuid        | Primary key, references `auth.users.id` |
| username         | text        | Display name                            |
| default_currency | text        | Default currency for the user           |
| created_at       | timestamptz | Creation timestamp                      |
| updated_at       | timestamptz | Last update timestamp                   |

Profiles are automatically created using a **database trigger when a new user registers**.

---

## currencies

List of supported currencies.

| Column | Type | Description                    |
| ------ | ---- | ------------------------------ |
| code   | text | Currency code (EUR, USD, etc.) |
| name   | text | Currency name                  |
| symbol | text | Currency symbol                |

Example:

```
EUR - Euro
USD - US Dollar
```

---

## exchange_rates

Stores currency exchange rates.

| Column        | Type        | Description     |
| ------------- | ----------- | --------------- |
| id            | uuid        | Primary key     |
| from_currency | text        | Source currency |
| to_currency   | text        | Target currency |
| rate          | numeric     | Conversion rate |
| updated_at    | timestamptz | Last update     |

Used to convert transaction values between currencies.

---

## accounts

Represents financial accounts belonging to users.

Examples:

* bank account
* cash
* credit card
* digital wallet

| Column     | Type        | Description               |
| ---------- | ----------- | ------------------------- |
| id         | uuid        | Primary key               |
| user_id    | uuid        | Owner of the account      |
| name       | text        | Account name              |
| type       | text        | Account type              |
| currency   | text        | Account currency          |
| is_active  | boolean     | Whether account is active |
| created_at | timestamptz | Creation date             |
| updated_at | timestamptz | Last update               |

---

## categories

Transaction categories.

There are two types:

* **Global categories** (`user_id = null`)
* **User categories** (`user_id = user id`)

| Column     | Type        | Description           |
| ---------- | ----------- | --------------------- |
| id         | uuid        | Primary key           |
| user_id    | uuid        | Owner of the category |
| name       | text        | Category name         |
| type       | text        | income / expense      |
| created_at | timestamptz | Creation date         |

Example categories:

```
Salary
Food
Transport
Entertainment
```

---

## transactions

Central table for all financial activity.

A transaction can be:

* **income**
* **expense**
* **transfer**

| Column           | Type        | Description                         |
| ---------------- | ----------- | ----------------------------------- |
| id               | uuid        | Primary key                         |
| user_id          | uuid        | Owner of transaction                |
| account_id       | uuid        | Account where transaction occurred  |
| category_id      | uuid        | Transaction category                |
| type             | text        | income / expense / transfer         |
| amount           | numeric     | Original amount                     |
| currency         | text        | Transaction currency                |
| exchange_rate    | numeric     | Conversion rate                     |
| amount_converted | numeric     | Converted value                     |
| from_account_id  | uuid        | Source account (for transfers)      |
| to_account_id    | uuid        | Destination account (for transfers) |
| description      | text        | Transaction description             |
| transaction_date | timestamptz | Date of transaction                 |
| created_at       | timestamptz | Creation timestamp                  |

Transfers use:

```
from_account_id
to_account_id
```

---

## budgets

Defines spending limits.

Budgets can apply to:

* a user
* an account
* a category
* both account + category

| Column       | Type    | Description               |
| ------------ | ------- | ------------------------- |
| id           | uuid    | Primary key               |
| user_id      | uuid    | Owner                     |
| account_id   | uuid    | Optional account          |
| category_id  | uuid    | Optional category         |
| limit_amount | numeric | Budget limit              |
| currency     | text    | Currency                  |
| period       | text    | weekly / monthly / yearly |
| start_date   | date    | Start of budget           |
| end_date     | date    | End of budget             |

---

## saving_goals

Represents savings targets.

Example:

```
Trip to Japan
Target: 2000€
```

| Column        | Type    | Description       |
| ------------- | ------- | ----------------- |
| id            | uuid    | Primary key       |
| user_id       | uuid    | Owner             |
| account_id    | uuid    | Linked account    |
| name          | text    | Goal name         |
| target_amount | numeric | Target amount     |
| currency      | text    | Currency          |
| deadline      | date    | Optional deadline |

Progress is calculated from transactions.

---

## subscriptions

Represents recurring payments.

Examples:

```
Netflix
Spotify
Gym membership
```

| Column      | Type    | Description                    |
| ----------- | ------- | ------------------------------ |
| id          | uuid    | Primary key                    |
| user_id     | uuid    | Owner                          |
| account_id  | uuid    | Payment account                |
| category_id | uuid    | Category                       |
| name        | text    | Subscription name              |
| amount      | numeric | Subscription cost              |
| currency    | text    | Currency                       |
| billing_day | integer | Day of month for payment       |
| is_active   | boolean | Whether subscription is active |

Subscriptions may generate automatic transactions.

---

# Accessing Data From the Frontend

All tables can be accessed using the **Supabase client**.

Example:

```javascript
const { data, error } = await supabase
  .from("transactions")
  .select("*")
```

Example filtering by user:

```javascript
const { data } = await supabase
  .from("accounts")
  .select("*")
```

Because of **Row Level Security**, the API automatically returns only the records belonging to the authenticated user.

---

# Security

The project uses **Row Level Security (RLS)**.

This means:

* users can only read their own data
* users can only modify their own data
* shared tables like currencies are read-only

Example policy logic:

```
auth.uid() = user_id
```

---

# Automatic Profile Creation

A database trigger automatically creates a profile when a user registers.

```
auth.users
   ↓
trigger
   ↓
profiles
```

This ensures every authenticated user has a corresponding profile.

---

# Summary

Main tables in the system:

```
profiles
accounts
transactions
categories
budgets
saving_goals
subscriptions
currencies
exchange_rates
```

These tables support the following features:

* income and expense tracking
* multiple accounts
* budgeting
* savings goals
* recurring subscriptions
* currency conversion
* financial analysis
