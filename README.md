# TechNest

TechNest is a web-based e-commerce platform for mobile accessories and gadgets. The system allows customers to browse products, search by category, add items to a cart, place orders with Cash on Delivery, and view their order history.

This project is developed as a final-year project and is built using Django with a custom front-end design using HTML, CSS, and JavaScript.

## Project Overview

Mobile accessories such as phone covers, chargers, earbuds, power banks, and other gadgets are widely used by students and customers. In local markets, users often need to visit multiple shops to compare prices and availability. TechNest solves this problem by creating a single online store where customers can purchase products more easily and efficiently.

## Main Features

- User registration and login
- Product catalog with categories
- Search and filter options
- Product detail pages
- Shopping cart
- Cash on Delivery checkout
- Order history
- Admin panel for managing products, orders, and users
- Responsive design for mobile and desktop devices

## Objectives

- Develop a responsive e-commerce website for mobile accessories and gadgets
- Implement secure user authentication
- Provide a searchable and categorized product catalog
- Support cart and checkout flow
- Provide order tracking and order history
- Build an admin panel for managing business operations
- Complete and test the project within the project timeline

## Technology Stack

- Python
- Django
- SQLite
- HTML
- CSS
- JavaScript
- Git and GitHub

## Local Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the environment:

For Windows:

```bash
venv\Scripts\activate
```

For macOS/Linux:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Apply migrations:

```bash
python manage.py migrate
```

5. Run the server:

```bash
python manage.py runserver
```

6. Open the website:

```text
http://127.0.0.1:8000/
```

## Important Notes

- SQLite is used for development and testing.
- Sensitive settings such as secret keys should not be committed publicly.

## Future Improvements

- online payment integration
- email and SMS notifications
- customer reviews and ratings
- improved inventory management
- admin dashboard enhancements
- deployment on a live hosting platform

## Academic Context

This project is developed as a final-year project to demonstrate practical full-stack web development. It includes requirement analysis, database design, authentication, e-commerce workflows, testing, and project documentation.

## License

This project is for educational and academic use.
