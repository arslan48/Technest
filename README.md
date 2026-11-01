# TechNest – Student Marketplace

TechNest is a Django-based student marketplace designed for buying, selling, and exchanging used academic items within a campus community.

The platform helps students find affordable books, calculators, laptops, stationery, and other study-related items without depending on informal WhatsApp groups or general marketplace websites. It is built for a student-focused environment where only registered students can list and buy items.

## Project Aim

Many students spend a large amount of money on academic items that are used only for a short time. After a semester or year, these items become unused while junior students still need them.

TechNest gives students a simple and trusted marketplace where they can:

- sell used academic items
- buy needed study materials at lower prices
- exchange items with other students
- browse listings by category and price
- contact sellers directly
- save favorite items
- report suspicious or unwanted listings

## Main Features

- Student registration and login
- Add, edit, and delete listings
- Upload product or item images
- Search by item name
- Filter listings by category and price
- View product details
- Save favorite items
- Contact sellers or ask about an item
- Mark listings as sold or unavailable
- Admin moderation panel for managing users and listings
- Clean responsive design using custom HTML, CSS, and JavaScript

## Project Scope

This project focuses on a student marketplace for academic items and includes:

- user accounts
- listing management
- product search and filtering
- item categories
- contact requests
- favorites
- admin moderation

It does not include online payment, delivery services, or public access for non-students in the first version.

## Technology Stack

- Python
- Django
- SQLite (used for development)
- HTML
- CSS
- JavaScript
- Pillow for image handling

## Why This Project Matters

This platform helps students save money, reduce waste, and make it easier to reuse useful academic materials. It also creates a safer buying and selling environment than public classified websites because users are connected through a college-based student system.

## Local Setup

1. Open a terminal in the project folder.
2. Create a virtual environment:

```bash
python -m venv venv
```

On Windows:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Apply database migrations:

```bash
python manage.py migrate
```

5. Start the development server:

```bash
python manage.py runserver
```

6. Open the website in your browser:

```text
http://127.0.0.1:8000/
```

## Important Notes

- This project is designed for academic and educational purposes.
- SQLite is used for development and testing.
- For deployment, the project should be updated with stronger security and production-ready settings.
- Secret keys and sensitive environment values should not be committed publicly.

## Future Improvements

- email verification for student accounts
- better admin dashboard
- messaging system between buyer and seller
- exchange request management
- improved filtering and sorting
- mobile-friendly upgrade
- live deployment on a hosting platform

## Academic Context

This project is developed as a final-year project for a student-focused marketplace application. The goal is to build a practical web platform that supports campus trading, reduces unnecessary waste, and makes academic resources more affordable for students.

## License

This project is for educational and academic use.
